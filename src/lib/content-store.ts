import type { MediaItem, SiteData } from "../types/content";

const fs = require("node:fs/promises") as typeof import("node:fs/promises");
const path = require("node:path") as typeof import("node:path");

const contentDir = path.join(process.cwd(), "content");
const sitePath = path.join(contentDir, "site.json");
const mediaPath = path.join(contentDir, "media.json");

type JsonValue = Record<string, unknown> | Array<unknown>;

async function readJson<T extends JsonValue>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, value: JsonValue): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadSite(): Promise<SiteData> {
  return readJson<SiteData>(sitePath, {} as SiteData);
}

async function saveSite(data: SiteData): Promise<void> {
  await writeJson(sitePath, data);
}

async function loadMedia(): Promise<MediaItem[]> {
  return readJson<MediaItem[]>(mediaPath, []);
}

async function saveMedia(data: MediaItem[]): Promise<void> {
  await writeJson(mediaPath, data);
}

module.exports = {
  loadSite,
  saveSite,
  loadMedia,
  saveMedia
};
