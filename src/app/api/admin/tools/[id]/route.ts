import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";
import { adminToolUpdateSchema } from "@/lib/validations";
import { enrichTool } from "@/lib/automation";
import { invalidate, invalidatePrefix, CACHE_KEYS } from "@/lib/cache";

type Params = Promise<{ id: string }>;

const extendedActions = ["approve", "reject", "feature", "unfeature", "verify", "archive", "restore", "delete", "enrich"] as const;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = (body?.action ?? "") as (typeof extendedActions)[number];
  if (!extendedActions.includes(action)) {
    const parsed = adminToolUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const tool = await prisma.tool.findUnique({ where: { id } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  switch (action) {
    case "approve":
      await prisma.tool.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: tool.publishedAt ?? new Date() },
      });
      // AI enrichment on approval (best-effort, don't block the response for long)
      enrichTool(id).catch(() => {});
      break;
    case "reject":
      await prisma.tool.update({ where: { id }, data: { status: "REJECTED" } });
      break;
    case "feature":
      await prisma.tool.update({ where: { id }, data: { featured: true } });
      break;
    case "unfeature":
      await prisma.tool.update({ where: { id }, data: { featured: false } });
      break;
    case "verify":
      await prisma.tool.update({ where: { id }, data: { verified: true } });
      break;
    case "archive":
      await prisma.tool.update({ where: { id }, data: { status: "ARCHIVED" } });
      break;
    case "restore":
      await prisma.tool.update({ where: { id }, data: { deletedAt: null, status: "PENDING" } });
      break;
    case "delete":
      await prisma.tool.update({ where: { id }, data: { deletedAt: new Date() } });
      break;
    case "enrich":
      await enrichTool(id).catch(() => {});
      break;
  }

  await logActivity({
    userId: user.id,
    action: `tool.${action}`,
    entity: "Tool",
    entityId: id,
    meta: { name: tool.name },
  });
  await invalidate(CACHE_KEYS.home, CACHE_KEYS.trending, CACHE_KEYS.tool(tool.slug));
  await invalidatePrefix("v1:alts:");

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.tool.delete({ where: { id } }).catch(() => null);
  await logActivity({ userId: user.id, action: "tool.hard_delete", entity: "Tool", entityId: id });
  return NextResponse.json({ ok: true });
}
