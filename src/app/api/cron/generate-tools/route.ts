import { NextResponse } from "next/server";
import { aiEnabled } from "@/lib/ai";
import { generateAndPublishTools, DAILY_TARGET } from "@/lib/generate-tools";
import { invalidate, invalidatePrefix, CACHE_KEYS } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily AI tool generation (Vercel Cron). Publishes up to DAILY_TARGET new,
 * de-duplicated tools. Protected by CRON_SECRET. No-op without an AI provider.
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!aiEnabled()) {
    return NextResponse.json({ ok: true, added: 0, note: "No AI provider configured" });
  }

  let added = 0;
  try {
    added = await generateAndPublishTools(DAILY_TARGET);
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }

  if (added > 0) {
    await invalidate(CACHE_KEYS.home, CACHE_KEYS.trending, CACHE_KEYS.categories).catch(() => {});
    await invalidatePrefix("v1:").catch(() => {});
  }

  return NextResponse.json({ ok: true, added, target: DAILY_TARGET, ranAt: new Date().toISOString() });
}
