import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolCard } from "@/components/tools/tool-card";
import { FadeIn } from "@/components/motion/fade-in";
import type { ToolCard as ToolCardData } from "@/lib/data/queries";

export function ToolSection({
  title,
  subtitle,
  tools,
  href,
  icon,
}: {
  title: string;
  subtitle?: string;
  tools: ToolCardData[];
  href?: string;
  icon?: React.ReactNode;
}) {
  if (tools.length === 0) return null;

  return (
    <FadeIn>
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {icon}
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {href && (
            <Link
              href={href}
              className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
            >
              View all
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.slice(0, 8).map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
