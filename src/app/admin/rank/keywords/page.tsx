import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getOrCreateProject } from "@/lib/rank/data";
import { getRankProvider } from "@/lib/rank/providers";
import { rankBucket } from "@/lib/rank/normalize";
import { BulkAddKeywords } from "@/components/admin/rank/bulk-add";
import { KeywordActions } from "@/components/admin/rank/keyword-actions";

export const dynamic = "force-dynamic";

export default async function RankKeywordsPage() {
  const project = await getOrCreateProject();
  const [keywords, total, provider] = await Promise.all([
    prisma.rankKeyword.findMany({ where: { projectId: project.id }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.rankKeyword.count({ where: { projectId: project.id } }),
    getRankProvider(),
  ]);
  const configured = !!provider;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/rank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Rank Tracker
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Keywords</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} keyword(s) tracked</p>
        </div>
        <Button variant="outline" size="sm" asChild><Link href="/admin/rank/rankings">View rankings →</Link></Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold">Bulk add / paste keywords</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            One keyword per line. Duplicates (and keywords already tracked) are skipped automatically.
          </p>
          <div className="mt-4"><BulkAddKeywords /></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Keyword</th>
                  <th className="p-3 font-medium">Group</th>
                  <th className="p-3 font-medium">Rank</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Last checked</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keywords.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No keywords yet — paste some above to get started.</td></tr>
                ) : (
                  keywords.map((k) => (
                    <tr key={k.id} className="border-b last:border-0">
                      <td className="p-3">
                        <Link href={`/admin/rank/keyword/${k.id}`} className="font-medium hover:text-primary">{k.keyword}</Link>
                      </td>
                      <td className="p-3 text-muted-foreground">{k.groupName ?? "—"}</td>
                      <td className="p-3 font-semibold tabular-nums">{k.currentRank ?? "—"}</td>
                      <td className="p-3"><Badge variant="secondary">{rankBucket(k.currentRank)}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {k.lastCheckedAt ? new Date(k.lastCheckedAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="p-3"><KeywordActions id={k.id} configured={configured} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {total > 100 && (
            <p className="border-t p-3 text-center text-xs text-muted-foreground">
              Showing the 100 most recent. Use <Link href="/admin/rank/rankings" className="text-primary hover:underline">Rankings</Link> to search &amp; page through all {total.toLocaleString()}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
