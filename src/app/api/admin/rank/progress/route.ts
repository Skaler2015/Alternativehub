import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getOrCreateProject } from "@/lib/rank/data";

export const dynamic = "force-dynamic";

/** Live queue progress for the "Check All" progress bar. */
export async function GET() {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const project = await getOrCreateProject();
  const [pending, processing, retry, failed] = await Promise.all([
    prisma.rankJob.count({ where: { projectId: project.id, status: "PENDING" } }),
    prisma.rankJob.count({ where: { projectId: project.id, status: "PROCESSING" } }),
    prisma.rankJob.count({ where: { projectId: project.id, status: "RETRY" } }),
    prisma.rankJob.count({ where: { projectId: project.id, status: "FAILED" } }),
  ]);
  const remaining = pending + processing + retry;
  return NextResponse.json({ ok: true, pending, processing, retry, failed, remaining });
}
