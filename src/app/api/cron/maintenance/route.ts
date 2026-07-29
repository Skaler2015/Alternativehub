import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  recomputeToolScores,
  checkBrokenLinks,
  detectAlternatives,
  enrichTool,
} from "@/lib/automation";
import { aiEnabled } from "@/lib/ai";
import { invalidate, invalidatePrefix, CACHE_KEYS } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily maintenance cron (triggered by Vercel Cron).
 *
 * Runs the free automations on every invocation:
 *   1. Recompute trending / popularity / rating / trust scores
 *   2. Broken-link sweep (batch, dedup-safe)
 *   3. Similar-tool linking for tools with no alternatives yet
 *   4. AI enrichment of un-enriched tools — ONLY if ANTHROPIC_API_KEY is set
 *      (skipped silently otherwise, so it stays free without the key)
 *
 * Protected by CRON_SECRET: Vercel Cron automatically sends
 * `Authorization: Bearer <CRON_SECRET>` when the env var is configured.
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never run unauthenticated
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary: Record<string, unknown> = {};

  // 1. Recompute scores for all published tools
  try {
    const tools = await prisma.tool.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { id: true },
    });
    for (const t of tools) await recomputeToolScores(t.id).catch(() => {});
    summary.scoresRecomputed = tools.length;
  } catch (err) {
    summary.scoresError = String(err);
  }

  // 2. Broken-link sweep (concurrent, dedup-safe batch)
  try {
    summary.linkCheck = await checkBrokenLinks(25);
  } catch (err) {
    summary.linkError = String(err);
  }

  // 3. Similar-tool linking for tools that have no alternatives yet
  try {
    const orphans = await prisma.tool.findMany({
      where: { status: "PUBLISHED", deletedAt: null, alternativesFrom: { none: {} } },
      select: { id: true },
      take: 15,
    });
    for (const t of orphans) await detectAlternatives(t.id).catch(() => {});
    summary.similarLinked = orphans.length;
  } catch (err) {
    summary.similarError = String(err);
  }

  // 4. AI enrichment — only when an AI provider (Gemini or Anthropic) is configured
  if (aiEnabled()) {
    try {
      const unenriched = await prisma.tool.findMany({
        where: { status: "PUBLISHED", deletedAt: null, aiSummary: null },
        select: { id: true },
        take: 5, // cap AI calls per run to control cost/time
      });
      for (const t of unenriched) await enrichTool(t.id).catch(() => {});
      summary.aiEnriched = unenriched.length;
    } catch (err) {
      summary.aiError = String(err);
    }
  } else {
    summary.aiEnriched = "skipped (no AI provider configured)";
  }

  // Refresh caches so users see fresh data immediately
  await invalidate(CACHE_KEYS.home, CACHE_KEYS.trending, CACHE_KEYS.categories).catch(() => {});
  await invalidatePrefix("v1:").catch(() => {});

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...summary });
}
