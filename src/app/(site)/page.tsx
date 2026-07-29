import Link from "next/link";
import { ArrowRight, Bot, Flame, Rocket, Scale, Sparkles, Star, TrendingUp } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { ToolSection } from "@/components/home/tool-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { FadeIn } from "@/components/motion/fade-in";
import { getCategories, getHomeData } from "@/lib/data/queries";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [data, categories] = await Promise.all([getHomeData(), getCategories()]);
  const toolCount = categories.reduce((sum, c) => sum + c._count.tools, 0);

  return (
    <div className="space-y-16 pb-8">
      <Hero toolCount={toolCount} />

      <ToolSection
        title="Featured Alternatives"
        subtitle="Hand-picked tools worth switching to"
        tools={data.featured}
        href="/tools"
        icon={<Sparkles className="size-5 text-violet-500" />}
      />

      <CategoryGrid categories={categories} />

      <ToolSection
        title="Trending AI Tools"
        subtitle="The AI tools everyone is switching to right now"
        tools={data.trendingAi}
        href="/categories/ai-tools"
        icon={<Bot className="size-5 text-emerald-500" />}
      />

      <ToolSection
        title="Top Rated"
        subtitle="Highest community ratings across all categories"
        tools={data.topRated}
        href="/tools?sort=rating"
        icon={<Star className="size-5 text-amber-500" />}
      />

      <ToolSection
        title="Trending Apps"
        subtitle="Popular apps gaining momentum this week"
        tools={data.trendingApps}
        href="/categories/apps"
        icon={<Flame className="size-5 text-orange-500" />}
      />

      <ToolSection
        title="AI Picks"
        subtitle="Selected by our AI for exceptional quality"
        tools={data.aiPicks}
        href="/tools?sort=alternatives"
        icon={<TrendingUp className="size-5 text-sky-500" />}
      />

      <ToolSection
        title="Newest Listings"
        subtitle="Fresh tools just added to the hub"
        tools={data.newest}
        href="/tools?sort=newest"
        icon={<Rocket className="size-5 text-rose-500" />}
      />

      {data.comparisons.length > 0 && (
        <FadeIn>
          <section className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  <Scale className="size-5 text-indigo-500" />
                  Latest Comparisons
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Head-to-head breakdowns with a clear winner</p>
              </div>
              <Link href="/compare" className="group inline-flex items-center gap-1 text-sm font-medium text-primary">
                View all <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.comparisons.map((cmp) => (
                <Link
                  key={cmp.slug}
                  href={`/compare/${cmp.slug}`}
                  className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg"
                >
                  <h3 className="font-semibold transition-colors group-hover:text-primary">{cmp.title}</h3>
                  {cmp.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{truncate(cmp.summary, 160)}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {data.posts.length > 0 && (
        <FadeIn>
          <section className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">From the Blog</h2>
                <p className="mt-1 text-sm text-muted-foreground">Guides, top lists and comparisons</p>
              </div>
              <Link href="/blog" className="group inline-flex items-center gap-1 text-sm font-medium text-primary">
                All posts <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {data.posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {post.category.replace("_", " ")}
                  </span>
                  <h3 className="mt-2 font-semibold leading-snug transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  {post.publishedAt && (
                    <p className="mt-3 text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      <FadeIn>
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 px-6 py-14 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Never miss a better tool
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              One weekly email with the best new alternatives, deals and comparisons. No spam, ever.
            </p>
            <div className="mt-6">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
