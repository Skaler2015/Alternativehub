import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolLogo } from "@/components/tools/tool-logo";
import type { Award } from "@/lib/compare";

type AwardTool = { id: string; slug: string; name: string; logoUrl: string | null };

export function AwardsGrid({ awards }: { awards: Award<AwardTool>[] }) {
  const visible = awards.filter((a) => a.tool);
  if (visible.length === 0) return null;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((award) => {
        const Icon =
          ((Icons as unknown as Record<string, LucideIcon>)[award.icon]) || Icons.Award;
        const tool = award.tool!;
        return (
          <Link
            key={award.key}
            href={`/tools/${tool.slug}`}
            className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-500">
              <Icon className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {award.label}
              </p>
              <div className="flex items-center gap-1.5">
                <ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={18} />
                <span className="truncate font-semibold transition-colors group-hover:text-primary">
                  {tool.name}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
