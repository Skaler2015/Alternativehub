import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";
import { adminToolUpdateSchema, toolWriteSchema } from "@/lib/validations";
import { enrichTool } from "@/lib/automation";
import { syncTags } from "@/lib/admin-tools";
import { invalidate, invalidatePrefix, CACHE_KEYS } from "@/lib/cache";

type Params = Promise<{ id: string }>;

/** Full edit of a tool's editable fields. */
export async function PUT(req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.tool.findUnique({ where: { id }, select: { id: true, slug: true, status: true, publishedAt: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = toolWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  if (d.slug !== existing.slug) {
    const clash = await prisma.tool.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (clash) return NextResponse.json({ error: "Another tool already uses this slug" }, { status: 409 });
  }

  const nextStatus = d.status ?? existing.status;
  await prisma.tool.update({
    where: { id },
    data: {
      slug: d.slug,
      name: d.name,
      tagline: d.tagline || null,
      description: d.description,
      websiteUrl: d.websiteUrl,
      affiliateUrl: d.affiliateUrl || null,
      downloadUrl: d.downloadUrl || null,
      logoUrl: d.logoUrl || null,
      pricingModel: d.pricingModel,
      tier: d.tier ?? "STANDARD",
      status: nextStatus,
      publishedAt: nextStatus === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      featured: d.featured ?? false,
      verified: d.verified ?? false,
      isOpenSource: d.isOpenSource ?? false,
      launchYear: d.launchYear ?? null,
      pros: d.pros ?? [],
      cons: d.cons ?? [],
      bestFor: d.bestFor ?? [],
      seoTitle: d.seoTitle || null,
      seoDesc: d.seoDesc || null,
      categoryId: d.categoryId,
    },
  });

  if (d.tags) await syncTags(id, d.tags).catch(() => {});

  await logActivity({ userId: user.id, action: "tool.edit", entity: "Tool", entityId: id, meta: { name: d.name } });
  await invalidate(CACHE_KEYS.home, CACHE_KEYS.trending, CACHE_KEYS.tool(existing.slug), CACHE_KEYS.tool(d.slug));
  await invalidatePrefix("v1:").catch(() => {});

  return NextResponse.json({ ok: true, slug: d.slug });
}

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
