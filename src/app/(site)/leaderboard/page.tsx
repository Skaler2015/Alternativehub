import Link from "next/link";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Community Leaderboard — Top Contributors",
  description:
    "Meet the top contributors on AlternativeHub — the reviewers and tool scouts helping everyone discover better software.",
  path: "/leaderboard",
});

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const { t } = await getT();
  const users = await prisma.user
    .findMany({
      where: { isBanned: false, reputation: { gt: 0 } },
      orderBy: { reputation: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        image: true,
        reputation: true,
        role: true,
        _count: { select: { reviews: true, submittedTools: true } },
      },
    })
    .catch(() => []);

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

      {users.length === 0 ? (
        <p className="mt-16 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {t("leaderboard.empty")}
        </p>
      ) : (
        <div className="mt-8 divide-y rounded-2xl border bg-card">
          {users.map((u, i) => (
            <Link
              key={u.id}
              href={`/u/${u.id}`}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-accent"
            >
              <span className="w-7 shrink-0 text-center text-lg font-bold">
                {i < 3 ? MEDALS[i] : <span className="text-sm text-muted-foreground">{i + 1}</span>}
              </span>
              <Avatar>
                <AvatarImage src={u.image ?? undefined} />
                <AvatarFallback>{getInitials(u.name ?? "A")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.name ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">
                  {u._count.reviews} {t("leaderboard.reviews")} · {u._count.submittedTools} {t("leaderboard.submissions")}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {u.reputation} {t("leaderboard.points")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
