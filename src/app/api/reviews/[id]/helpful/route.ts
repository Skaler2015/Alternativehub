import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { recomputeUserReputation } from "@/lib/community";
import { notify } from "@/lib/notifications";

type Params = Promise<{ id: string }>;

/** Toggle a "helpful" vote on a review. Recomputes the author's reputation. */
export async function POST(_req: Request, { params }: { params: Params }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(`helpful:${user.id}`, 40, 60);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, userId: true, tool: { select: { name: true, slug: true } } },
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.userId === user.id) {
    return NextResponse.json({ error: "You can't vote on your own review" }, { status: 400 });
  }

  const existing = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId: id, userId: user.id } },
  });

  let voted: boolean;
  if (existing) {
    await prisma.reviewVote.delete({ where: { reviewId_userId: { reviewId: id, userId: user.id } } });
    voted = false;
  } else {
    await prisma.reviewVote.create({ data: { reviewId: id, userId: user.id, type: "UP" } });
    voted = true;
  }

  // Recount helpful from votes (source of truth)
  const helpful = await prisma.reviewVote.count({ where: { reviewId: id, type: "UP" } });
  await prisma.review.update({ where: { id }, data: { helpful } });
  await recomputeUserReputation(review.userId).catch(() => {});

  // Notify the author on helpful-vote milestones (avoids per-vote spam).
  if (voted && [1, 5, 10, 25, 50, 100].includes(helpful)) {
    void notify({
      userId: review.userId,
      type: "REVIEW_VOTE",
      title: helpful === 1 ? "Someone found your review helpful 👍" : `Your review reached ${helpful} helpful votes 🎉`,
      body: `Your review of ${review.tool.name} is helping others decide.`,
      link: `/tools/${review.tool.slug}#reviews`,
    });
  }

  return NextResponse.json({ ok: true, voted, helpful });
}
