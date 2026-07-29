"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { RatingStars } from "@/components/tools/rating-stars";
import { useT } from "@/components/i18n/i18n-provider";
import { cn, getInitials, timeAgo } from "@/lib/utils";

type ReviewData = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  helpful: number;
  createdAt: string | Date;
  user: { id?: string; name: string | null; image: string | null };
};

export function ReviewSection({
  slug,
  reviews,
  currentUserId,
}: {
  slug: string;
  reviews: ReviewData[];
  currentUserId?: string | null;
}) {
  const { status } = useSession();
  const { t } = useT();
  const router = useRouter();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [helpfulState, setHelpfulState] = React.useState<
    Record<string, { count: number; voted: boolean }>
  >({});

  const voteHelpful = async (reviewId: string, current: number) => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    // optimistic
    const prev = helpfulState[reviewId] ?? { count: current, voted: false };
    setHelpfulState((s) => ({
      ...s,
      [reviewId]: { count: prev.count + (prev.voted ? -1 : 1), voted: !prev.voted },
    }));
    const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data) setHelpfulState((s) => ({ ...s, [reviewId]: { count: data.helpful, voted: data.voted } }));
    } else {
      setHelpfulState((s) => ({ ...s, [reviewId]: prev })); // revert
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not register your vote");
    }
  };

  const submit = async () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    if (rating === 0) {
      toast.error(t("reviews.pickRating"));
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
      toast.success(t("reviews.published"));
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
        <h2 className="text-xl font-semibold">{t("reviews.title")} ({reviews.length})</h2>
        {!formOpen && (
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            {t("reviews.write")}
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
            placeholder={t("reviews.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <Textarea
            placeholder={t("reviews.bodyPlaceholder")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting || body.length < 20}>
              {submitting ? t("reviews.publishing") : t("reviews.publish")}
            </Button>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              {t("reviews.cancel")}
            </Button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("reviews.empty")}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const hs = helpfulState[review.id] ?? { count: review.helpful, voted: false };
            const isOwn = !!currentUserId && review.user.id === currentUserId;
            const displayName = review.user.name ?? "Anonymous";
            return (
              <article key={review.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review.user.image ?? undefined} />
                    <AvatarFallback>{getInitials(review.user.name ?? "A")}</AvatarFallback>
                  </Avatar>
                  <div>
                    {review.user.id ? (
                      <Link
                        href={`/u/${review.user.id}`}
                        className="text-sm font-medium transition-colors hover:text-primary"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{displayName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</p>
                  </div>
                  <RatingStars rating={review.rating} className="ml-auto" />
                </div>
                {review.title && <h3 className="mt-3 font-medium">{review.title}</h3>}
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{review.body}</p>
                {!isOwn && (
                  <button
                    type="button"
                    onClick={() => voteHelpful(review.id, review.helpful)}
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                      hs.voted
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "text-muted-foreground hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    <ThumbsUp className={cn("size-3.5", hs.voted && "fill-current")} />
                    {t("reviews.helpful")}{hs.count > 0 ? ` · ${hs.count}` : ""}
                  </button>
                )}
                {isOwn && hs.count > 0 && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ThumbsUp className="size-3.5" /> {hs.count} {t("reviews.foundHelpful")}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
