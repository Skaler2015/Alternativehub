import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, logActivity } from "@/lib/authz";
import { opsActionSchema } from "@/lib/validations";
import { recomputeToolScores, checkBrokenLinks, detectAlternatives, enrichTool } from "@/lib/automation";
import { recomputeAllReputations } from "@/lib/community";
import { aiEnabled } from "@/lib/ai";
import { emailEnabled, sendWeeklyDigest } from "@/lib/email";
import { invalidate, invalidatePrefix, CACHE_KEYS } from "@/lib/cache";

export const maxDuration = 60;

/** Admin-triggered automation. ADMIN only. */
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = opsActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const result: Record<string, unknown> = {};
  const { action } = parsed.data;

  try {
    switch (action) {
      case "recompute-scores": {
        const tools = await prisma.tool.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { id: true } });
        for (const t of tools) await recomputeToolScores(t.id).catch(() => {});
        result.count = tools.length;
        break;
      }
      case "recompute-reputation":
        result.count = await recomputeAllReputations();
        break;
      case "check-links":
        result.report = await checkBrokenLinks(30);
        break;
      case "detect-alternatives": {
        const orphans = await prisma.tool.findMany({
          where: { status: "PUBLISHED", deletedAt: null, alternativesFrom: { none: {} } },
          select: { id: true }, take: 20,
        });
        for (const t of orphans) await detectAlternatives(t.id).catch(() => {});
        result.count = orphans.length;
        break;
      }
      case "enrich-batch": {
        if (!aiEnabled()) return NextResponse.json({ error: "No AI provider configured (set GEMINI_API_KEY)" }, { status: 400 });
        const unenriched = await prisma.tool.findMany({
          where: { status: "PUBLISHED", deletedAt: null, aiSummary: null }, select: { id: true }, take: 10,
        });
        for (const t of unenriched) await enrichTool(t.id).catch(() => {});
        result.count = unenriched.length;
        break;
      }
      case "send-digest":
        if (!emailEnabled()) return NextResponse.json({ error: "Email not configured (set RESEND_API_KEY)" }, { status: 400 });
        result.sent = await sendWeeklyDigest();
        break;
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  await logActivity({ userId: user.id, action: `ops.${action}`, entity: "Ops", meta: result });
  await invalidate(CACHE_KEYS.home, CACHE_KEYS.trending).catch(() => {});
  await invalidatePrefix("v1:").catch(() => {});

  return NextResponse.json({ ok: true, ...result });
}
