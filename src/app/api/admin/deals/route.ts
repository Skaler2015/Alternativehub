import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";
import { dealWriteSchema } from "@/lib/validations";

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Create a deal. */
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = dealWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  const tool = await prisma.tool.findUnique({ where: { id: d.toolId }, select: { id: true } });
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  const deal = await prisma.deal.create({
    data: {
      toolId: d.toolId,
      title: d.title,
      description: d.description || null,
      discountLabel: d.discountLabel,
      couponCode: d.couponCode || null,
      url: d.url,
      featured: d.featured ?? false,
      active: d.active ?? true,
      startsAt: parseDate(d.startsAt),
      endsAt: parseDate(d.endsAt),
    },
  });

  await logActivity({ userId: user.id, action: "deal.create", entity: "Deal", entityId: deal.id, meta: { title: deal.title } });
  return NextResponse.json({ ok: true, id: deal.id }, { status: 201 });
}
