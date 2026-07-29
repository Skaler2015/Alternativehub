import Link from "next/link";
import { BadgeCheck, Sparkles, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToolLogo } from "@/components/tools/tool-logo";
import { RatingStars } from "@/components/tools/rating-stars";
import { PRICING_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import type { ToolCard as ToolCardData } from "@/lib/data/queries";

export function ToolCard({ tool }: { tool: ToolCardData }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col gap-3 rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg"
    >
      {tool.tier === "SPONSORED" && (
        <span className="absolute right-4 top-4 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Sponsored
        </span>
      )}

      <div className="flex items-start gap-3">
        <ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold transition-colors group-hover:text-primary">
              {tool.name}
            </h3>
            {tool.verified && (
              <BadgeCheck className="size-4 shrink-0 fill-sky-500 text-white" aria-label="Verified" />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{tool.category.name}</p>
        </div>
      </div>

      <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{tool.tagline}</p>

      <div className="mt-auto flex items-center justify-between gap-2">
        <RatingStars rating={tool.rating} showValue reviewCount={tool.reviewCount} />
        <div className="flex items-center gap-2">
          {tool.upvotes > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ThumbsUp className="size-3" /> {formatNumber(tool.upvotes)}
            </span>
          )}
          <Badge
            variant={
              tool.pricingModel === "FREE" || tool.pricingModel === "OPEN_SOURCE"
                ? "success"
                : "secondary"
            }
          >
            {PRICING_LABELS[tool.pricingModel]}
          </Badge>
        </div>
      </div>

      {tool.featured && (
        <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          <Sparkles className="size-2.5" /> Featured
        </span>
      )}
    </Link>
  );
}
