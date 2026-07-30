import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasPermission, logActivity } from "@/lib/authz";
import { toolWriteSchema } from "@/lib/validations";
import { syncTags, toolFavicon } from "@/lib/admin-tools";
import { invalidate, invalidatePrefix, CACHE_KEYS } from "@/lib/cache";

/** Create a new tool. */
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user || !hasPermission(user.role, "tool.approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = toolWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  const clash = await prisma.tool.findUnique({ where: { slug: d.slug }, select: { id: true } });
  if (clash) return NextResponse.json({ error: "A tool with this slug already exists" }, { status: 409 });

  const category = await prisma.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 400 });

  const status = d.status ?? "PUBLISHED";
  const tool = await prisma.tool.create({
    data: {
      slug: d.slug,
      name: d.name,
      tagline: d.tagline || null,
      description: d.description,
      websiteUrl: d.websiteUrl,
      affiliateUrl: d.affiliateUrl || null,
      downloadUrl: d.downloadUrl || null,
      logoUrl: d.logoUrl || toolFavicon(d.websiteUrl),
      pricingModel: d.pricingModel,
      tier: d.tier ?? "STANDARD",
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      featured: d.featured ?? false,
      verified: d.verified ?? false,
      isOpenSource: d.isOpenSource ?? false,
      launchYear: d.launchYear ?? null,
      pros: d.pros ?? [],
      cons: d.cons ?? [],
      bestFor: d.bestFor ?? [],
      seoTitle: d.seoTitle || `${d.name} — Reviews, Pricing & Best Alternatives`,
      seoDesc: d.seoDesc || (d.tagline ?? d.description.slice(0, 150)),
      keywords: [`${d.name.toLowerCase()} alternatives`, `${d.name.toLowerCase()} review`],
      categoryId: d.categoryId,
      submittedById: user.id,
    },
  });

  if (d.tags?.length) await syncTags(tool.id, d.tags).catch(() => {});

  await logActivity({ userId: user.id, action: "tool.create", entity: "Tool", entityId: tool.id, meta: { name: tool.name } });
  await invalidate(CACHE_KEYS.home, CACHE_KEYS.trending, CACHE_KEYS.categories);
  await invalidatePrefix("v1:").catch(() => {});

  return NextResponse.json({ ok: true, id: tool.id, slug: tool.slug }, { status: 201 });
}
