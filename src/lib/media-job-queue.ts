const { getDatabase } = require("./sqlite-db") as {
  getDatabase: () => import("node:sqlite").DatabaseSync;
};

type MediaJobType = "import_url" | "upload_file";

interface ImportJobPayload {
  url: string;
  title?: string;
}

interface UploadJobPayload {
  path: string;
  originalname: string;
  mimetype: string;
  title?: string;
}

type MediaJobPayload = ImportJobPayload | UploadJobPayload;

interface MediaJobRecord {
  id: number;
  jobType: MediaJobType;
  payload: MediaJobPayload;
  status: "pending" | "processing" | "done" | "failed";
  attempts: number;
  lastError: string;
  createdAt: string;
  startedAt: string;
  finishedAt: string;
}

function parsePayload(rawPayload: string): MediaJobPayload {
  try {
    return JSON.parse(rawPayload || "{}") as MediaJobPayload;
  } catch {
    return {} as MediaJobPayload;
  }
}

function normalizeRow(row: Record<string, unknown>): MediaJobRecord {
  return {
    id: Number(row.id || 0),
    jobType: String(row.job_type || "import_url") as MediaJobType,
    payload: parsePayload(String(row.payload || "{}")),
    status: String(row.status || "pending") as MediaJobRecord["status"],
    attempts: Number(row.attempts || 0),
    lastError: String(row.last_error || ""),
    createdAt: String(row.created_at || ""),
    startedAt: String(row.started_at || ""),
    finishedAt: String(row.finished_at || "")
  };
}

function enqueueMediaJob(jobType: MediaJobType, payload: MediaJobPayload): number {
  const db = getDatabase();
  const now = new Date().toISOString();
  const result = db
    .prepare(`
      INSERT INTO media_jobs (job_type, payload, status, attempts, created_at)
      VALUES (?, ?, 'pending', 0, ?)
    `)
    .run(jobType, JSON.stringify(payload), now);

  return Number(result.lastInsertRowid || 0);
}

function listMediaJobs(limit = 20): MediaJobRecord[] {
  const db = getDatabase();
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 20;
  const rows = db
    .prepare(`
      SELECT id, job_type, payload, status, attempts, last_error, created_at, started_at, finished_at
      FROM media_jobs
      ORDER BY id DESC
      LIMIT ?
    `)
    .all(safeLimit) as Record<string, unknown>[];

  return rows.map(normalizeRow);
}

function claimPendingMediaJob(): MediaJobRecord | null {
  const db = getDatabase();
  let jobRow: Record<string, unknown> | undefined;
  const now = new Date().toISOString();

  db.exec("BEGIN IMMEDIATE");
  try {
    jobRow = db
      .prepare(`
        SELECT id, job_type, payload, status, attempts, last_error, created_at, started_at, finished_at
        FROM media_jobs
        WHERE status = 'pending'
        ORDER BY id ASC
        LIMIT 1
      `)
      .get() as Record<string, unknown> | undefined;

    if (!jobRow || !jobRow.id) {
      db.exec("COMMIT");
      return null;
    }

    db.prepare(`
      UPDATE media_jobs
      SET status = 'processing', attempts = attempts + 1, started_at = ?, last_error = NULL
      WHERE id = ?
    `).run(now, Number(jobRow.id));

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return normalizeRow({ ...jobRow, status: "processing", attempts: Number(jobRow.attempts || 0) + 1, started_at: now });
}

function markMediaJobDone(jobId: number): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE media_jobs
    SET status = 'done', finished_at = ?, last_error = NULL
    WHERE id = ?
  `).run(new Date().toISOString(), jobId);
}

function markMediaJobFailed(jobId: number, errorMessage: string): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE media_jobs
    SET status = 'failed', finished_at = ?, last_error = ?
    WHERE id = ?
  `).run(new Date().toISOString(), errorMessage.slice(0, 2000), jobId);
}

function recycleStalledMediaJobs(stalledMinutes = 20): number {
  const db = getDatabase();
  const minutes = Math.max(1, Math.floor(stalledMinutes));
  const threshold = new Date(Date.now() - minutes * 60_000).toISOString();
  const result = db
    .prepare(`
      UPDATE media_jobs
      SET status = 'pending', started_at = NULL
      WHERE status = 'processing' AND started_at < ?
    `)
    .run(threshold);

  return Number(result.changes || 0);
}

module.exports = {
  enqueueMediaJob,
  listMediaJobs,
  claimPendingMediaJob,
  markMediaJobDone,
  markMediaJobFailed,
  recycleStalledMediaJobs
};
