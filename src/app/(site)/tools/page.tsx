import Link from "next/link";
import type { Metadata } from "next";
import { ToolCard } from "@/components/tools/tool-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Button } from "@/components/ui/button";
import { listTools, getCategories } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";
import { SORT_OPTIONS, PRICING_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string; pricing?: string; sort?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  return buildMetadata({
    title: "Browse All Tools & Alternatives",
    description:
      "Browse every app, website, AI tool and software listed on AlternativeHub. Filter by category, pricing and rating to find your next favorite tool.",
    path: "/tools",
    noIndex: Boolean(params.page || params.pricing),
  });
}

export default async function ToolsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ tools, total, pageSize }, categories] = await Promise.all([
    listTools({
      categorySlug: params.category,
      pricing: params.pricing,
      sort: params.sort,
      page,
    }),
    getCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const qs = (patch: Record<string, string | undefined>) => {
    const merged = { ...params, ...patch };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/tools?${s}` : "/tools";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Browse", path: "/tools" }]} />

      <div className="mt-4 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Browse Tools</h1>
        <p className="text-sm text-muted-foreground">{total} tools and counting</p>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={qs({ category: undefined, page: undefined })}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
            !params.category ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </Link>
        {categories.slice(0, 12).map((cat) => (
          <Link
            key={cat.slug}
            href={qs({ category: cat.slug, page: undefined })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              params.category === cat.slug
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={qs({ sort: opt.value, page: undefined })}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                (params.sort ?? "popular") === opt.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Pricing:</span>
          {["FREE", "FREEMIUM", "OPEN_SOURCE", "PAID"].map((p) => (
            <Link
              key={p}
              href={qs({ pricing: params.pricing === p ? undefined : p, page: undefined })}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                params.pricing === p
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {PRICING_LABELS[p]}
            </Link>
          ))}
        </div>
      </div>

      {tools.length === 0 ? (
        <p className="mt-16 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No tools match these filters yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={qs({ page: String(page - 1) })}>← Previous</Link>
            </Button>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={qs({ page: String(page + 1) })}>Next →</Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
