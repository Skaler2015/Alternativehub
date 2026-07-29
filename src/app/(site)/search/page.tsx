import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { ToolCard } from "@/components/tools/tool-card";
import { searchTools } from "@/lib/search";
import { prisma } from "@/lib/prisma";
import { toolCardSelect, type ToolCard as ToolCardData } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; category?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { q } = await searchParams;
  return buildMetadata({
    title: q ? `Search results for "${q}"` : "Search",
    description: `Search results for ${q ?? "software and tools"} on AlternativeHub.`,
    path: "/search",
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, category } = await searchParams;
  const query = q?.trim() ?? "";

  let tools: ToolCardData[] = [];
  if (query) {
    try {
      const { hits } = await searchTools(query, { category, limit: 48 });
      if (hits.length) {
        const rows = await prisma.tool.findMany({
          where: { id: { in: hits.map((h) => h.id) } },
          select: toolCardSelect,
        });
        const order = new Map(hits.map((h, i) => [h.id, i]));
        tools = rows.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
      }
    } catch {
      tools = [];
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Search", path: "/search" }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {query ? `Results for "${query}"` : "Search"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {query ? `${tools.length} tools found` : "Type in the search bar above to find tools"}
      </p>

      {query && tools.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nothing found for &ldquo;{query}&rdquo;. Try a broader term or check the spelling.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
