import type { MediaItem, SiteData } from "../types/content";

const fs = require("node:fs/promises") as typeof import("node:fs/promises");
const path = require("node:path") as typeof import("node:path");
const { getDatabase } = require("./sqlite-db") as {
  getDatabase: () => import("node:sqlite").DatabaseSync;
};

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

function readStoreEntry<T extends JsonValue>(key: string, fallback: T): { value: T; updatedAt: number } {
  const db = getDatabase();
  const row = db
    .prepare("SELECT value, updated_at FROM kv_store WHERE key = ? LIMIT 1")
    .get(key) as { value?: string; updated_at?: string } | undefined;

  if (!row || typeof row.value !== "string") {
    return { value: fallback, updatedAt: 0 };
  }

  try {
    const parsed = JSON.parse(row.value) as T;
    const updatedAt = row.updated_at ? Date.parse(row.updated_at) || 0 : 0;
    return { value: parsed, updatedAt };
  } catch {
    return { value: fallback, updatedAt: 0 };
  }
}

async function readFileMtime(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtimeMs;
  } catch {
    return 0;
  }
}

function writeStoreEntry(key: string, value: JsonValue): void {
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  db.prepare(`
    INSERT INTO kv_store (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), nowIso);
}

async function maybeHydrateStoreFromJson<T extends JsonValue>(key: string, filePath: string, fallback: T): Promise<T> {
  const { value: storeValue, updatedAt } = readStoreEntry<T>(key, fallback);
  const fileMtime = await readFileMtime(filePath);

  if (fileMtime === 0 && updatedAt > 0) {
    return storeValue;
  }

  // If JSON was changed externally after DB update, prioritize file and rehydrate DB.
  if (fileMtime > updatedAt + 1000) {
    const jsonValue = await readJson<T>(filePath, fallback);
    writeStoreEntry(key, jsonValue);
    return jsonValue;
  }

  if (updatedAt > 0) {
    return storeValue;
  }

  // First start: seed from JSON if available.
  const initialValue = await readJson<T>(filePath, fallback);
  writeStoreEntry(key, initialValue);
  return initialValue;
}

async function saveStoreAndMirror(key: string, filePath: string, value: JsonValue): Promise<void> {
  await writeJson(filePath, value);
  writeStoreEntry(key, value);
}

async function loadSite(): Promise<SiteData> {
  return maybeHydrateStoreFromJson<SiteData>("site", sitePath, {} as SiteData);
}

async function saveSite(data: SiteData): Promise<void> {
  await saveStoreAndMirror("site", sitePath, data);
}

async function loadMedia(): Promise<MediaItem[]> {
  return maybeHydrateStoreFromJson<MediaItem[]>("media", mediaPath, []);
}

async function saveMedia(data: MediaItem[]): Promise<void> {
  await saveStoreAndMirror("media", mediaPath, data);
}

module.exports = {
  loadSite,
  saveSite,
  loadMedia,
  saveMedia
};
