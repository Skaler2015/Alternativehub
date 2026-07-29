import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RatingStars } from "@/components/tools/rating-stars";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      tool: { select: { name: true, slug: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">Latest 50 reviews</p>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/tools/${review.tool.slug}`} className="font-medium hover:text-primary">
                {review.tool.name}
              </Link>
              <RatingStars rating={review.rating} />
              <span className="text-xs text-muted-foreground">
                by {review.user.name ?? review.user.email} · {timeAgo(review.createdAt)}
              </span>
              {!review.approved && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                  hidden
                </span>
              )}
              <div className="ml-auto">
                <ReviewModerationActions reviewId={review.id} approved={review.approved} />
              </div>
            </div>
            {review.title && <h2 className="mt-2 text-sm font-medium">{review.title}</h2>}
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{review.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
