import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";
import { recomputeToolScores } from "@/lib/automation";

type Params = Promise<{ id: string }>;

export async function PATCH(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "review.moderate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.review.update({ where: { id }, data: { approved: !review.approved } });
  await recomputeToolScores(review.toolId);
  await logActivity({ userId: user.id, action: "review.toggle", entity: "Review", entityId: id });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "review.moderate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const review = await prisma.review.delete({ where: { id } }).catch(() => null);
  if (review) await recomputeToolScores(review.toolId);
  await logActivity({ userId: user.id, action: "review.delete", entity: "Review", entityId: id });

  return NextResponse.json({ ok: true });
}
