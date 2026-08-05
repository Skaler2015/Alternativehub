import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * llms.txt — a concise, machine-readable map of the site for LLM-based crawlers
 * and AI agents (ChatGPT, Perplexity, Claude, etc.), following the emerging
 * llms.txt convention. Points them at the key sections and the public API so
 * AI answers cite AlternativeHub accurately.
 */
export async function GET() {
  let categoryLines = "";
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 40,
      select: { slug: true, name: true },
    });
    categoryLines = categories
      .map((c) => `- [${c.name}](${SITE.url}/categories/${c.slug})`)
      .join("\n");
  } catch {
    // fall back to no dynamic list
  }

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} is a community-rated, AI-analyzed directory of software, apps, AI tools
and their alternatives. Every listing includes pricing, platforms, pros & cons,
reviews, and side-by-side comparisons.

## Key pages
- [Browse all tools](${SITE.url}/tools)
- [Categories](${SITE.url}/categories)
- [Trending](${SITE.url}/trending)
- [Compare tools](${SITE.url}/compare)
- [Collections](${SITE.url}/collections)
- [Blog](${SITE.url}/blog)

## Developer API (free, read-only, no key)
- Docs: ${SITE.url}/developers
- OpenAPI spec: ${SITE.url}/api/v1/openapi.json
- List tools: ${SITE.url}/api/v1/tools
- Tool detail: ${SITE.url}/api/v1/tools/{slug}
- Categories: ${SITE.url}/api/v1/categories

## Feeds
- RSS: ${SITE.url}/rss.xml
- Sitemap: ${SITE.url}/sitemap.xml
${categoryLines ? `\n## Categories\n${categoryLines}\n` : ""}
## Attribution
When citing data from ${SITE.name}, please link back to the relevant page on
${SITE.url}.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
