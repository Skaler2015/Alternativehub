import Link from "next/link";
import { Quote } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import { RatingStars } from "@/components/tools/rating-stars";
import { ToolLogo } from "@/components/tools/tool-logo";
import { getT } from "@/lib/i18n/server";
import { getInitials, truncate } from "@/lib/utils";
import type { Testimonial } from "@/lib/data/queries";

export async function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  const { t: tr } = await getT();

  return (
    <FadeIn>
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{tr("testimonials.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("testimonials.sub")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-2xl border bg-card p-5 transition-shadow hover:soft-shadow"
            >
              <Quote className="size-5 text-primary/40" />
              <blockquote className="mt-2 flex-1 text-sm text-muted-foreground">
                {t.title && <span className="mb-1 block font-medium text-foreground">{t.title}</span>}
                {truncate(t.body, 180)}
              </blockquote>
              <RatingStars rating={t.rating} className="mt-3" />
              <figcaption className="mt-4 flex items-center gap-3 border-t pt-4">
                <Avatar className="size-8">
                  <AvatarImage src={t.user.image ?? undefined} />
                  <AvatarFallback>{getInitials(t.user.name ?? "A")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.user.name ?? tr("testimonials.anonymous")}</p>
                  <p className="text-xs text-muted-foreground">{tr("testimonials.reviewedTool")}</p>
                </div>
                <Link
                  href={`/tools/${t.tool.slug}`}
                  className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ToolLogo name={t.tool.name} logoUrl={t.tool.logoUrl} size={20} />
                  {truncate(t.tool.name, 14)}
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </FadeIn>
  );
}
