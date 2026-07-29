import Link from "next/link";
import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { ToolLogo } from "@/components/tools/tool-logo";
import { CompareBuilder } from "@/components/compare/compare-builder";
import { listComparisons } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Compare Tools Side by Side",
  description:
    "Compare any apps, AI tools or software side by side: features, pricing, platforms, pros & cons, and a clear winner. ChatGPT vs Claude vs Gemini and thousands more.",
  path: "/compare",
});

export default async function CompareIndexPage() {
  const comparisons = await listComparisons();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }]} />

      <div className="mt-4 max-w-2xl">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Scale className="size-7 text-primary" /> Comparison Engine
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick two to four tools and get a full side-by-side breakdown: features, pricing,
          platforms, pros & cons — plus an AI verdict on which one wins.
        </p>
      </div>

      <div className="mt-6">
        <CompareBuilder />
      </div>

      <h2 className="mt-12 text-xl font-semibold">Popular Comparisons</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comparisons.map((cmp) => (
          <Link
            key={cmp.id}
            href={`/compare/${cmp.slug}`}
            className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg"
          >
            <div className="flex items-center gap-2">
              {cmp.items.map((item, i) => (
                <span key={item.toolId} className="flex items-center gap-2">
                  {i > 0 && <span className="text-xs font-bold text-muted-foreground">VS</span>}
                  <ToolLogo name={item.tool.name} logoUrl={item.tool.logoUrl} size={32} />
                </span>
              ))}
            </div>
            <h3 className="mt-3 font-semibold leading-snug transition-colors group-hover:text-primary">
              {cmp.title}
            </h3>
            {cmp.summary && (
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{cmp.summary}</p>
            )}
          </Link>
        ))}
      </div>

      {comparisons.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No saved comparisons yet — build one above.
        </p>
      )}
    </div>
  );
}
