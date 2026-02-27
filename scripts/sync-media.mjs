#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, "public", "media", "source");
const optimizedDir = path.join(rootDir, "public", "media", "optimized");
const mediaJsonPath = path.join(rootDir, "content", "media.json");

const MAX_IG_IMAGES = 24;
const MAX_IG_VIDEOS = 6;
const MAX_YANDEX_IMAGES = 16;
const MAX_2GIS_IMAGES = 10;

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const INSTAGRAM_PROFILE_API = "https://www.instagram.com/api/v1/users/web_profile_info/?username=white_lab.dent";
const YANDEX_PAGE_URL = "https://yandex.ru/maps/org/white_lab/19571299710/?ll=35.860665%2C56.885481&z=16";
const TWOGIS_PAGE_URL = "https://2gis.ru/tver/firm/70000001099930225";

const MIME_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm"
};

function sha(input) {
  return createHash("sha1").update(input).digest("hex").slice(0, 10);
}

function safeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "asset";
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

async function ensureDirs() {
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(optimizedDir, { recursive: true });
}

async function cleanDir(dirPath) {
  const items = await fs.readdir(dirPath).catch(() => []);
  await Promise.all(
    items.map(async (item) => {
      await fs.unlink(path.join(dirPath, item)).catch(() => {});
    })
  );
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      ...headers
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function parseUrlsFromRegex(content, regex) {
  const out = [];
  const seen = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[0];
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

function normalizeMediaUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

async function loadInstagramLinks() {
  const filePath = "/tmp/white_lab_ig_api.json";
  if (!(await fileExists(filePath))) {
    try {
      const raw = await fetchText(INSTAGRAM_PROFILE_API, {
        "x-ig-app-id": "936619743392459"
      });
      await fs.writeFile(filePath, raw, "utf8");
    } catch {
      return [];
    }
  }

  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  const user = data?.data?.user;
  if (!user) {
    return [];
  }

  const items = [];

  if (user.profile_pic_url_hd) {
    items.push({ source: "instagram", kind: "image", url: user.profile_pic_url_hd, title: "Instagram profile" });
  }

  const pushNodeMedia = (node) => {
    if (!node) {
      return;
    }

    const shortcode = node.shortcode || "post";

    if (node.display_url) {
      items.push({
        source: "instagram",
        kind: "image",
        url: node.display_url,
        title: `Instagram ${shortcode}`
      });
    }

    if (node.is_video && node.video_url) {
      items.push({
        source: "instagram",
        kind: "video",
        url: node.video_url,
        title: `Instagram ${shortcode} video`
      });
    }

    const sidecar = node.edge_sidecar_to_children?.edges || [];
    for (const edge of sidecar) {
      const child = edge?.node;
      if (!child) {
        continue;
      }
      if (child.display_url) {
        items.push({
          source: "instagram",
          kind: "image",
          url: child.display_url,
          title: `Instagram ${shortcode} carousel`
        });
      }
      if (child.is_video && child.video_url) {
        items.push({
          source: "instagram",
          kind: "video",
          url: child.video_url,
          title: `Instagram ${shortcode} carousel video`
        });
      }
    }
  };

  const timelineEdges = user.edge_owner_to_timeline_media?.edges || [];
  for (const edge of timelineEdges) {
    pushNodeMedia(edge?.node);
  }

  const reelsEdges = user.edge_felix_video_timeline?.edges || [];
  for (const edge of reelsEdges) {
    pushNodeMedia(edge?.node);
  }

  const deduped = [];
  const seen = new Set();
  let imageCount = 0;
  let videoCount = 0;

  for (const item of items) {
    const key = `${item.kind}:${normalizeMediaUrl(item.url)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    if (item.kind === "image") {
      if (imageCount >= MAX_IG_IMAGES) {
        continue;
      }
      imageCount += 1;
    }

    if (item.kind === "video") {
      if (videoCount >= MAX_IG_VIDEOS) {
        continue;
      }
      videoCount += 1;
    }

    deduped.push(item);
  }

  return deduped;
}

async function loadYandexLinks() {
  const filePath = "/tmp/white_lab_yandex.html";
  if (!(await fileExists(filePath))) {
    try {
      const rawPage = await fetchText(YANDEX_PAGE_URL);
      await fs.writeFile(filePath, rawPage, "utf8");
    } catch {
      return [];
    }
  }

  const raw = await fs.readFile(filePath, "utf8");
  const rawUrls = parseUrlsFromRegex(raw, /https:\/\/avatars\.mds\.yandex\.net\/get-altay\/[^"'\s]+/g);

  const normalized = rawUrls
    .map((url) => (url.includes("%s") ? url.replaceAll("%s", "orig") : url))
    .filter((url) => !url.endsWith("/L_height") && !url.endsWith("/XXL_height"));

  const unique = Array.from(new Set(normalized)).slice(0, MAX_YANDEX_IMAGES);

  return unique.map((url) => ({
    source: "yandex",
    kind: "image",
    url,
    title: "Yandex Maps photo"
  }));
}

async function load2GisLinks() {
  const filePath = "/tmp/white_lab_2gis.html";
  if (!(await fileExists(filePath))) {
    try {
      const rawPage = await fetchText(TWOGIS_PAGE_URL);
      await fs.writeFile(filePath, rawPage, "utf8");
    } catch {
      return [];
    }
  }

  const raw = await fs.readFile(filePath, "utf8");
  const previewUrls = parseUrlsFromRegex(
    raw,
    /https:\/\/ams2-cdn\.2gis\.com\/previews\/[^"'\s]+\/1\/ru\/image\.png/g
  ).slice(0, MAX_2GIS_IMAGES);

  const mapImageMatch = raw.match(/https:\/\/share\.api\.2gis\.ru\/getimage[^"'\s]+/);
  const mapImage = mapImageMatch ? [mapImageMatch[0].replaceAll("&amp;", "&")] : [];

  const unique = Array.from(new Set([...mapImage, ...previewUrls]));

  return unique.map((url, index) => ({
    source: "2gis",
    kind: "image",
    url,
    title: index === 0 ? "2GIS map preview" : "2GIS photo"
  }));
}

async function detectExtension(url, contentType) {
  if (contentType && MIME_EXT[contentType.split(";")[0].trim()]) {
    return MIME_EXT[contentType.split(";")[0].trim()];
  }

  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname).replace(".", "").toLowerCase();
  if (ext) {
    return ext;
  }

  return "bin";
}

async function optimizeAsset(inputFile, outputBaseName, kind) {
  if (kind === "image") {
    const optimizedFile = path.join(optimizedDir, `${outputBaseName}.webp`);
    try {
      await runCommand("cwebp", ["-quiet", "-q", "82", inputFile, "-o", optimizedFile]);
      return {
        file: optimizedFile,
        type: "image",
        ext: "webp"
      };
    } catch {
      const fallbackFile = path.join(optimizedDir, `${outputBaseName}${path.extname(inputFile) || ".jpg"}`);
      await fs.copyFile(inputFile, fallbackFile);
      return {
        file: fallbackFile,
        type: "image",
        ext: path.extname(fallbackFile).replace(".", "") || "jpg"
      };
    }
  }

  if (kind === "video") {
    const optimizedFile = path.join(optimizedDir, `${outputBaseName}.mp4`);
    try {
      await runCommand("ffmpeg", [
        "-y",
        "-i",
        inputFile,
        "-movflags",
        "+faststart",
        "-vcodec",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-acodec",
        "aac",
        "-b:a",
        "96k",
        optimizedFile
      ]);
      return {
        file: optimizedFile,
        type: "video",
        ext: "mp4"
      };
    } catch {
      const fallbackFile = path.join(optimizedDir, `${outputBaseName}${path.extname(inputFile) || ".mp4"}`);
      await fs.copyFile(inputFile, fallbackFile);
      return {
        file: fallbackFile,
        type: "video",
        ext: path.extname(fallbackFile).replace(".", "") || "mp4"
      };
    }
  }

  throw new Error(`Unsupported media kind: ${kind}`);
}

async function downloadAndOptimize(items) {
  const media = [];
  let index = 0;

  for (const item of items) {
    index += 1;
    const id = `${item.source}-${sha(item.url)}`;
    const nameBase = `${index.toString().padStart(2, "0")}-${safeName(item.source)}-${sha(item.title + item.url)}`;

    try {
      const response = await fetch(item.url, {
        headers: {
          "user-agent": USER_AGENT
        }
      });

      if (!response.ok) {
        console.warn(`skip ${item.url} => ${response.status}`);
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      const ext = await detectExtension(item.url, contentType);
      const sourceFileName = `${nameBase}.${ext}`;
      const sourceFile = path.join(sourceDir, sourceFileName);
      const arrayBuffer = await response.arrayBuffer();
      await fs.writeFile(sourceFile, Buffer.from(arrayBuffer));

      const optimized = await optimizeAsset(sourceFile, nameBase, item.kind);

      media.push({
        id,
        title: item.title,
        alt: `White Lab ${item.source} media ${index}`,
        source: item.source,
        type: optimized.type,
        originalUrl: item.url,
        localOriginal: `/media/source/${path.basename(sourceFile)}`,
        localOptimized: `/media/optimized/${path.basename(optimized.file)}`,
        createdAt: new Date().toISOString()
      });

      console.log(`ok [${index}/${items.length}] ${item.source} -> ${path.basename(optimized.file)}`);
    } catch (error) {
      console.warn(`error ${item.url}: ${error.message}`);
    }
  }

  return media;
}

async function main() {
  await ensureDirs();
  await cleanDir(sourceDir);
  await cleanDir(optimizedDir);

  const [instagram, yandex, twogis] = await Promise.all([
    loadInstagramLinks(),
    loadYandexLinks(),
    load2GisLinks()
  ]);

  const all = [...instagram, ...yandex, ...twogis];
  const deduped = [];
  const seen = new Set();

  for (const item of all) {
    const key = `${item.kind}:${normalizeMediaUrl(item.url)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }

  console.log(`total links: ${deduped.length}`);

  const media = await downloadAndOptimize(deduped);
  await fs.writeFile(mediaJsonPath, `${JSON.stringify(media, null, 2)}\n`, "utf8");

  console.log(`saved ${media.length} media items -> content/media.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
