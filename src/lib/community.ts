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

export function computeBadges(s: UserStats, reputation: number): Badge[] {
  const badges: Badge[] = [];
  if (s.reviews >= 1) badges.push({ key: "first-review", label: "First Review", icon: "PenLine", description: "Wrote their first review" });
  if (s.reviews >= 5) badges.push({ key: "reviewer", label: "Reviewer", icon: "Star", description: "Wrote 5+ reviews" });
  if (s.reviews >= 10) badges.push({ key: "top-reviewer", label: "Top Reviewer", icon: "Award", description: "Wrote 10+ reviews" });
  if (s.submissions >= 1) badges.push({ key: "scout", label: "Tool Scout", icon: "Compass", description: "Submitted a published tool" });
  if (s.submissions >= 5) badges.push({ key: "curator", label: "Curator", icon: "Library", description: "Submitted 5+ published tools" });
  if (s.helpfulReceived >= 10) badges.push({ key: "helpful", label: "Helpful", icon: "ThumbsUp", description: "Reviews marked helpful 10+ times" });
  if (reputation >= 100) badges.push({ key: "trusted", label: "Trusted", icon: "ShieldCheck", description: "Earned 100+ reputation" });
  if (reputation >= 500) badges.push({ key: "legend", label: "Legend", icon: "Crown", description: "Earned 500+ reputation" });
  const ageDays = (Date.now() - new Date(s.joinedAt).getTime()) / 86_400_000;
  if (ageDays >= 365) badges.push({ key: "veteran", label: "Veteran", icon: "Medal", description: "Member for over a year" });
  return badges;
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
