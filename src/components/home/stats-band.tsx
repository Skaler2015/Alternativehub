import { FadeIn } from "@/components/motion/fade-in";
import { formatNumber } from "@/lib/utils";
import type { PlatformStats } from "@/lib/data/queries";

export function StatsBand({ stats }: { stats: PlatformStats }) {
  const items = [
    { value: stats.tools, label: "Tools listed", suffix: "+" },
    { value: stats.categories, label: "Categories", suffix: "" },
    { value: stats.reviews, label: "Community reviews", suffix: "" },
    { value: stats.totalViews, label: "Tools explored", suffix: "" },
  ];

  return (
    <FadeIn>
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 rounded-3xl border bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 p-8 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="text-gradient">
                  {formatNumber(item.value)}
                  {item.suffix}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
