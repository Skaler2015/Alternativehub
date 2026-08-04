import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission } from "@/lib/authz";

type Params = Promise<{ id: string }>;

/** Delete a comment — author or moderator/admin. */
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const comment = await prisma.blogComment.findUnique({ where: { id }, select: { userId: true } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (comment.userId !== user.id && !hasPermission(user.role, "review.moderate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.blogComment.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
