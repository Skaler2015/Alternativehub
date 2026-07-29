import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis | null };

/**
 * Lazily-initialized Redis client. Returns null when REDIS_URL is unset so the
 * app degrades gracefully (cache misses, in-memory rate limiting) in
 * environments without Redis.
 */
export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRedis.redis = null;
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
  });
  client.on("error", () => {
    /* swallow — cache layer treats Redis as best-effort */
  });

  globalForRedis.redis = client;
  return client;
}
