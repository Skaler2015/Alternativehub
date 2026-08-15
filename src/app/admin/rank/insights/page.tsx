import Link from "next/link";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Clock, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { computeInsights, getOrCreateProject } from "@/lib/rank/data";

export const dynamic = "force-dynamic";

export default async function RankInsightsPage() {
  const project = await getOrCreateProject();
  const ins = await computeInsights(project.id);

  const headline = [
    { label: "Entered Top 10", value: ins.enteredTop10, cls: "text-emerald-600 dark:text-emerald-400", href: "/admin/rank/rankings?filter=top10" },
    { label: "Left Top 10", value: ins.leftTop10, cls: "text-rose-600 dark:text-rose-400", href: "/admin/rank/rankings?filter=dropped" },
    { label: "Entered Top 20", value: ins.enteredTop20, cls: "text-emerald-600 dark:text-emerald-400", href: "/admin/rank/rankings?filter=top20" },
    { label: "Left Top 20", value: ins.leftTop20, cls: "text-rose-600 dark:text-rose-400", href: "/admin/rank/rankings?filter=dropped" },
  ];

  const secondary = [
    { label: "Gaining", value: ins.gaining, icon: ArrowUpRight, cls: "text-emerald-600 dark:text-emerald-400" },
    { label: "Losing", value: ins.losing, icon: ArrowDownRight, cls: "text-rose-600 dark:text-rose-400" },
    { label: "Not checked in 7d", value: ins.notCheckedRecently, icon: Clock, cls: "text-amber-600 dark:text-amber-400" },
    { label: "With errors", value: ins.withErrors, icon: TriangleAlert, cls: "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Rank Tracker
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">Automatic signals from the latest vs previous check of each keyword.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {headline.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {secondary.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div><p className="text-xs text-muted-foreground">{c.label}</p><p className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value.toLocaleString()}</p></div>
              <c.icon className={`size-6 ${c.cls}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SampleList title="Biggest gains" cls="text-emerald-600 dark:text-emerald-400" rows={ins.gainingSample} />
        <SampleList title="Biggest drops" cls="text-rose-600 dark:text-rose-400" rows={ins.losingSample} />
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-rose-600 dark:text-rose-400">Keywords with errors</h2>
            {ins.errorSample.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">None 🎉</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {ins.errorSample.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/rank/keyword/${r.id}`} className="font-medium hover:text-primary">{r.keyword}</Link>
                    <p className="text-xs text-muted-foreground">{r.lastError}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SampleList({
  title, cls, rows,
}: {
  title: string;
  cls: string;
  rows: { id: string; keyword: string; previousRank: number | null; currentRank: number | null }[];
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className={`text-sm font-semibold ${cls}`}>{title}</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {rows.map((r) => {
              const change = r.previousRank != null && r.currentRank != null ? r.previousRank - r.currentRank : null;
              return (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <Link href={`/admin/rank/keyword/${r.id}`} className="truncate font-medium hover:text-primary">{r.keyword}</Link>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {r.previousRank ?? "—"} → {r.currentRank ?? "—"}
                    {change != null && <span className={`ml-1 ${change > 0 ? "text-emerald-600 dark:text-emerald-400" : change < 0 ? "text-rose-600 dark:text-rose-400" : ""}`}>({change > 0 ? `+${change}` : change})</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
