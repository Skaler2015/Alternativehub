import { Star } from "lucide-react";

/** G2-style rating distribution: average + per-star bars. Pure, server-rendered. */
export function RatingBreakdown({
  average,
  total,
  counts,
}: {
  average: number;
  total: number;
  counts: Record<number, number>;
}) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
      <div className="flex shrink-0 flex-col items-center justify-center px-4 text-center">
        <span className="text-4xl font-bold tracking-tight">{average.toFixed(1)}</span>
        <div className="mt-1 flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`size-4 ${i <= Math.round(average) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
          ))}
        </div>
        <span className="mt-1 text-xs text-muted-foreground">{total} review{total === 1 ? "" : "s"}</span>
      </div>

      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star] ?? 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="flex w-6 shrink-0 items-center gap-0.5 text-muted-foreground">{star}<Star className="size-3 fill-amber-400 text-amber-400" /></span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
