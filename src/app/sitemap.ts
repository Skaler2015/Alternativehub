import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

// Cache the sitemap for 12h and serve it from the CDN instead of regenerating
// it (with heavy DB queries) on every crawler request. This is what keeps a
// large catalog from hammering the DB / hitting the Hobby usage limits.
export const revalidate = 43200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tools`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/compare`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/trending`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/deals`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/collections`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/companies`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/leaderboard`, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/submit`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/advertise`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/developers`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [tools, categories, comparisons, posts, collections, companies, altTools, vsPairs] = await Promise.all([
      prisma.tool.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.category.findMany({ select: { slug: true } }),
      prisma.comparison.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.collection.findMany({
        where: { isPublic: true, items: { some: {} } },
        select: { id: true, createdAt: true },
        take: 2000,
      }),
      prisma.company.findMany({
        where: { tools: { some: { status: "PUBLISHED", deletedAt: null } } },
        select: { slug: true, createdAt: true },
        take: 1500,
      }),
      // Every published tool now has a content-rich /alternatives page (C1),
      // so include them all (most-popular first) for "<tool> alternatives".
      prisma.tool.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        select: { slug: true, updatedAt: true },
        orderBy: { popularityScore: "desc" },
        take: 2500,
      }),
      // Alternative edges → programmatic "X vs Y" comparison URLs (C2).
      prisma.alternative.findMany({
        where: {
          source: { status: "PUBLISHED", deletedAt: null },
          target: { status: "PUBLISHED", deletedAt: null },
        },
        select: { source: { select: { slug: true } }, target: { select: { slug: true } } },
        orderBy: { matchScore: "desc" },
        take: 3000,
      }),
    ]);

    // Build unique, sorted "a-vs-b" comparison slugs (the compare page renders
    // these dynamically) so Google can discover and index them.
    const vsSeen = new Set<string>();
    const vsSlugs: string[] = [];
    for (const e of vsPairs) {
      const pair = [e.source.slug, e.target.slug].sort().join("-vs-");
      if (vsSeen.has(pair)) continue;
      vsSeen.add(pair);
      vsSlugs.push(pair);
      if (vsSlugs.length >= 2000) break;
    }

    return [
      ...staticPages,
      ...tools.map((t) => ({
        url: `${base}/tools/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...altTools.map((t) => ({
        url: `${base}/alternatives/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
      ...categories.map((c) => ({
        url: `${base}/categories/${c.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...comparisons.map((c) => ({
        url: `${base}/compare/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...vsSlugs.map((s) => ({
        url: `${base}/compare/${s}`,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...posts.map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...collections.map((c) => ({
        url: `${base}/collections/${c.id}`,
        lastModified: c.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
      ...companies.map((c) => ({
        url: `${base}/companies/${c.slug}`,
        lastModified: c.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticPages;
  }
}
