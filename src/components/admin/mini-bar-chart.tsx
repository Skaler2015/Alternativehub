/**
 * Dependency-free SVG bar chart for the admin analytics dashboard.
 * Server-rendered — no client JS, no external charting library.
 */
export function MiniBarChart({
  data,
  height = 160,
}: {
  data: { date: string; views: number }[];
  height?: number;
}) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No data yet.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.views));
  const barGap = 2;
  const total = data.reduce((s, d) => s + d.views, 0);

  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {data.map((d) => {
          const h = Math.round((d.views / max) * (height - 24));
          const label = new Date(d.date + "T00:00:00Z").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ minWidth: 4, marginInline: barGap / 2 }}
            >
              <span className="pointer-events-none absolute -top-1 z-10 hidden -translate-y-full whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[11px] shadow group-hover:block">
                {label}: <b>{d.views}</b>
              </span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-indigo-500/60 to-violet-500 transition-colors group-hover:from-indigo-500 group-hover:to-violet-400"
                style={{ height: Math.max(2, h) }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{new Date(data[0].date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>{total.toLocaleString()} total</span>
        <span>{new Date(data[data.length - 1].date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}
