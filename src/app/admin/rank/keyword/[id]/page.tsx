import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { rankBucket } from "@/lib/rank/normalize";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function KeywordDetail({ params }: { params: Params }) {
  const { id } = await params;
  const keyword = await prisma.rankKeyword.findUnique({ where: { id } });
  if (!keyword) notFound();

  const history = await prisma.rankHistory.findMany({
    where: { keywordId: id },
    orderBy: { checkedAt: "desc" },
    take: 60,
  });

  const change = keyword.previousRank != null && keyword.currentRank != null ? keyword.previousRank - keyword.currentRank : null;

  // Cannibalization: count distinct ranking URLs seen in history.
  const urlCounts = new Map<string, number>();
  for (const h of history) if (h.rankingUrl) urlCounts.set(h.rankingUrl, (urlCounts.get(h.rankingUrl) ?? 0) + 1);
  const distinctUrls = [...urlCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Simple chart data (oldest → newest), only points that ranked.
  const points = [...history].reverse().filter((h) => h.rank != null) as { rank: number; checkedAt: Date }[];
  const maxRank = Math.max(10, ...points.map((p) => p.rank));
  const w = 560, hgt = 140, pad = 8;
  const path = points
    .map((p, i) => {
      const x = points.length > 1 ? pad + (i * (w - 2 * pad)) / (points.length - 1) : w / 2;
      const y = pad + ((p.rank - 1) / (maxRank - 1 || 1)) * (hgt - 2 * pad); // rank 1 at top
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/rank/rankings" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Rankings
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{keyword.keyword}</h1>
        {keyword.groupName && <p className="text-sm text-muted-foreground">Group: {keyword.groupName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Current Rank</p><p className="mt-1 text-2xl font-bold">{keyword.currentRank ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Previous Rank</p><p className="mt-1 text-2xl font-bold text-muted-foreground">{keyword.previousRank ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Change</p><p className={`mt-1 text-2xl font-bold ${change != null && change > 0 ? "text-emerald-600 dark:text-emerald-400" : change != null && change < 0 ? "text-rose-600 dark:text-rose-400" : ""}`}>{change == null ? "—" : change > 0 ? `↑ ${change}` : change < 0 ? `↓ ${Math.abs(change)}` : "0"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Status</p><div className="mt-1"><Badge variant="secondary">{rankBucket(keyword.currentRank)}</Badge>{keyword.lastStatus && <p className="mt-1 text-xs text-muted-foreground">{keyword.lastStatus}</p>}</div></CardContent></Card>
      </div>

      {keyword.rankingUrl && (
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Ranking URL</p>
          <a href={keyword.rankingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            {keyword.rankingUrl} <ExternalLink className="size-3.5" />
          </a>
          {keyword.targetUrl && !keyword.rankingUrl.includes(keyword.targetUrl) && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3.5" /> Ranking URL differs from target URL ({keyword.targetUrl}).
            </p>
          )}
        </CardContent></Card>
      )}

      {points.length > 1 && (
        <Card><CardContent className="p-5">
          <h2 className="text-sm font-semibold">Ranking trend</h2>
          <p className="mt-1 text-xs text-muted-foreground">Lower is better — the line rising toward the top means improving rank.</p>
          <div className="mt-3 overflow-x-auto">
            <svg viewBox={`0 0 ${w} ${hgt}`} className="w-full" style={{ maxWidth: w }}>
              <path d={path} fill="none" stroke="currentColor" strokeWidth={2} className="text-primary" />
              {points.map((p, i) => {
                const x = points.length > 1 ? pad + (i * (w - 2 * pad)) / (points.length - 1) : w / 2;
                const y = pad + ((p.rank - 1) / (maxRank - 1 || 1)) * (hgt - 2 * pad);
                return <circle key={i} cx={x} cy={y} r={2.5} className="fill-primary" />;
              })}
            </svg>
          </div>
        </CardContent></Card>
      )}

      {distinctUrls.length > 1 && (
        <Card><CardContent className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-4" /> Possible keyword cannibalization
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">This keyword has ranked with multiple URLs over time:</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {distinctUrls.map(([url, count]) => (
              <li key={url} className="flex items-center justify-between gap-2">
                <span className="truncate text-muted-foreground">{url.replace(/^https?:\/\//, "")}</span>
                <span className="shrink-0 text-xs">ranked {count}×</span>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Checked</th><th className="p-3 font-medium">Rank</th><th className="p-3 font-medium">URL</th><th className="p-3 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No history yet — run a check.</td></tr>
              ) : history.map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="p-3 text-xs text-muted-foreground">{new Date(h.checkedAt).toLocaleString()}</td>
                  <td className="p-3 font-semibold tabular-nums">{h.rank ?? (h.status === "ERROR" ? "err" : "—")}</td>
                  <td className="p-3 max-w-[280px] truncate text-muted-foreground">{h.rankingUrl?.replace(/^https?:\/\//, "") ?? "—"}</td>
                  <td className="p-3"><Badge variant="secondary">{h.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  );
}
