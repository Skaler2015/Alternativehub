import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";

type Params = Promise<{ id: string }>;

const schema = z.object({ status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]) });

export async function PATCH(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "report.resolve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  await prisma.report.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolvedAt: parsed.data.status === "RESOLVED" ? new Date() : null,
    },
  });
  await logActivity({ userId: user.id, action: `report.${parsed.data.status.toLowerCase()}`, entity: "Report", entityId: id });

  return NextResponse.json({ ok: true });
}
