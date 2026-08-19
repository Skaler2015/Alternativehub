import Link from "next/link";
import { ArrowLeft, Info, MousePointerClick, Eye, Percent, Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getGscConfig, fetchGscSummary, type GscRow } from "@/lib/rank/gsc";
import { GscForm } from "@/components/admin/rank/gsc-form";

export const dynamic = "force-dynamic";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const pos = (n: number) => (n > 0 ? n.toFixed(1) : "—");

export default async function RankGscPage() {
  const config = await getGscConfig();
  const summary = config.configured ? await fetchGscSummary(28) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Rank Tracker
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Search Console</h1>
        <p className="text-sm text-muted-foreground">Clicks, impressions, CTR and average position — straight from Google.</p>
      </div>

      {/* The critical separation notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-400" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">This is not SERP rank.</span> Search Console&apos;s{" "}
          <b>average position</b> is Google&apos;s own averaged metric across impressions — it is a different number from the
          actual SERP rank shown in the <Link href="/admin/rank/rankings" className="text-primary hover:underline">Rankings</Link> tab.
          They are shown separately on purpose and should never be mixed.
        </p>
      </div>

      {config.configured && summary?.ok ? (
        <>
          <p className="text-xs text-muted-foreground">Last 28 days ({summary.range.startDate} → {summary.range.endDate})</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={MousePointerClick} label="Clicks" value={summary.totals.clicks.toLocaleString()} />
            <Stat icon={Eye} label="Impressions" value={summary.totals.impressions.toLocaleString()} />
            <Stat icon={Percent} label="Avg CTR" value={pct(summary.totals.ctr)} />
            <Stat icon={Gauge} label="Avg Position (GSC)" value={pos(summary.totals.position)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <GscTable title="Top queries" rows={summary.topQueries} />
            <GscTable title="Top pages" rows={summary.topPages} pageMode />
          </div>
        </>
      ) : config.configured && summary && !summary.ok ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold text-amber-700 dark:text-amber-300">Could not fetch Search Console data.</p>
          <p className="mt-1 text-muted-foreground">{summary.error}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold text-amber-700 dark:text-amber-300">Search Console is not configured.</p>
          <p className="mt-1 text-muted-foreground">Set it up below to see clicks, impressions, CTR and average position.</p>
        </div>
      )}

      {/* Setup */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold">Connect Search Console (service account)</h2>
          <ol className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <li>1. In Google Cloud, create a project and enable the <b>Search Console API</b>.</li>
            <li>2. Create a <b>service account</b> and download its <b>JSON key</b>.</li>
            <li>3. In Search Console → Settings → Users and permissions, add the service account&apos;s email (ends with <code className="rounded bg-muted px-1">.iam.gserviceaccount.com</code>) as a <b>Full</b> or <b>Restricted</b> user.</li>
            <li>4. Paste the property URL and the JSON key below, tick Enable, and Save.</li>
          </ol>
          <div className="mt-4">
            <GscForm initial={{ enabled: config.enabled, siteUrl: config.siteUrl ?? "", clientEmail: config.clientEmail }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
        <Icon className="size-6 text-primary" />
      </CardContent>
    </Card>
  );
}

function GscTable({ title, rows, pageMode }: { title: string; rows: GscRow[]; pageMode?: boolean }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b p-3 text-sm font-semibold">{title}</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="p-2.5 font-medium">{pageMode ? "Page" : "Query"}</th>
                <th className="p-2.5 font-medium">Clicks</th>
                <th className="p-2.5 font-medium">Impr.</th>
                <th className="p-2.5 font-medium">CTR</th>
                <th className="p-2.5 font-medium">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No data.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.key} className="border-b last:border-0">
                  <td className="p-2.5 max-w-[220px] truncate">{pageMode ? r.key.replace(/^https?:\/\//, "") : r.key}</td>
                  <td className="p-2.5 tabular-nums">{r.clicks}</td>
                  <td className="p-2.5 tabular-nums text-muted-foreground">{r.impressions}</td>
                  <td className="p-2.5 tabular-nums text-muted-foreground">{pct(r.ctr)}</td>
                  <td className="p-2.5 tabular-nums text-muted-foreground">{pos(r.position)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
