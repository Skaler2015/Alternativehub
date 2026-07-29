import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, Check, Crown, Minus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { ToolLogo } from "@/components/tools/tool-logo";
import { RatingStars } from "@/components/tools/rating-stars";
import { prisma } from "@/lib/prisma";
import { getComparisonBySlug } from "@/lib/data/queries";
import { buildMetadata } from "@/lib/seo";
import { PRICING_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

type CompareTool = NonNullable<
  Awaited<ReturnType<typeof getComparisonBySlug>>
>["items"][number]["tool"];

/** Resolve a comparison: stored record first, else build ad-hoc from the slug. */
async function resolveComparison(slug: string): Promise<{
  title: string;
  summary: string | null;
  winnerId: string | null;
  tools: CompareTool[];
} | null> {
  const stored = await getComparisonBySlug(slug);
  if (stored) {
    return {
      title: stored.title,
      summary: stored.summary,
      winnerId: stored.winnerId,
      tools: stored.items.map((i) => i.tool),
    };
  }

  // Ad-hoc: parse "a-vs-b-vs-c" — greedy match against real slugs
  const parts = slug.split("-vs-");
  if (parts.length < 2 || parts.length > 4) return null;
  try {
    const tools = await prisma.tool.findMany({
      where: { slug: { in: parts }, status: "PUBLISHED", deletedAt: null },
      include: {
        category: true,
        platforms: { include: { platform: true } },
        features: { include: { feature: true } },
        pricingPlans: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (tools.length !== parts.length) return null;
    const ordered = parts.map((p) => tools.find((t) => t.slug === p)!) as CompareTool[];
    return {
      title: `${ordered.map((t) => t.name).join(" vs ")}: Which is Better?`,
      summary: null,
      winnerId: null,
      tools: ordered,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const cmp = await resolveComparison(slug);
  if (!cmp) return { title: "Comparison not found" };
  const names = cmp.tools.map((t) => t.name).join(" vs ");
  return buildMetadata({
    title: `${names} (${new Date().getFullYear()} Comparison)`,
    description: `${names}: side-by-side comparison of features, pricing, platforms, pros & cons — and which one wins for your use case.`,
    path: `/compare/${slug}`,
  });
}

export default async function ComparisonPage({ params }: { params: Params }) {
  const { slug } = await params;
  const cmp = await resolveComparison(slug);
  if (!cmp) notFound();

  const { tools } = cmp;

  // Union of all feature names across compared tools
  const allFeatures = Array.from(
    new Map(
      tools.flatMap((t) => t.features.map((f) => [f.feature.id, f.feature.name] as const)),
    ).entries(),
  );

  const winner =
    (cmp.winnerId && tools.find((t) => t.id === cmp.winnerId)) ||
    [...tools].sort((a, b) => b.alternativeScore - a.alternativeScore)[0];

  const rows: {
    label: string;
    render: (t: CompareTool) => React.ReactNode;
  }[] = [
    {
      label: "Rating",
      render: (t) => <RatingStars rating={t.rating} showValue reviewCount={t.reviewCount} />,
    },
    {
      label: "Pricing",
      render: (t) => (
        <Badge variant={t.pricingModel === "FREE" || t.pricingModel === "OPEN_SOURCE" ? "success" : "secondary"}>
          {PRICING_LABELS[t.pricingModel]}
        </Badge>
      ),
    },
    {
      label: "Free plan",
      render: (t) =>
        ["FREE", "FREEMIUM", "OPEN_SOURCE"].includes(t.pricingModel) ? (
          <Check className="size-4 text-emerald-500" />
        ) : (
          <X className="size-4 text-rose-500" />
        ),
    },
    {
      label: "Starting price",
      render: (t) => {
        const paid = t.pricingPlans.find((p) => Number(p.price) > 0);
        return paid ? `$${Number(paid.price)}/${paid.period}` : "Free";
      },
    },
    {
      label: "Platforms",
      render: (t) => (
        <span className="flex flex-wrap justify-center gap-1">
          {t.platforms.map((p) => (
            <Badge key={p.platformId} variant="outline" className="text-[10px]">
              {p.platform.name}
            </Badge>
          ))}
        </span>
      ),
    },
    { label: "Alternative Score", render: (t) => <b>{Math.round(t.alternativeScore)}/100</b> },
    { label: "AI Score", render: (t) => <b>{Math.round(t.aiScore)}/100</b> },
    { label: "Popularity", render: (t) => formatNumber(t.viewCount) + " views" },
    { label: "Open source", render: (t) => (t.isOpenSource ? <Check className="size-4 text-emerald-500" /> : <X className="size-4 text-rose-500" />) },
    ...allFeatures.map(([featureId, featureName]) => ({
      label: featureName,
      render: (t: CompareTool) => {
        const has = t.features.find((f) => f.feature.id === featureId);
        return has ? (
          <span className="inline-flex flex-col items-center">
            <Check className="size-4 text-emerald-500" />
            {has.detail && <span className="mt-0.5 text-[10px] text-muted-foreground">{has.detail}</span>}
          </span>
        ) : (
          <Minus className="size-4 text-muted-foreground" />
        );
      },
    })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Compare", path: "/compare" },
          { name: tools.map((t) => t.name).join(" vs "), path: `/compare/${slug}` },
        ]}
      />

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{cmp.title}</h1>

      {cmp.summary && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Verdict</p>
          <p className="mt-1.5 text-sm leading-relaxed">{cmp.summary}</p>
        </div>
      )}

      {/* Comparison table */}
      <div className="mt-8 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-card">
              <th className="w-40 p-4 text-left font-medium text-muted-foreground">Tool</th>
              {tools.map((t) => (
                <th key={t.id} className="p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <ToolLogo name={t.name} logoUrl={t.logoUrl} size={48} />
                      {winner?.id === t.id && (
                        <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-amber-400 text-white shadow" title="Winner">
                          <Crown className="size-3.5" />
                        </span>
                      )}
                    </div>
                    <Link href={`/tools/${t.slug}`} className="font-semibold hover:text-primary">
                      {t.name}
                    </Link>
                    <span className="text-xs font-normal text-muted-foreground">{t.category.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-b-0 even:bg-card/50">
                <td className="p-4 font-medium text-muted-foreground">{row.label}</td>
                {tools.map((t) => (
                  <td key={t.id} className="p-4 text-center">
                    {row.render(t)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4" />
              {tools.map((t) => (
                <td key={t.id} className="p-4 text-center">
                  <Button size="sm" asChild>
                    <a href={t.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">
                      Visit <ArrowUpRight className="size-3.5" />
                    </a>
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pros & cons per tool */}
      <div className="mt-10 grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))` }}>
        {tools.map((t) => (
          <div key={t.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2.5">
              <ToolLogo name={t.name} logoUrl={t.logoUrl} size={32} />
              <h2 className="font-semibold">{t.name}</h2>
              {winner?.id === t.id && <Badge variant="warning">Winner</Badge>}
            </div>
            <ul className="mt-4 space-y-1.5">
              {t.pros.slice(0, 4).map((pro) => (
                <li key={pro} className="flex gap-1.5 text-xs text-muted-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> {pro}
                </li>
              ))}
              {t.cons.slice(0, 3).map((con) => (
                <li key={con} className="flex gap-1.5 text-xs text-muted-foreground">
                  <X className="mt-0.5 size-3.5 shrink-0 text-rose-500" /> {con}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
