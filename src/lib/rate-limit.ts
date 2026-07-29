import { getRedis } from "@/lib/redis";

type RateLimitResult = { success: boolean; remaining: number; reset: number };

// In-memory fallback for environments without Redis (single instance only)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Sliding-window rate limiter keyed on identifier (usually `${route}:${ip}`).
 * Redis-backed in production; in-memory fallback in dev.
 */
export async function rateLimit(
  identifier: string,
  limit = 20,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();

  if (redis) {
    try {
      const key = `rl:${identifier}`;
      const windowMs = windowSeconds * 1000;
      const results = await redis
        .multi()
        .zremrangebyscore(key, 0, now - windowMs)
        .zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`)
        .zcard(key)
        .expire(key, windowSeconds)
        .exec();
      const count = (results?.[2]?.[1] as number) ?? 0;
      return {
        success: count <= limit,
        remaining: Math.max(0, limit - count),
        reset: now + windowMs,
      };
    } catch {
      // fall through to memory
    }
  }

  const entry = memoryStore.get(identifier);
  if (!entry || entry.resetAt < now) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, reset: now + windowSeconds * 1000 };
  }
  entry.count += 1;
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anonymous";
}
