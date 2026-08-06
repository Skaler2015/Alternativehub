import { NextResponse } from "next/server";
import { aiEnabled } from "@/lib/ai";
import { generateAndPublishTools, DAILY_TARGET } from "@/lib/generate-tools";
import { ingestNewTools } from "@/lib/ingest";
import { generateBlogPost } from "@/lib/auto-blog";
import { invalidate, invalidatePrefix, CACHE_KEYS } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily growth cron (Vercel Cron). Consolidated to stay within the Hobby
 * 2-cron limit. Runs, in order (cheapest first, so heavy AI at the end can't
 * lose the already-committed work):
 *   1. Ingest brand-new tools from public sources (Hacker News, GitHub, PH)
 *   2. Auto-write an SEO blog post (every other day) — needs AI
 *   3. AI-generate & publish more catalog tools — needs AI
 * Protected by CRON_SECRET. Each step is failure-safe.
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

  const summary: Record<string, unknown> = {};

  // 1. Ingest new tools from public sources (fast, no AI required).
  try {
    summary.ingest = await ingestNewTools(40);
  } catch (err) {
    summary.ingestError = String(err);
  }

  // 2. Auto-blog every other day (keeps AI budget/time in check).
  if (aiEnabled() && new Date().getUTCDate() % 2 === 0) {
    try {
      const slug = await generateBlogPost();
      summary.blog = slug ? { published: slug } : "skipped (not enough data)";
    } catch (err) {
      summary.blogError = String(err);
    }
  } else {
    summary.blog = aiEnabled() ? "skipped (odd day)" : "skipped (no AI provider)";
  }

  // 3. AI catalog generation (heaviest — runs last).
  if (aiEnabled()) {
    try {
      summary.generated = await generateAndPublishTools(DAILY_TARGET);
    } catch (err) {
      summary.generateError = String(err);
    }
  } else {
    summary.generated = 0;
    summary.note = "No AI provider configured";
  }

  await invalidate(CACHE_KEYS.home, CACHE_KEYS.trending, CACHE_KEYS.categories).catch(() => {});
  await invalidatePrefix("v1:").catch(() => {});

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...summary });
}
