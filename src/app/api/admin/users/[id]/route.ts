import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, logActivity } from "@/lib/authz";

type Params = Promise<{ id: string }>;

const schema = z.object({
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
  isBanned: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Params }) {
  const admin = await getApiUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json({ error: "You cannot modify your own account" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await prisma.user.update({ where: { id }, data: parsed.data });
  await logActivity({
    userId: admin.id,
    action: "user.update",
    entity: "User",
    entityId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
