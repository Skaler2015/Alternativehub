import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Download,
  Globe,
  History,
  Minus,
  Plug,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag as TagIcon,
  Target,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/misc";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolLogo } from "@/components/tools/tool-logo";
import { ToolCard } from "@/components/tools/tool-card";
import { RatingStars } from "@/components/tools/rating-stars";
import { ScoreRing } from "@/components/tools/score-ring";
import { ToolActions } from "@/components/tools/tool-actions";
import { ReviewSection } from "@/components/tools/review-section";
import { ScreenshotGallery } from "@/components/tools/screenshot-gallery";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bumpViewCount } from "@/lib/cache";
import { getSimilarTools, getToolBySlug, getToolReviews } from "@/lib/data/queries";
import { buildMetadata, faqJsonLd, softwareAppJsonLd } from "@/lib/seo";
import { PRICING_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Tool not found" };

  return buildMetadata({
    title: tool.seoTitle ?? `${tool.name} — Reviews, Pricing & Alternatives`,
    description:
      tool.seoDesc ??
      `${tool.name}: ${tool.tagline ?? ""} Compare features, pricing, pros & cons, and discover the best ${tool.name} alternatives.`,
    path: `/tools/${tool.slug}`,
    image: tool.logoUrl ?? undefined,
    keywords: tool.keywords,
  });
}

