import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { RatingStars } from "@/components/tools/rating-stars";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const user = await requireUser();
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { tool: { select: { name: true, slug: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">My Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">{reviews.length} reviews written</p>

      {reviews.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          You haven&apos;t reviewed anything yet.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/tools/${review.tool.slug}`}
                  className="font-semibold hover:text-primary"
                >
                  {review.tool.name}
                </Link>
                <RatingStars rating={review.rating} />
              </div>
              {review.title && <h2 className="mt-2 text-sm font-medium">{review.title}</h2>}
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{review.body}</p>
              <p className="mt-3 text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
