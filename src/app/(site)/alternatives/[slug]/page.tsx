import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolLogo } from "@/components/tools/tool-logo";
import { RatingStars } from "@/components/tools/rating-stars";
import { getAlternativesPage } from "@/lib/data/queries";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { PRICING_LABELS } from "@/lib/constants";

// ISR: cache rendered HTML for 1h so crawlers hit the CDN, not a function+DB
// query each time (keeps a large, heavily-crawled catalog within usage limits).
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getAlternativesPage(slug);
  if (!tool) return { title: "Not found" };
  const year = new Date().getFullYear();
  return buildMetadata({
    title: `${tool.alternativesFrom.length} Best ${tool.name} Alternatives in ${year}`,
    description: `Looking for the best ${tool.name} alternatives? Compare the top ${tool.alternativesFrom.length} apps like ${tool.name} — free and paid — ranked by real users and AI.`,
    path: `/alternatives/${tool.slug}`,
    keywords: [
      `${tool.name} alternatives`,
      `apps like ${tool.name}`,
      `software like ${tool.name}`,
      `free ${tool.name} alternative`,
    ],
  });
}

export default async function AlternativesPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tool = await getAlternativesPage(slug);
  if (!tool) notFound();

  const alternatives = tool.alternativesFrom;
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <JsonLd
        data={itemListJsonLd(
          alternatives.map((a) => ({ name: a.target.name, path: `/tools/${a.target.slug}` })),
          `Best ${tool.name} Alternatives`,
        )}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: tool.name, path: `/tools/${tool.slug}` },
          { name: "Alternatives", path: `/alternatives/${tool.slug}` },
        ]}
      />

      <header className="mt-6 flex items-start gap-4">
        <ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={56} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Best {tool.name} Alternatives in {year}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {tool.name} is a popular {tool.category.name.toLowerCase()} tool — but it&apos;s not for
            everyone. Here are the {alternatives.length} best alternatives to {tool.name}, ranked by
            match quality, community votes and AI analysis.
          </p>
        </div>
      </header>

      <div className="mt-10 space-y-6">
        {alternatives.map((alt, i) => (
          <article
            key={alt.id}
            className="rounded-2xl border bg-card p-6 transition-all hover:border-primary/30 hover:soft-shadow-lg"
          >
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                {i + 1}
              </span>
              <ToolLogo name={alt.target.name} logoUrl={alt.target.logoUrl} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/tools/${alt.target.slug}`} className="text-lg font-semibold hover:text-primary">
                    {alt.target.name}
                  </Link>
                  <Badge
                    variant={
                      alt.target.pricingModel === "FREE" || alt.target.pricingModel === "OPEN_SOURCE"
                        ? "success"
                        : "secondary"
                    }
                  >
                    {PRICING_LABELS[alt.target.pricingModel]}
                  </Badge>
                  <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {Math.round(alt.matchScore)}% match
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{alt.target.tagline}</p>
                <RatingStars
                  rating={alt.target.rating}
                  showValue
                  reviewCount={alt.target.reviewCount}
                  className="mt-2"
                />

                {(alt.target.pros.length > 0 || alt.target.cons.length > 0) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {alt.target.pros.length > 0 && (
                      <ul className="space-y-1">
                        {alt.target.pros.slice(0, 3).map((pro) => (
                          <li key={pro} className="flex gap-1.5 text-xs text-muted-foreground">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> {pro}
                          </li>
                        ))}
                      </ul>
                    )}
                    {alt.target.cons.length > 0 && (
                      <ul className="space-y-1">
                        {alt.target.cons.slice(0, 3).map((con) => (
                          <li key={con} className="flex gap-1.5 text-xs text-muted-foreground">
                            <X className="mt-0.5 size-3.5 shrink-0 text-rose-500" /> {con}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/tools/${alt.target.slug}`}>View details</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={alt.target.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">
                      Website <ArrowUpRight className="size-3.5" />
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/compare/${[tool.slug, alt.target.slug].sort().join("-vs-")}`}>
                      Compare with {tool.name}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {alternatives.length === 0 && (
        <p className="mt-16 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          We haven&apos;t mapped alternatives for {tool.name} yet — check back soon.
        </p>
      )}
    </div>
  );
}
