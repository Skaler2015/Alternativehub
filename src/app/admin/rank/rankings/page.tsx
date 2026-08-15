import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrCreateProject, pagedRankings } from "@/lib/rank/data";
import { rankBucket } from "@/lib/rank/normalize";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  filter?: string; q?: string; group?: string; sort?: string; page?: string; pageSize?: string;
}>;

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "top3", label: "Top 3" },
  { key: "top10", label: "Top 10" },
  { key: "top20", label: "Top 20" },
  { key: "top50", label: "Top 50" },
  { key: "top100", label: "Top 100" },
  { key: "notranking", label: "Not Ranking" },
  { key: "improved", label: "Improved" },
  { key: "dropped", label: "Dropped" },
  { key: "nochange", label: "No Change" },
  { key: "new", label: "New" },
  { key: "newlyranking", label: "Newly Ranking" },
  { key: "droppedout", label: "Dropped Out" },
];

const MOVE_CLS: Record<string, string> = {
  Improved: "text-emerald-600 dark:text-emerald-400",
  Dropped: "text-rose-600 dark:text-rose-400",
  "Dropped Out": "text-rose-600 dark:text-rose-400",
  "Newly Ranking": "text-emerald-600 dark:text-emerald-400",
  New: "text-sky-600 dark:text-sky-400",
};

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function RankRankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filter = sp.filter ?? "all";
  const q = sp.q ?? "";
  const sort = sp.sort ?? "best";
  const page = Number(sp.page) || 1;
  const pageSize = [25, 50, 100, 250].includes(Number(sp.pageSize)) ? Number(sp.pageSize) : 50;

  const project = await getOrCreateProject();
  const { rows, total, pages } = await pagedRankings(project.id, { filter, q, sort, page, pageSize });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/rank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Rank Tracker
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Rankings</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} keyword(s) · page {page} of {pages}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/admin/rank/export"><Download className="size-4" /> Export CSV</a>
        </Button>
      </div>

      {/* Search */}
      <form className="flex gap-2" action="/admin/rank/rankings" method="get">
        <input type="hidden" name="filter" value={filter} />
        <input type="hidden" name="sort" value={sort} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search keywords…"
          className="w-full max-w-sm rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <Button type="submit" size="sm" variant="outline">Search</Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/rank/rankings${qs({ filter: f.key === "all" ? undefined : f.key, q, sort })}`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filter === f.key || (f.key === "all" && filter === "all")
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Sort */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Sort:</span>
        {[
          { key: "best", label: "Best rank" },
          { key: "worst", label: "Worst rank" },
          { key: "keyword", label: "Keyword A→Z" },
          { key: "checked", label: "Recently checked" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/admin/rank/rankings${qs({ filter: filter === "all" ? undefined : filter, q, sort: s.key })}`}
            className={`rounded-lg border px-2 py-1 transition-colors ${sort === s.key ? "border-primary text-primary" : "hover:border-primary/40"}`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">#</th>
                  <th className="p-3 font-medium">Keyword</th>
                  <th className="p-3 font-medium">Rank</th>
                  <th className="p-3 font-medium">Prev</th>
                  <th className="p-3 font-medium">Change</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Ranking URL</th>
                  <th className="p-3 font-medium">Checked</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No keywords match this view.</td></tr>
                ) : (
                  rows.map((r, i) => {
                    const change = r.previousRank != null && r.currentRank != null ? r.previousRank - r.currentRank : null;
                    const mismatch = !!(r.targetUrl && r.rankingUrl && !r.rankingUrl.includes(r.targetUrl));
                    return (
                      <tr key={r.id} className="border-b last:border-0 align-top">
                        <td className="p-3 text-muted-foreground">{(page - 1) * pageSize + i + 1}</td>
                        <td className="p-3">
                          <Link href={`/admin/rank/keyword/${r.id}`} className="font-medium hover:text-primary">{r.keyword}</Link>
                          {r.groupName && <span className="ml-2 text-xs text-muted-foreground">{r.groupName}</span>}
                        </td>
                        <td className="p-3 font-semibold tabular-nums">{r.currentRank ?? "—"}</td>
                        <td className="p-3 tabular-nums text-muted-foreground">{r.previousRank ?? "—"}</td>
                        <td className="p-3 tabular-nums">
                          {change == null ? "—" : (
                            <span className={change > 0 ? "text-emerald-600 dark:text-emerald-400" : change < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}>
                              {change > 0 ? `↑ ${change}` : change < 0 ? `↓ ${Math.abs(change)}` : "0"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <Badge variant="secondary">{rankBucket(r.currentRank)}</Badge>
                            {r.lastStatus && <span className={`text-xs ${MOVE_CLS[r.lastStatus] ?? "text-muted-foreground"}`}>{r.lastStatus}</span>}
                          </div>
                        </td>
                        <td className="p-3 max-w-[240px]">
                          {r.rankingUrl ? (
                            <a href={r.rankingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 truncate text-primary hover:underline">
                              <span className="truncate">{r.rankingUrl.replace(/^https?:\/\//, "")}</span>
                              <ExternalLink className="size-3 shrink-0" />
                            </a>
                          ) : <span className="text-muted-foreground">—</span>}
                          {mismatch && <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">Differs from target URL</p>}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {r.lastCheckedAt ? new Date(r.lastCheckedAt).toLocaleDateString() : r.lastError ? "Failed" : "Never"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-1.5 text-xs">
            {[25, 50, 100, 250].map((ps) => (
              <Link key={ps} href={`/admin/rank/rankings${qs({ filter: filter === "all" ? undefined : filter, q, sort, pageSize: ps })}`}
                className={`rounded border px-2 py-1 ${pageSize === ps ? "border-primary text-primary" : "hover:border-primary/40"}`}>{ps}/pg</Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/rank/rankings${qs({ filter: filter === "all" ? undefined : filter, q, sort, pageSize, page: page - 1 })}`}>← Prev</Link>
              </Button>
            )}
            <span className="text-xs text-muted-foreground">Page {page} / {pages}</span>
            {page < pages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/rank/rankings${qs({ filter: filter === "all" ? undefined : filter, q, sort, pageSize, page: page + 1 })}`}>Next →</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
