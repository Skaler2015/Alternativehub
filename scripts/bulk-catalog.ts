/**
 * Shared high-performance bulk inserter for the large catalog batches.
 *
 * The earlier per-row approach did findUnique + create + N relation writes for
 * every tool — tens of thousands of sequential round-trips for a 1,000+ row
 * batch, which overruns the Vercel build time limit. This does the whole batch
 * in a handful of queries:
 *   1. load existing slugs, categories and platforms once
 *   2. dedupe rows (in-batch + vs existing) — duplicate-proof by construction
 *   3. createMany tags, then tools, then tool↔platform and tool↔tag links
 * All writes use skipDuplicates and are chunked, so it is safe to re-run and
 * never inserts a duplicate.
 */
import type { PrismaClient, PricingModel } from "@prisma/client";

export type NormalizedRow = {
  slug: string;
  name: string;
  domain: string;
  category: string;
  pricing: PricingModel;
  tagline: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  aiSummary: string;
  seoTitle: string;
  seoDesc: string;
  keywords: string[];
  scores: [number, number, number, number]; // alternative, ai, popularity, trust
  tags: string[];
  platforms: string[];
  openSource: boolean;
};

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
const tagSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function chunk<T>(items: T[], size: number, fn: (batch: T[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await fn(items.slice(i, i + size));
  }
}

export async function bulkInsert(
  prisma: PrismaClient,
  rows: NormalizedRow[],
  label: string,
): Promise<number> {
  // 1. Preload existing slugs + category/platform maps (3 queries total).
  const [existingTools, categories, platforms] = await Promise.all([
    prisma.tool.findMany({ select: { slug: true } }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.platform.findMany({ select: { id: true, slug: true } }),
  ]);
  const existing = new Set(existingTools.map((t) => t.slug));
  const catMap = new Map(categories.map((c) => [c.slug, c.id]));
  const platMap = new Map(platforms.map((p) => [p.slug, p.id]));

  // 2. Dedupe: skip in-batch repeats and anything already in the DB.
  const seen = new Set<string>();
  const toAdd: NormalizedRow[] = [];
  for (const r of rows) {
    if (seen.has(r.slug) || existing.has(r.slug)) continue;
    if (!catMap.has(r.category)) continue;
    seen.add(r.slug);
    toAdd.push(r);
  }
  if (toAdd.length === 0) {
    console.log(`[${label}] nothing new (all ${rows.length} rows already exist).`);
    return 0;
  }

  // 3. Ensure tags exist, then build a slug→id map.
  const tagNameBySlug = new Map<string, string>();
  for (const r of toAdd) {
    for (const t of r.tags) {
      const s = tagSlug(t);
      if (s) tagNameBySlug.set(s, t);
    }
  }
  await chunk([...tagNameBySlug], 500, (batch) =>
    prisma.tag.createMany({ data: batch.map(([s, n]) => ({ slug: s, name: n })), skipDuplicates: true }),
  );
  const allTags = await prisma.tag.findMany({ select: { id: true, slug: true } });
  const tagMap = new Map(allTags.map((t) => [t.slug, t.id]));

  // 4. Bulk-create the tools.
  const now = new Date();
  await chunk(toAdd, 400, (batch) =>
    prisma.tool.createMany({
      skipDuplicates: true,
      data: batch.map((r) => {
        const [alternativeScore, aiScore, popularityScore, trustScore] = r.scores;
        return {
          slug: r.slug,
          name: r.name,
          tagline: r.tagline,
          description: r.description,
          websiteUrl: `https://${r.domain}`,
          logoUrl: favicon(r.domain),
          pricingModel: r.pricing,
          pros: r.pros,
          cons: r.cons,
          bestFor: r.bestFor,
          aiSummary: r.aiSummary,
          status: "PUBLISHED" as const,
          publishedAt: now,
          verified: true,
          isOpenSource: r.openSource,
          alternativeScore,
          aiScore,
          popularityScore,
          trustScore,
          viewCount: Math.round(popularityScore * 37),
          upvotes: Math.round(popularityScore * 1.2),
          categoryId: catMap.get(r.category)!,
          seoTitle: r.seoTitle,
          seoDesc: r.seoDesc,
          keywords: r.keywords,
        };
      }),
    }),
  );

  // 5. Map the new tools' ids by slug.
  const created = await prisma.tool.findMany({
    where: { slug: { in: toAdd.map((r) => r.slug) } },
    select: { id: true, slug: true },
  });
  const idMap = new Map(created.map((t) => [t.slug, t.id]));

  // 6. Bulk-link platforms and tags.
  const toolPlatforms: { toolId: string; platformId: string }[] = [];
  const toolTags: { toolId: string; tagId: string }[] = [];
  for (const r of toAdd) {
    const toolId = idMap.get(r.slug);
    if (!toolId) continue;
    for (const p of r.platforms) {
      const pid = platMap.get(p);
      if (pid) toolPlatforms.push({ toolId, platformId: pid });
    }
    for (const t of r.tags) {
      const tid = tagMap.get(tagSlug(t));
      if (tid) toolTags.push({ toolId, tagId: tid });
    }
  }
  await chunk(toolPlatforms, 1000, (batch) => prisma.toolPlatform.createMany({ data: batch, skipDuplicates: true }));
  await chunk(toolTags, 1000, (batch) => prisma.toolTag.createMany({ data: batch, skipDuplicates: true }));

  console.log(`[${label}] Added ${toAdd.length} new tools (of ${rows.length} rows) via bulk insert.`);
  return toAdd.length;
}
