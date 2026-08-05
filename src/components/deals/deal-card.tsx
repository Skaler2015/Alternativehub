"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Check, Tag, ExternalLink, Clock } from "lucide-react";
import { ToolLogo } from "@/components/tools/tool-logo";
import { cn } from "@/lib/utils";
import type { DealCardData } from "@/lib/data/deals";

function daysLeft(endsAt: Date | string | null): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  const diff = end - Date.now();
  if (diff <= 0) return null;
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  return days <= 1 ? "Ends today" : `${days} days left`;
}

export function DealCard({ deal, showTool = true }: { deal: DealCardData; showTool?: boolean }) {
  const [copied, setCopied] = React.useState(false);
  const remaining = daysLeft(deal.endsAt);

  const copy = async () => {
    if (!deal.couponCode) return;
    try {
      await navigator.clipboard.writeText(deal.couponCode);
      setCopied(true);
      toast.success("Coupon code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:soft-shadow-lg",
        deal.featured && "border-primary/40 ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {showTool ? (
          <Link href={`/tools/${deal.tool.slug}`} className="flex min-w-0 items-center gap-2.5">
            <ToolLogo name={deal.tool.name} logoUrl={deal.tool.logoUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">{deal.tool.name}</p>
              {deal.tool.tagline && (
                <p className="truncate text-xs text-muted-foreground">{deal.tool.tagline}</p>
              )}
            </div>
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Tag className="size-4" /> Deal
          </span>
        )}
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          {deal.discountLabel}
        </span>
      </div>

      <h3 className="mt-3 font-semibold leading-snug">{deal.title}</h3>
      {deal.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{deal.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {deal.couponCode && (
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
            aria-label="Copy coupon code"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {deal.couponCode}
          </button>
        )}
        {remaining && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" /> {remaining}
          </span>
        )}
      </div>

      <a
        href={`/api/deals/${deal.id}/go`}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Get deal <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}
