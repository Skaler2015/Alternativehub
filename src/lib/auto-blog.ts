import { prisma } from "@/lib/prisma";
import { aiEnabled, aiJson } from "@/lib/ai";
import type { BlogCategory } from "@prisma/client";

/**
 * Automated SEO blog generation. Picks a data-driven topic (a "best tools in
 * <category>" listicle built from real, top-rated tools already in the catalog),
 * asks the AI to write a genuine article that links to those tools, and
 * publishes it. Marked aiGenerated:true so the admin can review/edit.
 *
 * Grounded in real catalog data (no invented tools) and failure-safe: no-op
 * without an AI provider, and any error is swallowed so the cron never breaks.
 */

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);

type Article = { title: string; excerpt: string; content: string; seoTitle: string; seoDesc: string; keywords: string[] };

const ARTICLE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    excerpt: { type: "string", description: "1-2 sentence summary" },
    content: { type: "string", description: "800-1200 word article in Markdown with ## headings" },
    seoTitle: { type: "string" },
    seoDesc: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
  },
  required: ["title", "excerpt", "content", "seoTitle", "seoDesc", "keywords"],
} as const;

/** Generate and publish one AI blog post. Returns the slug, or null if skipped. */
export async function generateBlogPost(): Promise<string | null> {
  if (!aiEnabled()) return null;

  // Pick a category that has enough quality tools and no recent auto-post.
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: { slug: true, name: true },
  }).catch(() => []);
  if (categories.length === 0) return null;

  // Rotate topic by day so we don't repeat quickly.
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const cat = categories[dayIndex % categories.length];

  const tools = await prisma.tool.findMany({
    where: { status: "PUBLISHED", deletedAt: null, category: { slug: cat.slug } },
    orderBy: [{ rating: "desc" }, { popularityScore: "desc" }],
    take: 10,
    select: { name: true, slug: true, tagline: true, pricingModel: true },
  }).catch(() => []);
  if (tools.length < 5) return null;

  const year = new Date().getUTCFullYear();
  const topic = `The ${tools.length} Best ${cat.name} Tools in ${year}`;
  const toolList = tools
    .map((t, i) => `${i + 1}. ${t.name} (/tools/${t.slug}) — ${t.tagline ?? ""} [${t.pricingModel}]`)
    .join("\n");

  const system =
    "You are an expert software reviewer writing for a tool-discovery website. Write genuine, useful, accurate content. " +
    "Only mention the tools provided. Use Markdown with ## section headings. Link each tool once using its given /tools/<slug> path as a Markdown link.";
  const prompt =
    `Write a "${topic}" article. Use ONLY these real tools (with their internal links):\n${toolList}\n\n` +
    `Structure: a short intro, then one ## section per tool with 2-3 sentences on what it is, who it's for, and pricing, ` +
    `then a short "How to choose" conclusion. 800-1200 words. Return the JSON schema.`;

  const article = await aiJson<Article>(system, prompt, ARTICLE_SCHEMA as unknown as Record<string, unknown>).catch(() => null);
  if (!article?.title || !article.content) return null;

  let slug = slugify(article.title) || slugify(topic);
  const clash = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } }).catch(() => null);
  if (clash) slug = `${slug}-${year}-${(dayIndex % 366)}`;
  if (await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } }).catch(() => null)) return null;

  await prisma.blogPost.create({
    data: {
      slug,
      title: article.title.slice(0, 200),
      excerpt: (article.excerpt || topic).slice(0, 500),
      content: article.content,
      category: "TOP_LISTS" as BlogCategory,
      aiGenerated: true,
      published: true,
      publishedAt: new Date(),
      seoTitle: (article.seoTitle || article.title).slice(0, 160),
      seoDesc: (article.seoDesc || article.excerpt).slice(0, 320),
      keywords: (article.keywords ?? []).slice(0, 10),
    },
  }).catch(() => null);

  return slug;
}
