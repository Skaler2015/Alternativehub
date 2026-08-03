import { prisma } from "@/lib/prisma";

/**
 * Community reputation & badges.
 *
 * Reputation is a simple, transparent score derived from a user's real
 * contributions. Badges are computed deterministically from the same stats —
 * no separate tables to maintain.
 */

export type UserStats = {
  reviews: number;
  submissions: number;
  helpfulReceived: number;
  bookmarks: number;
  joinedAt: Date;
};

export function computeReputation(s: Pick<UserStats, "reviews" | "submissions" | "helpfulReceived">): number {
  return s.reviews * 10 + s.submissions * 15 + s.helpfulReceived * 2;
}

export type Badge = {
  key: string;
  label: string;
  icon: string; // lucide icon name
  description: string;
};

// ── Levels / tiers ──────────────────────────────────────────────────────

export type Level = {
  tier: number;
  name: string;
  color: string; // tailwind text color class
  min: number;
  next: number | null; // reputation for the next tier, null at max
  progress: number; // 0-100 towards next tier
};

const LEVEL_TABLE: { name: string; color: string; min: number }[] = [
  { name: "Bronze", color: "text-amber-700 dark:text-amber-500", min: 0 },
  { name: "Silver", color: "text-slate-400", min: 100 },
  { name: "Gold", color: "text-amber-400", min: 300 },
  { name: "Platinum", color: "text-cyan-300", min: 700 },
  { name: "Diamond", color: "text-sky-400", min: 1500 },
];

/** Map a reputation score to a level tier with progress toward the next one. */
export function computeLevel(reputation: number): Level {
  let idx = 0;
  for (let i = 0; i < LEVEL_TABLE.length; i++) {
    if (reputation >= LEVEL_TABLE[i].min) idx = i;
  }
  const cur = LEVEL_TABLE[idx];
  const nextTier = LEVEL_TABLE[idx + 1] ?? null;
  const next = nextTier ? nextTier.min : null;
  const progress = next ? Math.min(100, Math.round(((reputation - cur.min) / (next - cur.min)) * 100)) : 100;
  return { tier: idx, name: cur.name, color: cur.color, min: cur.min, next, progress };
}

// ── Achievements (earned + locked) ──────────────────────────────────────

export type Achievement = Badge & { earned: boolean };

type AchievementDef = Badge & { test: (s: UserStats, reputation: number) => boolean };

const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first-review", label: "First Review", icon: "PenLine", description: "Write your first review", test: (s) => s.reviews >= 1 },
  { key: "reviewer", label: "Reviewer", icon: "Star", description: "Write 5+ reviews", test: (s) => s.reviews >= 5 },
  { key: "top-reviewer", label: "Top Reviewer", icon: "Award", description: "Write 10+ reviews", test: (s) => s.reviews >= 10 },
  { key: "scout", label: "Tool Scout", icon: "Compass", description: "Submit a published tool", test: (s) => s.submissions >= 1 },
  { key: "curator", label: "Curator", icon: "Library", description: "Submit 5+ published tools", test: (s) => s.submissions >= 5 },
  { key: "helpful", label: "Helpful", icon: "ThumbsUp", description: "Get 10+ helpful votes", test: (s) => s.helpfulReceived >= 10 },
  { key: "influencer", label: "Influencer", icon: "Flame", description: "Get 50+ helpful votes", test: (s) => s.helpfulReceived >= 50 },
  { key: "trusted", label: "Trusted", icon: "ShieldCheck", description: "Earn 100+ reputation", test: (_s, r) => r >= 100 },
  { key: "legend", label: "Legend", icon: "Crown", description: "Earn 500+ reputation", test: (_s, r) => r >= 500 },
  { key: "diamond", label: "Diamond", icon: "Gem", description: "Earn 1500+ reputation", test: (_s, r) => r >= 1500 },
  { key: "veteran", label: "Veteran", icon: "Medal", description: "Member for over a year", test: (s) => (Date.now() - new Date(s.joinedAt).getTime()) / 86_400_000 >= 365 },
];

/** Earned badges only (kept for existing callers). */
export function computeBadges(s: UserStats, reputation: number): Badge[] {
  return ACHIEVEMENTS.filter((a) => a.test(s, reputation)).map(({ test: _t, ...b }) => b);
}

/** Full achievement catalog with earned/locked state. */
export function computeAchievements(s: UserStats, reputation: number): Achievement[] {
  return ACHIEVEMENTS.map(({ test, ...b }) => ({ ...b, earned: test(s, reputation) }));
}

/** Gather a user's contribution stats. */
export async function getUserStats(userId: string): Promise<UserStats> {
  const [reviews, submissions, helpful, bookmarks, user] = await Promise.all([
    prisma.review.count({ where: { userId, approved: true } }),
    prisma.tool.count({ where: { submittedById: userId, status: "PUBLISHED", deletedAt: null } }),
    prisma.review.aggregate({ where: { userId, approved: true }, _sum: { helpful: true } }),
    prisma.bookmark.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
  ]);
  return {
    reviews,
    submissions,
    helpfulReceived: helpful._sum.helpful ?? 0,
    bookmarks,
    joinedAt: user?.createdAt ?? new Date(),
  };
}

// ── Time-windowed leaderboard (weekly / monthly) ────────────────────────

export type LeaderRow = {
  id: string;
  name: string | null;
  image: string | null;
  reputation: number;
  score: number;
  reviews: number;
  submissions: number;
};

/**
 * Rank contributors by activity within a recent window. Score mirrors the
 * reputation formula (reviews*10 + submissions*15) but only counts items
 * created in the window, so weekly/monthly boards reward current activity.
 */
export async function getPeriodLeaderboard(period: "week" | "month", take = 50): Promise<LeaderRow[]> {
  const days = period === "week" ? 7 : 30;
  const since = new Date(Date.now() - days * 86_400_000);

  const [reviewRows, toolRows] = await Promise.all([
    prisma.review.groupBy({ by: ["userId"], where: { approved: true, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.tool.groupBy({ by: ["submittedById"], where: { status: "PUBLISHED", deletedAt: null, createdAt: { gte: since } }, _count: { _all: true } }),
  ]);

  const map = new Map<string, { reviews: number; submissions: number }>();
  for (const r of reviewRows) {
    map.set(r.userId, { reviews: r._count._all, submissions: 0 });
  }
  for (const t of toolRows) {
    if (!t.submittedById) continue;
    const cur = map.get(t.submittedById) ?? { reviews: 0, submissions: 0 };
    cur.submissions = t._count._all;
    map.set(t.submittedById, cur);
  }

  const scored = [...map.entries()]
    .map(([id, v]) => ({ id, ...v, score: v.reviews * 10 + v.submissions * 15 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, take);

  if (scored.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: scored.map((s) => s.id) }, isBanned: false },
    select: { id: true, name: true, image: true, reputation: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return scored
    .map((s) => {
      const u = byId.get(s.id);
      if (!u) return null;
      return { id: u.id, name: u.name, image: u.image, reputation: u.reputation, score: s.score, reviews: s.reviews, submissions: s.submissions };
    })
    .filter((x): x is LeaderRow => x !== null);
}

/** Recompute and persist a single user's reputation. */
export async function recomputeUserReputation(userId: string): Promise<number> {
  const stats = await getUserStats(userId);
  const reputation = computeReputation(stats);
  await prisma.user.update({ where: { id: userId }, data: { reputation } }).catch(() => {});
  return reputation;
}

/** Recompute reputation for all users (used by the daily cron). */
export async function recomputeAllReputations(): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) await recomputeUserReputation(u.id).catch(() => {});
  return users.length;
}
