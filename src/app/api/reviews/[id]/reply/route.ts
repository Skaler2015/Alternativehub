import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission } from "@/lib/authz";
import { reviewReplySchema } from "@/lib/validations";
import { notify } from "@/lib/notifications";

type Params = Promise<{ id: string }>;

/** Post/update an official reply to a review. Admin/moderator or the claimed company owner. */
export async function POST(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, userId: true, tool: { select: { name: true, slug: true, company: { select: { claimedById: true } } } } },
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = !!review.tool.company?.claimedById && review.tool.company.claimedById === user.id;
  if (!hasPermission(user.role, "review.moderate") && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reviewReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await prisma.review.update({
    where: { id },
    data: { reply: parsed.data.reply, repliedAt: new Date(), repliedById: user.id },
  });

  if (review.userId !== user.id) {
    void notify({
      userId: review.userId,
      type: "REVIEW_REPLY",
      title: `You got a reply on your ${review.tool.name} review`,
      body: parsed.data.reply.slice(0, 140),
      link: `/tools/${review.tool.slug}#reviews`,
    });
  }

  return NextResponse.json({ ok: true });
}

/** Remove a reply. Admin/moderator only. */
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "review.moderate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.review.update({ where: { id }, data: { reply: null, repliedAt: null, repliedById: null } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
