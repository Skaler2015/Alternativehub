import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ArrowLeft, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ClearLogsButton } from "@/components/admin/rank/clear-logs";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ type?: string }>;

const TYPES = ["API_LIMIT", "API_ERROR", "TIMEOUT", "AUTH_ERROR", "NETWORK_ERROR", "INVALID_KEYWORD", "INFO"];

const TYPE_CLS: Record<string, string> = {
  API_LIMIT: "text-amber-600 dark:text-amber-400",
  API_ERROR: "text-rose-600 dark:text-rose-400",
  TIMEOUT: "text-amber-600 dark:text-amber-400",
  AUTH_ERROR: "text-rose-600 dark:text-rose-400",
  NETWORK_ERROR: "text-rose-600 dark:text-rose-400",
  INFO: "text-sky-600 dark:text-sky-400",
};

export default async function RankLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type } = await searchParams;
  const where: Prisma.RankLogWhereInput = type ? { type } : {};
  const logs = await prisma.rankLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/rank" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Rank Tracker
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">System logs</h1>
          <p className="text-sm text-muted-foreground">Provider errors, rate limits, timeouts and automation events.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/admin/rank/logs?format=csv${type ? `&type=${type}` : ""}`}><Download className="size-4" /> Export</a>
          </Button>
          <ClearLogsButton type={type} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link href="/admin/rank/logs" className={`rounded-full border px-3 py-1 text-xs ${!type ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40"}`}>All</Link>
        {TYPES.map((t) => (
          <Link key={t} href={`/admin/rank/logs?type=${t}`} className={`rounded-full border px-3 py-1 text-xs ${type === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40"}`}>{t}</Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Time</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Message</th>
                  <th className="p-3 font-medium">Keyword</th>
                  <th className="p-3 font-medium">HTTP</th>
                  <th className="p-3 font-medium">Attempt</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No logs.</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 align-top">
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="p-3"><Badge variant="secondary" className={TYPE_CLS[l.type] ?? ""}>{l.type}</Badge></td>
                    <td className="p-3">{l.message}</td>
                    <td className="p-3 text-muted-foreground">{l.keyword ?? "—"}</td>
                    <td className="p-3 tabular-nums text-muted-foreground">{l.httpStatus ?? "—"}</td>
                    <td className="p-3 tabular-nums text-muted-foreground">{l.attempt ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
