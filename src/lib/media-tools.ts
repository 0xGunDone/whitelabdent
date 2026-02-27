import type { MediaItem, MediaType } from "../types/content";

const { spawn } = require("node:child_process") as typeof import("node:child_process");
const fs = require("node:fs/promises") as typeof import("node:fs/promises");
const path = require("node:path") as typeof import("node:path");

const sourceDir = path.join(process.cwd(), "public", "media", "source");
const optimizedDir = path.join(process.cwd(), "public", "media", "optimized");

type MediaSource = "instagram" | "2gis" | "yandex" | "vk" | "youtube" | "upload" | "web";

interface OptimizeResult {
  type: MediaType;
  optimizedFile: string;
  ext: string;
}

interface UploadedFile {
  path: string;
  originalname: string;
  mimetype: string;
}

function detectSourceFromUrl(rawUrl: string): MediaSource {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("instagram")) {
      return "instagram";
    }
    if (host.includes("2gis")) {
      return "2gis";
    }
    if (host.includes("yandex")) {
      return "yandex";
    }
    if (host.includes("vk.com") || host.includes("vk.ru")) {
      return "vk";
    }
    if (host.includes("youtube")) {
      return "youtube";
    }
    return "web";
  } catch {
    return "web";
  }
}

function sourceLabel(source: MediaSource): string {
  if (source === "instagram") {
    return "Инстаграм";
  }
  if (source === "2gis") {
    return "2GIS";
  }
  if (source === "yandex") {
    return "Яндекс";
  }
  if (source === "vk") {
    return "VK";
  }
  if (source === "youtube") {
    return "YouTube";
  }
  if (source === "upload") {
    return "загрузки";
  }
  return "веб-источника";
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} завершился с кодом ${String(code)}: ${stderr.trim()}`));
    });
  });
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(optimizedDir, { recursive: true });
}

async function optimizeImage(inputFile: string, outputBaseName: string): Promise<OptimizeResult> {
  const optimizedFile = path.join(optimizedDir, `${outputBaseName}.webp`);
  try {
    await runCommand("cwebp", ["-quiet", "-q", "82", inputFile, "-o", optimizedFile]);
    return {
      type: "image",
      optimizedFile,
      ext: "webp"
    };
  } catch {
    const ext = path.extname(inputFile) || ".jpg";
    const fallback = path.join(optimizedDir, `${outputBaseName}${ext}`);
    await fs.copyFile(inputFile, fallback);
    return {
      type: "image",
      optimizedFile: fallback,
      ext: ext.replace(".", "")
    };
  }
}

async function optimizeVideo(inputFile: string, outputBaseName: string): Promise<OptimizeResult> {
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
      type: "video",
      optimizedFile,
      ext: "mp4"
    };
  } catch {
    const ext = path.extname(inputFile) || ".mp4";
    const fallback = path.join(optimizedDir, `${outputBaseName}${ext}`);
    await fs.copyFile(inputFile, fallback);
    return {
      type: "video",
      optimizedFile: fallback,
      ext: ext.replace(".", "")
    };
  }
}

async function importRemoteMedia(url: string, title?: string): Promise<MediaItem> {
  const source = detectSourceFromUrl(url);
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить медиа: HTTP ${response.status}`);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const isImage = contentType.startsWith("image/");
  const isVideo = contentType.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new Error("Неподдерживаемый тип медиа");
  }

  const extGuess = contentType.split("/")[1]?.split(";")[0] || (isImage ? "jpg" : "mp4");
  const fileBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sourceFile = path.join(sourceDir, `${fileBase}.${extGuess}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(sourceFile, bytes);

  const optimized = isImage ? await optimizeImage(sourceFile, fileBase) : await optimizeVideo(sourceFile, fileBase);

  return {
    id: `${source}-${fileBase}`,
    title: title || "Импортированное медиа",
    alt: `White Lab, медиа из ${sourceLabel(source)}`,
    source,
    type: optimized.type,
    originalUrl: url,
    localOriginal: `/media/source/${path.basename(sourceFile)}`,
    localOptimized: `/media/optimized/${path.basename(optimized.optimizedFile)}`,
    createdAt: new Date().toISOString()
  };
}

async function processUploadedFile(file: UploadedFile, title?: string): Promise<MediaItem> {
  const source: MediaSource = "upload";
  const inputPath = file.path;
  const fileBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const sourceExt = path.extname(file.originalname) || ".bin";
  const sourceFile = path.join(sourceDir, `${fileBase}${sourceExt}`);
  await fs.copyFile(inputPath, sourceFile);

  const isImage = (file.mimetype || "").startsWith("image/");
  const isVideo = (file.mimetype || "").startsWith("video/");

  if (!isImage && !isVideo) {
    throw new Error("Неподдерживаемый формат загрузки");
  }

  const optimized = isImage ? await optimizeImage(sourceFile, fileBase) : await optimizeVideo(sourceFile, fileBase);

  return {
    id: `${source}-${fileBase}`,
    title: title || file.originalname,
    alt: "White Lab, медиа из загрузки",
    source,
    type: optimized.type,
    originalUrl: "",
    localOriginal: `/media/source/${path.basename(sourceFile)}`,
    localOptimized: `/media/optimized/${path.basename(optimized.optimizedFile)}`,
    createdAt: new Date().toISOString()
  };
}

module.exports = {
  ensureDirs,
  importRemoteMedia,
  processUploadedFile
};
