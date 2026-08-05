import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";
import { dealWriteSchema } from "@/lib/validations";

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Update a deal (full replace of editable fields). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = dealWriteSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  await prisma.deal.update({
    where: { id },
    data: {
      ...(d.toolId !== undefined ? { toolId: d.toolId } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.discountLabel !== undefined ? { discountLabel: d.discountLabel } : {}),
      ...(d.couponCode !== undefined ? { couponCode: d.couponCode || null } : {}),
      ...(d.url !== undefined ? { url: d.url } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
      ...(d.startsAt !== undefined ? { startsAt: parseDate(d.startsAt) } : {}),
      ...(d.endsAt !== undefined ? { endsAt: parseDate(d.endsAt) } : {}),
    },
  });

  await logActivity({ userId: user.id, action: "deal.update", entity: "Deal", entityId: id });
  return NextResponse.json({ ok: true });
}

/** Delete a deal. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

  await prisma.deal.delete({ where: { id } });
  await logActivity({ userId: user.id, action: "deal.delete", entity: "Deal", entityId: id });
  return NextResponse.json({ ok: true });
}
