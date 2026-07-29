import Link from "next/link";
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Search as SearchIcon,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { getAnalyticsSummary } from "@/lib/data/analytics";
import { MiniBarChart } from "@/components/admin/mini-bar-chart";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PERIODS = [
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
];

type SearchParams = Promise<{ days?: string }>;

export default async function AdminAnalytics({ searchParams }: { searchParams: SearchParams }) {
  const { days: daysParam } = await searchParams;
  const days = [7, 30, 90].includes(Number(daysParam)) ? Number(daysParam) : 30;
  const a = await getAnalyticsSummary(days);

  const cards = [
    { label: "Page Views", value: a.totals.pageViews, icon: Eye },
    { label: "Tool Views", value: a.totals.toolViews, icon: BarChart3 },
    { label: "Searches", value: a.totals.searches, icon: SearchIcon },
    { label: "Outbound Clicks", value: a.totals.clickOuts + a.totals.affiliateClicks, icon: MousePointerClick },
  ];

  const deviceTotal = a.devices.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Traffic &amp; engagement over the last {days} days</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.days}
              href={`/admin/analytics?days=${p.days}`}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                p.days === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-5">
            <c.icon className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-bold">{formatNumber(c.value)}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Page views timeseries */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Page views per day</h2>
        <MiniBarChart data={a.timeseries} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top tools */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Most viewed tools</h2>
          {a.topTools.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tool views recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {a.topTools.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-muted-foreground">{i + 1}.</span>
                  <Link href={`/tools/${t.slug}`} className="flex-1 truncate font-medium hover:text-primary">
                    {t.name}
                  </Link>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {formatNumber(t.views)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top searches */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
            <SearchIcon className="size-4" /> Top searches
          </h2>
          {a.topSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No searches recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {a.topSearches.map((s) => (
                <div key={s.query} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{s.query}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatNumber(s.count)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Device split */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
            <Smartphone className="size-4" /> Devices
          </h2>
          {a.devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {a.devices.map((d) => {
                const pct = Math.round((d.count / deviceTotal) * 100);
                return (
                  <div key={d.device}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize">{d.device}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top referrers */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
            <ExternalLink className="size-4" /> Top referrers
          </h2>
          {a.topReferrers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrers recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {a.topReferrers.map((r) => (
                <div key={r.referrer} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{r.referrer}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatNumber(r.count)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
