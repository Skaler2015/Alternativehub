import { getRedis } from "@/lib/redis";

/**
 * Redis-backed data cache with graceful fallback.
 * `cached(key, ttl, fn)` returns the cached value when present, otherwise
 * computes it, stores it, and returns it. Any Redis failure falls through to
 * the underlying query — the cache is an optimization, never a dependency.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit) return JSON.parse(hit) as T;
    } catch {
      // fall through to source
    }
  }

  const value = await fn();

  if (redis && value !== undefined) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // best-effort
    }
  }
  return value;
}

export async function invalidate(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    if (keys.length) await redis.del(...keys);
  } catch {
    // best-effort
  }
}

export async function invalidatePrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch {
    // best-effort
  }
}

/** Buffer view counts in Redis; flushed to Postgres by data-layer reads. */
export async function bumpViewCount(toolId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.zincrby("views:buffer", 1, toolId);
  } catch {
    // best-effort
  }
}

export const CACHE_KEYS = {
  home: "v1:home",
  trending: "v1:trending",
  categories: "v1:categories",
  tool: (slug: string) => `v1:tool:${slug}`,
  alternatives: (slug: string) => `v1:alts:${slug}`,
  comparison: (slug: string) => `v1:cmp:${slug}`,
} as const;
