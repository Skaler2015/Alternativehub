import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanupHistory, enqueueChecks, getOrCreateProject, rankLog } from "@/lib/rank/data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled job creator for automatic tracking. Finds active keywords that are
 * due for a re-check (never checked, or older than the project's interval) and
 * enqueues them. The separate process-jobs cron then works the queue in safe
 * batches, so no single run ever does thousands of API calls.
 * Protected by CRON_SECRET.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const project = await getOrCreateProject();
  // Data-retention cleanup runs daily regardless of auto-tracking (never today's data).
  const purged = await cleanupHistory(project.id, project.historyRetentionDays).catch(() => 0);
  if (!project.active || !project.autoTracking) {
    return NextResponse.json({ ok: true, skipped: true, reason: "auto tracking off", purged });
  }
  const days = project.frequency === "weekly" ? 7 : project.frequency === "custom" ? Math.max(1, project.intervalDays) : 1;
  const cutoff = new Date(Date.now() - days * 86400000);
  const due = await prisma.rankKeyword.findMany({
    where: { projectId: project.id, active: true, OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: cutoff } }] },
    select: { id: true },
    take: 20000,
  });
  const enqueued = await enqueueChecks(project.id, { keywordIds: due.map((d) => d.id) });
  await rankLog({ type: "INFO", message: `Auto tracking enqueued ${enqueued} keyword(s).` });
  return NextResponse.json({ ok: true, due: due.length, enqueued, purged });
}
