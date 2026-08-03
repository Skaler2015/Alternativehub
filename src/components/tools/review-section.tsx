"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Star, ThumbsUp, BadgeCheck, CornerDownRight } from "lucide-react";
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
  verified?: boolean;
  useCase?: string | null;
  industry?: string | null;
  companySize?: string | null;
  reply?: string | null;
  repliedAt?: string | Date | null;
  repliedBy?: { name: string | null } | null;
  createdAt: string | Date;
  user: { id?: string; name: string | null; image: string | null };
};

const COMPANY_SIZES = ["Self-employed", "1-10", "11-50", "51-200", "201-1000", "1000+"];

export function ReviewSection({
  slug,
  reviews,
  currentUserId,
  isStaff = false,
}: {
  slug: string;
  reviews: ReviewData[];
  currentUserId?: string | null;
  isStaff?: boolean;
}) {
  const { status } = useSession();
  const { t } = useT();
  const router = useRouter();
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [useCase, setUseCase] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [companySize, setCompanySize] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [replyOpen, setReplyOpen] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
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
      body: JSON.stringify({
        rating, title: title || undefined, body,
        useCase: useCase || undefined, industry: industry || undefined, companySize: companySize || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("reviews.published"));
      setFormOpen(false);
      setRating(0); setTitle(""); setBody(""); setUseCase(""); setIndustry(""); setCompanySize("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not publish review");
    }
  };

  const submitReply = async (reviewId: string) => {
    const reply = replyText.trim();
    if (reply.length < 2) return;
    const res = await fetch(`/api/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    if (res.ok) {
      toast.success("Reply posted");
      setReplyOpen(null);
      setReplyText("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not post reply");
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
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="What do you use it for? (optional)" value={useCase} onChange={(e) => setUseCase(e.target.value)} maxLength={120} />
            <Input placeholder="Industry (optional)" value={industry} onChange={(e) => setIndustry(e.target.value)} maxLength={60} />
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <option value="">Company size (optional)</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
                    <div className="flex items-center gap-1.5">
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
                      {review.verified && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400" title="Verified reviewer (signed in with a linked account)">
                          <BadgeCheck className="size-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</p>
                  </div>
                  <RatingStars rating={review.rating} className="ml-auto" />
                </div>
                {review.title && <h3 className="mt-3 font-medium">{review.title}</h3>}
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{review.body}</p>

                {(review.useCase || review.industry || review.companySize) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {review.useCase && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Use: {review.useCase}</span>}
                    {review.industry && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{review.industry}</span>}
                    {review.companySize && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{review.companySize}</span>}
                  </div>
                )}

                {review.reply && (
                  <div className="mt-3 rounded-xl border-l-2 border-primary/40 bg-primary/5 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <CornerDownRight className="size-3.5" /> Response from {review.repliedBy?.name ?? "the team"}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{review.reply}</p>
                  </div>
                )}
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

                {isStaff && !review.reply && (
                  replyOpen === review.id ? (
                    <div className="mt-3 space-y-2">
                      <Textarea placeholder="Write an official response…" value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submitReply(review.id)} disabled={replyText.trim().length < 2}>Post reply</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setReplyOpen(null); setReplyText(""); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setReplyOpen(review.id); setReplyText(""); }}
                      className="mt-3 ml-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                    >
                      <CornerDownRight className="size-3.5" /> Reply
                    </button>
                  )
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