export default async function ToolPage({ params }: { params: Params }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const session = await auth();
  const [reviews, similar, userState] = await Promise.all([
    getToolReviews(tool.id),
    getSimilarTools(
      tool.id,
      tool.categoryId,
      tool.alternativesFrom.map((a) => a.target.id),
    ),
    session?.user
      ? Promise.all([
          prisma.bookmark.findUnique({
            where: { toolId_userId: { toolId: tool.id, userId: session.user.id } },
          }),
          prisma.vote.findUnique({
            where: { toolId_userId: { toolId: tool.id, userId: session.user.id } },
          }),
          prisma.recentlyViewed
            .upsert({
              where: { userId_toolId: { userId: session.user.id, toolId: tool.id } },
              create: { userId: session.user.id, toolId: tool.id },
              update: { viewedAt: new Date() },
            })
            .catch(() => null),
        ]).catch(() => [null, null, null] as const)
      : Promise.resolve([null, null, null] as const),
  ]);

  void bumpViewCount(tool.id);

  const alternatives = tool.alternativesFrom.map((a) => a.target);
  const outLink = tool.affiliateUrl ?? tool.websiteUrl;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd
        data={[
          softwareAppJsonLd({
            name: tool.name,
            description: tool.aiSummary ?? tool.description,
            slug: tool.slug,
            logoUrl: tool.logoUrl,
            rating: tool.rating,
            reviewCount: tool.reviewCount,
            pricingModel: tool.pricingModel,
            category: tool.category.name,
            websiteUrl: tool.websiteUrl,
          }),
          ...(tool.faqs.length ? [faqJsonLd(tool.faqs)] : []),
        ]}
      />

      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: tool.category.name, path: `/categories/${tool.category.slug}` },
          { name: tool.name, path: `/tools/${tool.slug}` },
        ]}
      />

      {/* ── Header ── */}
      <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <ToolLogo name={tool.name} logoUrl={tool.logoUrl} size={72} className="rounded-2xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
              {tool.verified && (
                <BadgeCheck className="size-5 fill-sky-500 text-white" aria-label="Verified listing" />
              )}
              {tool.tier !== "STANDARD" && (
                <Badge variant="gradient">{tool.tier === "PREMIUM" ? "Premium" : "Sponsored"}</Badge>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">{tool.tagline}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <RatingStars rating={tool.rating} showValue reviewCount={tool.reviewCount} />
              {tool.company && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" /> {tool.company.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" /> {formatNumber(tool.viewCount)} views
              </span>
              <Badge
                variant={
                  tool.pricingModel === "FREE" || tool.pricingModel === "OPEN_SOURCE"
                    ? "success"
                    : "secondary"
                }
              >
                {PRICING_LABELS[tool.pricingModel]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3">
          <div className="flex gap-2">
            <Button variant="gradient" size="lg" asChild>
              <a
                href={outLink}
                target="_blank"
                rel="noopener noreferrer nofollow"
                data-track="click-out"
                data-tool={tool.id}
              >
                <Globe className="size-4" /> Visit Website <ArrowUpRight className="size-4" />
              </a>
            </Button>
            {tool.downloadUrl && (
              <Button variant="outline" size="lg" asChild>
                <a href={tool.downloadUrl} target="_blank" rel="noopener noreferrer nofollow">
                  <Download className="size-4" /> Download
                </a>
              </Button>
            )}
          </div>
          <ToolActions
            slug={tool.slug}
            name={tool.name}
            upvotes={tool.upvotes}
            bookmarked={Boolean(userState[0])}
            voted={userState[1]?.type ?? null}
          />
        </div>
      </header>

      {/* ── Scores ── */}
      <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border bg-card p-6 sm:grid-cols-4">
        <ScoreRing score={tool.alternativeScore} label="Alternative Score" />
        <ScoreRing score={tool.aiScore} label="AI Score" />
        <ScoreRing score={tool.popularityScore} label="Popularity" />
        <ScoreRing score={tool.trustScore} label="Trust Score" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="text-xl font-semibold">About {tool.name}</h2>
            {tool.aiSummary && (
              <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Summary</p>
                <p className="mt-1.5 text-sm leading-relaxed">{tool.aiSummary}</p>
              </div>
            )}
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {tool.description}
            </p>
            {tool.bestFor.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Best for:</span>
                {tool.bestFor.map((persona) => (
                  <Badge key={persona} variant="secondary">{persona}</Badge>
                ))}
              </div>
            )}
          </section>

          {(tool.pros.length > 0 || tool.cons.length > 0) && (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h3 className="mb-3 font-semibold text-emerald-600 dark:text-emerald-400">Pros</h3>
                <ul className="space-y-2">
                  {tool.pros.map((pro) => (
                    <li key={pro} className="flex gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
                <h3 className="mb-3 font-semibold text-rose-600 dark:text-rose-400">Cons</h3>
                <ul className="space-y-2">
                  {tool.cons.map((con) => (
                    <li key={con} className="flex gap-2 text-sm">
                      <X className="mt-0.5 size-4 shrink-0 text-rose-500" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {tool.features.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Key Features</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {tool.features.map((tf) => (
                  <div key={tf.featureId} className="flex items-start gap-2.5 rounded-xl border bg-card p-3.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{tf.feature.name}</p>
                      {tf.detail && <p className="text-xs text-muted-foreground">{tf.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(tool.useCases.length > 0 || tool.industries.length > 0) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {tool.useCases.length > 0 && (
                <div className="rounded-2xl border bg-card p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                    <Target className="size-4 text-primary" /> Use Cases
                  </h2>
                  <ul className="space-y-2">
                    {tool.useCases.map((u) => (
                      <li key={u} className="flex gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {u}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tool.industries.length > 0 && (
                <div className="rounded-2xl border bg-card p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                    <Briefcase className="size-4 text-primary" /> Industries
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.industries.map((i) => (
                      <Badge key={i} variant="secondary">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {tool.integrations.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Plug className="size-5 text-primary" /> Integrations
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {tool.integrations.map((i) => (
                  <span key={i} className="rounded-lg border bg-card px-3 py-1.5 text-sm">{i}</span>
                ))}
              </div>
            </section>
          )}

          <ScreenshotGallery media={tool.media} toolName={tool.name} />

          {tool.pricingPlans.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Pricing Plans</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tool.pricingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-5 ${plan.highlight ? "border-primary/50 bg-primary/5 soft-shadow" : "bg-card"}`}
                  >
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <p className="mt-2 text-2xl font-bold">
                      {Number(plan.price) === 0 ? "Free" : `$${Number(plan.price)}`}
                      {Number(plan.price) > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                      )}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-1.5 text-xs text-muted-foreground">
                          <Minus className="mt-0.5 size-3 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {alternatives.length > 0 && (
            <section id="alternatives">
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-semibold">Best {tool.name} Alternatives</h2>
                <Link href={`/alternatives/${tool.slug}`} className="text-sm font-medium text-primary hover:underline">
                  Full list →
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {alternatives.slice(0, 6).map((alt) => (
                  <ToolCard key={alt.id} tool={alt} />
                ))}
              </div>
            </section>
          )}

          {tool.faqs.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="mt-2">
                {tool.faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {tool.reviewSummary && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="size-3.5" /> What users say
              </p>
              <p className="mt-1.5 text-sm leading-relaxed">{tool.reviewSummary}</p>
            </div>
          )}

          <ReviewSection slug={tool.slug} reviews={reviews} />
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="text-sm font-semibold">Information</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Category</dt>
                <dd>
                  <Link href={`/categories/${tool.category.slug}`} className="font-medium text-primary hover:underline">
                    {tool.category.name}
                  </Link>
                </dd>
              </div>
              {tool.subcategory && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Subcategory</dt>
                  <dd className="font-medium">{tool.subcategory.name}</dd>
                </div>
              )}
              {tool.company && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Developer</dt>
                  <dd className="font-medium text-right">{tool.company.name}</dd>
                </div>
              )}
              {tool.launchYear && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Launched</dt>
                  <dd className="font-medium">{tool.launchYear}</dd>
                </div>
              )}
              {tool.company?.founder && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Founder</dt>
                  <dd className="font-medium text-right">{tool.company.founder}</dd>
                </div>
              )}
              {tool.company?.employees && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Team size</dt>
                  <dd className="font-medium text-right">{tool.company.employees}</dd>
                </div>
              )}
              {tool.company?.funding && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Funding</dt>
                  <dd className="font-medium text-right">{tool.company.funding}</dd>
                </div>
              )}
              {tool.company?.country && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">HQ</dt>
                  <dd className="font-medium">{tool.company.country}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Pricing</dt>
                <dd className="font-medium">{PRICING_LABELS[tool.pricingModel]}</dd>
              </div>
              {tool.isOpenSource && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">License</dt>
                  <dd className="font-medium text-emerald-600 dark:text-emerald-400">Open Source</dd>
                </div>
              )}
            </dl>
            <Separator className="my-4" />
            {tool.platforms.length > 0 && (
              <>
                <h3 className="text-sm font-semibold">Platforms</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tool.platforms.map((tp) => (
                    <Badge key={tp.platformId} variant="outline">{tp.platform.name}</Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Security & Capabilities */}
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <ShieldCheck className="size-3.5" /> Security & Capabilities
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { label: "API available", on: tool.apiAvailable },
                { label: "Free trial", on: tool.hasFreeTrial },
                { label: "GDPR compliant", on: tool.gdpr },
                { label: "SOC 2", on: tool.soc2 },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{row.label}</span>
                  {row.on ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <Minus className="size-4 text-muted-foreground/50" />
                  )}
                </li>
              ))}
            </ul>
          </div>

          {(tool.docsUrl || tool.changelogUrl || tool.downloadUrl) && (
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <BookOpen className="size-3.5" /> Resources
              </h3>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                {tool.docsUrl && (
                  <a href={tool.docsUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <BookOpen className="size-3.5" /> Documentation <ArrowUpRight className="size-3" />
                  </a>
                )}
                {tool.changelogUrl && (
                  <a href={tool.changelogUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <History className="size-3.5" /> Changelog <ArrowUpRight className="size-3" />
                  </a>
                )}
                {tool.downloadUrl && (
                  <a href={tool.downloadUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Download className="size-3.5" /> Download <ArrowUpRight className="size-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {alternatives.length > 0 && (
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/compare/${[tool.slug, alternatives[0].slug].sort().join("-vs-")}`}>
                <Scale className="size-4" /> Compare with {alternatives[0].name}
              </Link>
            </Button>
          )}

          {tool.tags.length > 0 && (
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <TagIcon className="size-3.5" /> Tags
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tool.tags.map((tt) => (
                  <Link
                    key={tt.tagId}
                    href={`/search?q=${encodeURIComponent(tt.tag.name)}`}
                    className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    #{tt.tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {similar.length > 0 && (
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="text-sm font-semibold">Similar Tools</h3>
              <div className="mt-3 space-y-3">
                {similar.map((s) => (
                  <Link key={s.id} href={`/tools/${s.slug}`} className="group flex items-center gap-3">
                    <ToolLogo name={s.name} logoUrl={s.logoUrl} size={32} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                        {s.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{s.tagline}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
