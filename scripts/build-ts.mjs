import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const distRoot = path.join(root, "dist");

async function ensureDir(filePath) {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
}

async function listTsFiles(dir) {
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function toOutputPath(tsFile) {
  const rel = path.relative(srcRoot, tsFile);

  if (rel === "server.ts") {
    return path.join(distRoot, "server.js");
  }

  if (rel.startsWith(`lib${path.sep}`)) {
    return path.join(distRoot, rel.replace(/\.ts$/, ".js"));
  }

  if (rel.startsWith(`public${path.sep}scripts${path.sep}`)) {
    const localRel = rel.slice(`public${path.sep}scripts${path.sep}`.length);
    return path.join(root, "public", "scripts", localRel.replace(/\.ts$/, ".js"));
  }

  if (rel === "script.ts") {
    return path.join(root, "script.js");
  }

  if (rel.startsWith(`tests${path.sep}`)) {
    return path.join(root, path.basename(rel).replace(/\.ts$/, ".js"));
  }

  return path.join(distRoot, rel.replace(/\.ts$/, ".js"));
}

async function transpileFile(tsFile) {
  const raw = await fsPromises.readFile(tsFile, "utf8");
  const output = stripTypeScriptTypes(raw, {
    mode: "transform",
    sourceMap: false,
    sourceUrl: path.relative(root, tsFile)
  });
  const outFile = toOutputPath(tsFile);
  await ensureDir(outFile);
  await fsPromises.writeFile(outFile, output, "utf8");
}

async function buildAll() {
  const tsFiles = await listTsFiles(srcRoot);
  await Promise.all(tsFiles.map((file) => transpileFile(file)));
  console.log(`[ts-build] built ${tsFiles.length} files`);
}

function watchMode() {
  let timer = null;

  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await buildAll();
      } catch (error) {
        console.error("[ts-build] build failed", error);
      }
    }, 120);
  };

  buildAll().catch((error) => {
    console.error("[ts-build] initial build failed", error);
  });

  fs.watch(srcRoot, { recursive: true }, (_eventType, fileName) => {
    if (!fileName || !fileName.endsWith(".ts")) {
      return;
    }
    rebuild();
  });

  console.log("[ts-build] watching src/**/*.ts");
}

if (process.argv.includes("--watch")) {
  watchMode();
} else {
  buildAll().catch((error) => {
    console.error("[ts-build] build failed", error);
    process.exitCode = 1;
  });
}
