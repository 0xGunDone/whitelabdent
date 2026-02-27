interface CacheEntry {
  html: string;
  freshUntil: number;
  staleUntil: number;
  revalidating: boolean;
}

const cache = new Map<string, CacheEntry>();

const FRESH_TTL_MS = Number(process.env.PAGE_CACHE_FRESH_MS || 30_000);
const STALE_TTL_MS = Number(process.env.PAGE_CACHE_STALE_MS || 180_000);

function getCachedPage(key: string):
  | { status: "hit"; html: string }
  | { status: "stale"; html: string }
  | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  const now = Date.now();

  if (now <= entry.freshUntil) {
    return { status: "hit", html: entry.html };
  }

  if (now <= entry.staleUntil) {
    return { status: "stale", html: entry.html };
  }

  cache.delete(key);
  return null;
}

function putCachedPage(key: string, html: string): void {
  const now = Date.now();
  cache.set(key, {
    html,
    freshUntil: now + Math.max(1_000, FRESH_TTL_MS),
    staleUntil: now + Math.max(2_000, FRESH_TTL_MS + STALE_TTL_MS),
    revalidating: false
  });
}

function isRevalidating(key: string): boolean {
  return Boolean(cache.get(key)?.revalidating);
}

function setRevalidating(key: string, value: boolean): void {
  const entry = cache.get(key);
  if (!entry) {
    return;
  }
  entry.revalidating = value;
}

function invalidatePageCache(keyPrefix = ""): void {
  if (!keyPrefix) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}

module.exports = {
  getCachedPage,
  putCachedPage,
  isRevalidating,
  setRevalidating,
  invalidatePageCache
};
