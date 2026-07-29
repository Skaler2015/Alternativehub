"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { RatingStars } from "@/components/tools/rating-stars";
import { cn, getInitials, timeAgo } from "@/lib/utils";

type ReviewData = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  helpful: number;
  createdAt: string | Date;
  user: { name: string | null; image: string | null };
};

export function ReviewSection({ slug, reviews }: { slug: string; reviews: ReviewData[] }) {
  const { status } = useSession();
  const router = useRouter();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);

  const submit = async () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    if (rating === 0) {
      toast.error("Pick a star rating");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/tools/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title: title || undefined, body }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Review published");
      setFormOpen(false);
      setRating(0);
      setTitle("");
      setBody("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not publish review");
    }
  };

  return (
    <section id="reviews" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Reviews ({reviews.length})</h2>
        {!formOpen && (
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            Write a review
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i} stars`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
              >
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    i <= (hover || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted",
                  )}
                />
              </button>
            ))}
          </div>
          <Input
            placeholder="Review title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <Textarea
            placeholder="What do you like or dislike? How does it compare to alternatives? (min. 20 characters)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting || body.length < 20}>
              {submitting ? "Publishing..." : "Publish review"}
            </Button>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={review.user.image ?? undefined} />
                  <AvatarFallback>{getInitials(review.user.name ?? "A")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{review.user.name ?? "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</p>
                </div>
                <RatingStars rating={review.rating} className="ml-auto" />
              </div>
              {review.title && <h3 className="mt-3 font-medium">{review.title}</h3>}
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{review.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
