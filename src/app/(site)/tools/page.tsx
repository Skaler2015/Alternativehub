import Link from "next/link";
import type { Metadata } from "next";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { ToolCard } from "@/components/tools/tool-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { AdSlot } from "@/components/monetization/ad-slot";
import { Button } from "@/components/ui/button";
import { listTools, getCategories } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";
import { SORT_OPTIONS, PRICING_LABELS, PLATFORM_OPTIONS, FILTER_PRICING } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  category?: string; pricing?: string; platform?: string; q?: string;
  os?: string; verified?: string; trial?: string; sort?: string; page?: string;
}>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Boolean(params.page || params.pricing || params.platform || params.q || params.os || params.verified || params.trial);
  return buildMetadata({
    title: "Browse All Tools & Alternatives",
    description:
      "Browse every app, website, AI tool and software on AlternativeHub. Filter by category, pricing, platform and more to find your next favorite tool.",
    path: "/tools",
    noIndex: filtered,
  });
}

export default async function ToolsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ tools, total, pageSize }, categories] = await Promise.all([
    listTools({
      categorySlug: params.category,
      pricing: params.pricing,
      platform: params.platform,
      q: params.q,
      openSource: params.os === "1",
      verified: params.verified === "1",
      freeTrial: params.trial === "1",
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

  const activeCount =
    (params.category ? 1 : 0) + (params.pricing ? 1 : 0) + (params.platform ? 1 : 0) +
    (params.q ? 1 : 0) + (params.os === "1" ? 1 : 0) + (params.verified === "1" ? 1 : 0) + (params.trial === "1" ? 1 : 0);

  const chip = (active: boolean) =>
    cn("block rounded-lg px-2.5 py-1.5 text-sm transition-colors", active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Browse", path: "/tools" }]} />

      <div className="mt-4 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Browse Tools</h1>
        <p className="text-sm text-muted-foreground">{total} tools{activeCount > 0 ? " match your filters" : " and counting"}</p>
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* ── Filter sidebar ── */}
        <aside className="lg:w-60 lg:shrink-0">
          <div className="space-y-6 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-semibold"><SlidersHorizontal className="size-4" /> Filters</span>
              {activeCount > 0 && <Link href="/tools" className="text-xs text-primary hover:underline">Clear all</Link>}
            </div>

            {/* Search */}
            <form method="get" className="flex items-center gap-2 rounded-lg border bg-background px-3">
              {params.category && <input type="hidden" name="category" value={params.category} />}
              {params.pricing && <input type="hidden" name="pricing" value={params.pricing} />}
              {params.platform && <input type="hidden" name="platform" value={params.platform} />}
              {params.sort && <input type="hidden" name="sort" value={params.sort} />}
              <Search className="size-4 text-muted-foreground" />
              <input name="q" defaultValue={params.q ?? ""} placeholder="Search…" className="h-9 w-full bg-transparent text-sm outline-none" />
            </form>

            {/* Attributes */}
            <div className="space-y-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attributes</p>
              {([["os", "Open source"], ["verified", "Verified"], ["trial", "Free trial"]] as const).map(([key, label]) => {
                const active = params[key] === "1";
                return (
                  <Link key={key} href={qs({ [key]: active ? undefined : "1", page: undefined })} className={chip(active)}>
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("flex size-4 items-center justify-center rounded border", active && "border-primary bg-primary text-primary-foreground")}>{active && <X className="size-3" />}</span>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Pricing */}
            <div className="space-y-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing</p>
              {FILTER_PRICING.map((p) => (
                <Link key={p} href={qs({ pricing: params.pricing === p ? undefined : p, page: undefined })} className={chip(params.pricing === p)}>
                  {PRICING_LABELS[p]}
                </Link>
              ))}
            </div>

            {/* Platform */}
            <div className="space-y-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platform</p>
              {PLATFORM_OPTIONS.map((pl) => (
                <Link key={pl.slug} href={qs({ platform: params.platform === pl.slug ? undefined : pl.slug, page: undefined })} className={chip(params.platform === pl.slug)}>
                  {pl.label}
                </Link>
              ))}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <Link key={cat.slug} href={qs({ category: params.category === cat.slug ? undefined : cat.slug, page: undefined })} className={chip(params.category === cat.slug)}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Results ── */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <Link key={opt.value} href={qs({ sort: opt.value, page: undefined })}
                className={cn("rounded-md px-2 py-1 font-medium transition-colors", (params.sort ?? "popular") === opt.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>
                {opt.label}
              </Link>
            ))}
          </div>

          {tools.length === 0 ? (
            <p className="mt-16 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              No tools match these filters. <Link href="/tools" className="text-primary hover:underline">Clear filters</Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          )}

          <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BROWSE} className="mt-8" />

          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {page > 1 && <Button variant="outline" size="sm" asChild><Link href={qs({ page: String(page - 1) })}>← Previous</Link></Button>}
              <span className="px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              {page < totalPages && <Button variant="outline" size="sm" asChild><Link href={qs({ page: String(page + 1) })}>Next →</Link></Button>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
