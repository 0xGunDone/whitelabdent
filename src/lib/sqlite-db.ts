const path = require("node:path") as typeof import("node:path");
const fs = require("node:fs") as typeof import("node:fs");
const sqlite = require("node:sqlite") as typeof import("node:sqlite");

let database: import("node:sqlite").DatabaseSync | null = null;

function ensureSchema(db: import("node:sqlite").DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS media_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_media_jobs_status_created
    ON media_jobs(status, created_at);
  `);
}

function getDatabase(): import("node:sqlite").DatabaseSync {
  if (database) {
    return database;
  }

  const contentDir = path.join(process.cwd(), "content");
  fs.mkdirSync(contentDir, { recursive: true });
  const dbPath = path.join(contentDir, "white-lab.sqlite");

  database = new sqlite.DatabaseSync(dbPath);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA busy_timeout = 5000;");

  ensureSchema(database);
  return database;
}

module.exports = {
  getDatabase
};
