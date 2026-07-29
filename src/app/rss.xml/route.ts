import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  let items = "";
  try {
    const [tools, posts] = await Promise.all([
      prisma.tool.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        orderBy: { publishedAt: "desc" },
        take: 20,
        select: { name: true, slug: true, tagline: true, publishedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        take: 20,
        select: { title: true, slug: true, excerpt: true, publishedAt: true },
      }),
    ]);

    const entries = [
      ...tools.map((t) => ({
        title: `New tool: ${t.name}`,
        link: `${SITE.url}/tools/${t.slug}`,
        description: t.tagline ?? "",
        date: t.publishedAt ?? new Date(),
      })),
      ...posts.map((p) => ({
        title: p.title,
        link: `${SITE.url}/blog/${p.slug}`,
        description: p.excerpt,
        date: p.publishedAt ?? new Date(),
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    items = entries
      .map(
        (e) => `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${e.link}</link>
      <guid>${e.link}</guid>
      <description>${escapeXml(e.description)}</description>
      <pubDate>${e.date.toUTCString()}</pubDate>
    </item>`,
      )
      .join("\n");
  } catch {
    // empty feed on DB failure
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE.name}</title>
    <link>${SITE.url}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
