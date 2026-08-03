import Link from "next/link";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";
import { computeLevel, getPeriodLeaderboard, type LeaderRow } from "@/lib/community";
import { cn, getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Community Leaderboard — Top Contributors",
  description:
    "Meet the top contributors on AlternativeHub — the reviewers and tool scouts helping everyone discover better software.",
  path: "/leaderboard",
});

const MEDALS = ["🥇", "🥈", "🥉"];
const PERIODS = [
  { key: "all", label: "All-time" },
  { key: "month", label: "This month" },
  { key: "week", label: "This week" },
] as const;

type Period = (typeof PERIODS)[number]["key"];

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { t } = await getT();
  const { period: periodParam } = await searchParams;
  const period: Period = (["all", "month", "week"] as const).includes(periodParam as Period) ? (periodParam as Period) : "all";

  let rows: LeaderRow[] = [];
  if (period === "all") {
    const users = await prisma.user
      .findMany({
        where: { isBanned: false, reputation: { gt: 0 } },
        orderBy: { reputation: "desc" },
        take: 50,
        select: { id: true, name: true, image: true, reputation: true, _count: { select: { reviews: true, submittedTools: true } } },
      })
      .catch(() => []);
    rows = users.map((u) => ({
      id: u.id, name: u.name, image: u.image, reputation: u.reputation, score: u.reputation,
      reviews: u._count.reviews, submissions: u._count.submittedTools,
    }));
  } else {
    rows = await getPeriodLeaderboard(period).catch(() => []);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: t("nav.leaderboard"), path: "/leaderboard" }]} />

      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-500">
          <Trophy className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("leaderboard.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("leaderboard.sub")}</p>
        </div>
      </div>

      {/* Period tabs */}
      <div className="mt-6 inline-flex rounded-lg border p-1">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={p.key === "all" ? "/leaderboard" : `/leaderboard?period=${p.key}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              period === p.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {period === "all" ? t("leaderboard.empty") : "No activity in this period yet — be the first!"}
        </p>
      ) : (
        <div className="mt-6 divide-y rounded-2xl border bg-card">
          {rows.map((u, i) => {
            const level = computeLevel(u.reputation);
            return (
              <Link key={u.id} href={`/u/${u.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-accent">
                <span className="w-7 shrink-0 text-center text-lg font-bold">
                  {i < 3 ? MEDALS[i] : <span className="text-sm text-muted-foreground">{i + 1}</span>}
                </span>
                <Avatar>
                  <AvatarImage src={u.image ?? undefined} />
                  <AvatarFallback>{getInitials(u.name ?? "A")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {u.name ?? "Anonymous"}
                    <span className={cn("text-[11px] font-semibold", level.color)}>· {level.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.reviews} {t("leaderboard.reviews")} · {u.submissions} {t("leaderboard.submissions")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {period === "all" ? `${u.reputation} ${t("leaderboard.points")}` : `+${u.score}`}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
