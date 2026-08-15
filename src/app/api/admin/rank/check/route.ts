import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/authz";
import { checkKeywordNow, enqueueChecks, getOrCreateProject, processRankJobs } from "@/lib/rank/data";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function guard() {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;
  return user;
}

/**
 * Rank-check actions:
 *  - { action: "single", keywordId }  → instant check of one keyword
 *  - { action: "enqueue", keywordIds?|scope } → queue jobs (all/failed/notranking/selected)
 *  - { action: "process", limit }     → drain a batch (UI calls repeatedly for progress)
 */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as
    | { action: string; keywordId?: string; keywordIds?: string[]; scope?: "all" | "failed" | "notranking"; limit?: number }
    | null;
  if (!body?.action) return NextResponse.json({ ok: false, error: "Missing action" }, { status: 400 });

  if (body.action === "single") {
    if (!body.keywordId) return NextResponse.json({ ok: false, error: "Missing keywordId" }, { status: 400 });
    const res = await checkKeywordNow(body.keywordId);
    return NextResponse.json(res);
  }

  const project = await getOrCreateProject();

  if (body.action === "enqueue") {
    const enqueued = await enqueueChecks(project.id, { keywordIds: body.keywordIds, scope: body.scope });
    return NextResponse.json({ ok: true, enqueued });
  }

  if (body.action === "process") {
    const summary = await processRankJobs(Math.min(50, Math.max(1, body.limit ?? 20)));
    return NextResponse.json({ ok: true, ...summary });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
