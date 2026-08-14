import Link from "next/link";
import { Check, Minus, Star } from "lucide-react";
import { ToolLogo } from "@/components/tools/tool-logo";
import { PRICING_LABELS } from "@/lib/constants";
import type { PricingModel } from "@prisma/client";

type Col = {
  slug: string;
  name: string;
  logoUrl: string | null;
  rating: number;
  reviewCount: number;
  pricingModel: PricingModel;
  isOpenSource: boolean;
};

/**
 * Deterministic side-by-side comparison of a tool against its top alternatives.
 * Pure data (no AI) — adds unique, keyword-rich content that targets "X vs Y"
 * searches and can qualify for comparison rich results. Scrolls horizontally on
 * small screens so it never breaks the page layout.
 */
export function ComparisonTable({ tool, alternatives }: { tool: Col; alternatives: Col[] }) {
  const cols = [tool, ...alternatives.slice(0, 3)];
  if (cols.length < 2) return null;

  const rows: { label: string; render: (c: Col) => React.ReactNode }[] = [
    {
      label: "Rating",
      render: (c) => (
        <span className="inline-flex items-center gap-1 font-medium">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          {c.rating > 0 ? c.rating.toFixed(1) : "—"}
          {c.reviewCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({c.reviewCount})</span>
          )}
        </span>
      ),
    },
    { label: "Pricing", render: (c) => <span>{PRICING_LABELS[c.pricingModel]}</span> },
    {
      label: "Open source",
      render: (c) =>
        c.isOpenSource ? (
          <Check className="size-4 text-emerald-500" aria-label="Yes" />
        ) : (
          <Minus className="size-4 text-muted-foreground/50" aria-label="No" />
        ),
    },
  ];

  return (
    <section id="comparison">
      <h2 className="text-xl font-semibold">
        {tool.name} vs {alternatives.slice(0, 3).map((a) => a.name).join(", ")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        How {tool.name} compares to its top alternatives at a glance.
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="p-3 text-left font-medium text-muted-foreground">&nbsp;</th>
              {cols.map((c, i) => (
                <th key={c.slug} className="p-3 text-left">
                  <Link href={`/tools/${c.slug}`} className="inline-flex items-center gap-2 hover:text-primary">
                    <ToolLogo name={c.name} logoUrl={c.logoUrl} size={24} />
                    <span className="font-semibold">
                      {c.name}
                      {i === 0 && <span className="ml-1 text-[10px] font-normal text-muted-foreground">(this)</span>}
                    </span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                {cols.map((c) => (
                  <td key={c.slug} className="p-3">{row.render(c)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-3 font-medium text-muted-foreground">Learn more</td>
              {cols.map((c) => (
                <td key={c.slug} className="p-3">
                  <Link href={`/tools/${c.slug}`} className="text-primary hover:underline">
                    View →
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
