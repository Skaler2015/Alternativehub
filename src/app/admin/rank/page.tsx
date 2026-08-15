import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileUp,
  Gauge,
  KeyRound,
  Lightbulb,
  ListChecks,
  Minus,
  ScrollText,
  Search,
  Settings,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dailyChecksSeries, dashboardStats, getOrCreateProject, rankingDistribution } from "@/lib/rank/data";
import { getRankProvider } from "@/lib/rank/providers";
import { CheckAllPanel } from "@/components/admin/rank/check-all";
import { MiniBarChart } from "@/components/admin/mini-bar-chart";

export const dynamic = "force-dynamic";

export default async function RankDashboard() {
  const project = await getOrCreateProject();
  const [stats, provider, distribution, dailyChecks] = await Promise.all([
    dashboardStats(project.id, project.timezone),
    getRankProvider(),
    rankingDistribution(project.id),
    dailyChecksSeries(14),
  ]);
  const distMax = Math.max(1, ...distribution.map((d) => d.value));

  const rankCards = [
    { label: "Total Keywords", value: stats.total, tone: "neutral", href: "/admin/rank/rankings" },
    { label: "Top 3", value: stats.top3, tone: "excellent", href: "/admin/rank/rankings?filter=top3" },
    { label: "Top 10", value: stats.top10, tone: "good", href: "/admin/rank/rankings?filter=top10" },
    { label: "Top 20", value: stats.top20, tone: "medium", href: "/admin/rank/rankings?filter=top20" },
    { label: "Top 50", value: stats.top50, tone: "warning", href: "/admin/rank/rankings?filter=top50" },
    { label: "Top 100", value: stats.top100, tone: "low", href: "/admin/rank/rankings?filter=top100" },
    { label: "Not Ranking", value: stats.notRanking, tone: "neutral", href: "/admin/rank/rankings?filter=notranking" },
  ];
  const moveCards = [
    { label: "Improved", value: stats.improved, icon: ArrowUpRight, cls: "text-emerald-600 dark:text-emerald-400", href: "/admin/rank/rankings?filter=improved" },
    { label: "Dropped", value: stats.dropped, icon: ArrowDownRight, cls: "text-rose-600 dark:text-rose-400", href: "/admin/rank/rankings?filter=dropped" },
    { label: "No Change", value: stats.noChange, icon: Minus, cls: "text-muted-foreground", href: "/admin/rank/rankings?filter=nochange" },
  ];

  const toneCls: Record<string, string> = {
    excellent: "text-emerald-600 dark:text-emerald-400",
    good: "text-sky-600 dark:text-sky-400",
    medium: "text-indigo-600 dark:text-indigo-400",
    warning: "text-amber-600 dark:text-amber-400",
    low: "text-orange-600 dark:text-orange-400",
    neutral: "text-foreground",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rank Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.name} · <span className="font-medium">{project.domain}</span> · {project.country.toUpperCase()} ·{" "}
            {project.device === "MOBILE" ? "Mobile" : "Desktop"} · depth {project.rankDepth}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/rank/keywords"><ListChecks className="size-4" /> Keywords</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/rank/rankings"><Search className="size-4" /> Rankings</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/rank/insights"><Lightbulb className="size-4" /> Insights</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/rank/import"><FileUp className="size-4" /> Import</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/rank/logs"><ScrollText className="size-4" /> Logs</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/rank/settings"><Settings className="size-4" /> Settings</Link>
          </Button>
        </div>
      </div>

      {!provider && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-300">Ranking provider is not configured.</p>
            <p className="mt-1 text-muted-foreground">
              Add a SERP provider (SerpApi or DataForSEO) API key in{" "}
              <Link href="/admin/rank/settings" className="font-medium text-primary hover:underline">Settings</Link>{" "}
              to run real rank checks. Until then, no rankings can be fetched — the tool will never show fabricated numbers.
            </p>
          </div>
        </div>
      )}

      {/* Rank distribution cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {rankCards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`mt-1 text-2xl font-bold ${toneCls[c.tone]}`}>{c.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Movement cards */}
      <div className="grid grid-cols-3 gap-3">
        {moveCards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value.toLocaleString()}</p>
                </div>
                <c.icon className={`size-6 ${c.cls}`} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Ranking distribution</h2>
              <a href="/api/admin/rank/export?scope=history" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <Download className="size-3.5" /> Backup history
              </a>
            </div>
            <div className="mt-4 space-y-2">
              {distribution.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">{d.label}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500/70 to-violet-500" style={{ width: `${Math.round((d.value / distMax) * 100)}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold">Daily rank checks (14 days)</h2>
            <div className="mt-4">
              <MiniBarChart data={dailyChecks} height={160} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run checks + API usage */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="size-4 text-primary" /> Run rank checks</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Checks run as background jobs in safe batches. Start them here, then keep this tab open to watch progress.
            </p>
            <div className="mt-4">
              <CheckAllPanel providerConfigured={!!provider} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Gauge className="size-4 text-primary" /> API usage today</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Requests</dt><dd className="font-semibold">{stats.apiToday.requests}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Successful</dt><dd className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.apiToday.success}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Failed</dt><dd className="font-semibold text-rose-600 dark:text-rose-400">{stats.apiToday.failed}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">In queue</dt><dd className="font-semibold">{stats.pendingJobs}</dd></div>
            </dl>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <KeyRound className="size-3.5" />
              Provider: <span className="font-medium text-foreground">{provider ? provider.name : "not configured"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
