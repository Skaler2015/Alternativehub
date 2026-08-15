import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/authz";
import { processRankJobs } from "@/lib/rank/data";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Drains a safe batch of queued rank-check jobs. Triggered by Vercel Cron
 * (Authorization: Bearer CRON_SECRET) and also callable by an authenticated
 * admin from the dashboard to show live progress. Never runs unauthenticated.
 */
async function authorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) return true;
  const user = await getApiUser();
  return !!user && (user.role === "ADMIN" || user.role === "MODERATOR");
}

export async function GET(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const summary = await processRankJobs(limit);
  return NextResponse.json({ ok: true, ...summary });
}
