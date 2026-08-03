import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Globe } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/tools/rating-stars";
import { FollowButton } from "@/components/social/follow-button";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeAchievements, computeLevel, getUserStats } from "@/lib/community";
import { buildMetadata } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";
import { formatDate, getInitials, timeAgo, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } }).catch(() => null);
  if (!user) return { title: "Profile not found" };
  return buildMetadata({
    title: `${user.name ?? "Contributor"} — Profile`,
    description: `${user.name ?? "A contributor"} on AlternativeHub: reviews, submitted tools, badges and reputation.`,
    path: `/u/${id}`,
    noIndex: true,
  });
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await prisma.user
    .findUnique({
      where: { id },
      select: { id: true, name: true, image: true, bio: true, website: true, reputation: true, role: true, createdAt: true, isBanned: true },
    })
    .catch(() => null);

  if (!user || user.isBanned) notFound();

  const { t } = await getT();
  const session = await auth();
  const [stats, reviews, submissions, collections, followerCount, followingCount, isFollowing] = await Promise.all([
    getUserStats(user.id),
    prisma.review.findMany({
      where: { userId: user.id, approved: true },
      orderBy: [{ helpful: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: { id: true, rating: true, title: true, body: true, helpful: true, createdAt: true, tool: { select: { name: true, slug: true, logoUrl: true } } },
    }),
    prisma.tool.findMany({
      where: { submittedById: user.id, status: "PUBLISHED", deletedAt: null },
      orderBy: { popularityScore: "desc" },
      take: 8,
      select: { name: true, slug: true },
    }),
    prisma.collection.findMany({
      where: { userId: user.id, isPublic: true, items: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, _count: { select: { items: true } } },
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    session?.user
      ? prisma.follow
          .findUnique({ where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } }, select: { followerId: true } })
          .then((f) => !!f)
          .catch(() => false)
      : Promise.resolve(false),
  ]);

  const achievements = computeAchievements(stats, user.reputation);
  const level = computeLevel(user.reputation);
  const isSelf = session?.user?.id === user.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: t("nav.leaderboard"), path: "/leaderboard" },
          { name: user.name ?? "Profile", path: `/u/${user.id}` },
        ]}
      />

      {/* Header */}
      <header className="mt-6 flex flex-col items-center gap-4 rounded-3xl border bg-card p-8 text-center sm:flex-row sm:text-left">
        <Avatar className="size-20 border">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback className="text-xl">{getInitials(user.name ?? "A")}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold tracking-tight">{user.name ?? "Anonymous"}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${level.color}`}>
              <Icons.Gem className="size-3" /> {level.name}
            </span>
            {user.role !== "USER" && <Badge variant="gradient">{user.role.toLowerCase()}</Badge>}
          </div>
          {user.bio && <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:justify-start">
            <span className="font-semibold text-primary">{user.reputation} {t("profile.reputation")}</span>
            <span><b className="text-foreground">{followerCount}</b> {t("profile.followers")}</span>
            <span><b className="text-foreground">{followingCount}</b> {t("profile.following")}</span>
            <span>{t("profile.joined")} {formatDate(user.createdAt)}</span>
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 hover:text-foreground">
                <Globe className="size-3" /> {t("profile.website")}
              </a>
            )}
          </div>
          {level.next !== null && (
            <div className="mt-3 max-w-xs">
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{level.name}</span>
                <span>{level.next - user.reputation} to next level</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${level.progress}%` }} />
              </div>
            </div>
          )}
        </div>
        {!isSelf && (
          <div className="shrink-0">
            <FollowButton userId={user.id} initialFollowing={isFollowing} initialFollowers={followerCount} />
          </div>
        )}
      </header>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: t("profile.reviews"), value: stats.reviews },
          { label: t("profile.submissions"), value: stats.submissions },
          { label: t("profile.helpfulVotes"), value: stats.helpfulReceived },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements (earned + locked) */}
      <section className="mt-8">
        <h2 className="mb-3 font-semibold">
          {t("profile.badges")}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {achievements.filter((a) => a.earned).length}/{achievements.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {achievements.map((b) => {
            const Icon = ((Icons as unknown as Record<string, LucideIcon>)[b.icon]) || Icons.Award;
            return (
              <div
                key={b.key}
                className={`flex items-center gap-2.5 rounded-2xl border p-3 ${b.earned ? "bg-card" : "bg-muted/30 opacity-55 grayscale"}`}
                title={b.description}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${b.earned ? "bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.label}</p>
                  <p className="text-[11px] text-muted-foreground">{b.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Submissions */}
      {submissions.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">{t("profile.submittedTools")}</h2>
          <div className="flex flex-wrap gap-2">
            {submissions.map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary">
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Public collections */}
      {collections.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">{t("profile.collections")}</h2>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.id}`} className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:text-primary">
                {c.name} <span className="text-xs text-muted-foreground">· {c._count.items}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">{t("profile.recentReviews")}</h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <article key={r.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/tools/${r.tool.slug}`} className="font-medium hover:text-primary">
                    {r.tool.name}
                  </Link>
                  <RatingStars rating={r.rating} />
                </div>
                {r.title && <h3 className="mt-2 text-sm font-medium">{r.title}</h3>}
                <p className="mt-1 text-sm text-muted-foreground">{truncate(r.body, 240)}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {timeAgo(r.createdAt)}
                  {r.helpful > 0 && ` · ${r.helpful} found helpful`}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
