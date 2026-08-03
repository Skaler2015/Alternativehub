import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/tools`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/compare`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/collections`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/companies`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/leaderboard`, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/submit`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/advertise`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [tools, categories, comparisons, posts, collections, companies, altTools] = await Promise.all([
      prisma.tool.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        select: { slug: true, updatedAt: true, logoUrl: true },
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
        take: 3000,
      }),
      prisma.tool.findMany({
        where: { status: "PUBLISHED", deletedAt: null, alternativesFrom: { some: {} } },
        select: { slug: true, updatedAt: true },
        take: 2000,
      }),
    ]);

    return [
      ...staticPages,
      ...tools.map((t) => ({
        url: `${base}/tools/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        // Image sitemap support
        ...(t.logoUrl ? { images: [t.logoUrl] } : {}),
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
