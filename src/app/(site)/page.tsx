import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bot,
  Building2,
  Flame,
  Gift,
  GitFork,
  Rocket,
  Scale,
  Sparkles,
  Star,
  TrendingUp,
  Layers,
  FolderOpen,
} from "lucide-react";
import { Hero } from "@/components/home/hero";
import { ToolSection } from "@/components/home/tool-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { StatsBand } from "@/components/home/stats-band";
import { Testimonials } from "@/components/home/testimonials";
import { HomeFaq } from "@/components/home/home-faq";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { FadeIn } from "@/components/motion/fade-in";
import {
  getCategories,
  getHomeData,
  getPlatformStats,
  getTestimonials,
} from "@/lib/data/queries";
import { getT } from "@/lib/i18n/server";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [data, categories, stats, testimonials, { t }] = await Promise.all([
    getHomeData(),
    getCategories(),
    getPlatformStats(),
    getTestimonials(),
    getT(),
  ]);

  return (
    <div className="space-y-16 pb-8">
      <Hero toolCount={stats.tools} />

      <StatsBand stats={stats} />

      {/* Value props */}
      <FadeIn>
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Sparkles, title: t("home.vp1.title"), sub: t("home.vp1.sub") },
              { icon: Star, title: t("home.vp2.title"), sub: t("home.vp2.sub") },
              { icon: Scale, title: t("home.vp3.title"), sub: t("home.vp3.sub") },
            ].map((vp) => (
              <div key={vp.title} className="flex items-start gap-3 rounded-2xl border bg-card p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary">
                  <vp.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{vp.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{vp.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <ToolSection
        title={t("home.editorsChoice")}
        subtitle={t("home.editorsChoice.sub")}
        tools={data.featured}
        href="/tools"
        icon={<Award className="size-5 text-violet-500" />}
      />

      <ToolSection
        title={t("home.aiRecommended")}
        subtitle={t("home.aiRecommended.sub")}
        tools={data.aiPicks}
        href="/tools?sort=alternatives"
        icon={<Sparkles className="size-5 text-fuchsia-500" />}
      />

      <CategoryGrid categories={categories} />

      {/* Popular collections */}
      {data.collections.length > 0 && (
        <FadeIn>
          <section className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  <Layers className="size-5 text-violet-500" /> {t("home.popularCollections")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("home.popularCollections.sub")}</p>
              </div>
              <Link href="/collections" className="group inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("common.viewAll")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.collections.map((c) => (
                <Link key={c.id} href={`/collections/${c.id}`} className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:soft-shadow-lg">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="size-5 text-primary" />
                    <h3 className="truncate font-semibold transition-colors group-hover:text-primary">{c.name}</h3>
                  </div>
                  <div className="mt-3 flex -space-x-2">
                    {c.logos.map((logo, i) => (
                      <span key={i} className="flex size-8 items-center justify-center overflow-hidden rounded-lg border bg-background">
                        {logo ? <img src={logo} alt="" className="size-full object-contain p-1" /> : null}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{c.count} tools</p>
                </Link>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Featured companies */}
      {data.companies.length > 0 && (
        <FadeIn>
          <section className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  <Building2 className="size-5 text-indigo-500" /> {t("home.featuredCompanies")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("home.featuredCompanies.sub")}</p>
              </div>
              <Link href="/companies" className="group inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("common.viewAll")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {data.companies.map((c) => (
                <Link key={c.slug} href={`/companies/${c.slug}`} className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/30">
                  <span className="flex size-12 items-center justify-center overflow-hidden rounded-xl border bg-background">
                    {c.logoUrl ? <img src={c.logoUrl} alt="" className="size-full object-contain p-1.5" /> : <Building2 className="size-5 text-muted-foreground" />}
                  </span>
                  <span className="truncate text-sm font-medium transition-colors group-hover:text-primary">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.toolCount} tools</span>
                </Link>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      <ToolSection
        title={t("home.trendingAi")}
        subtitle={t("home.trendingAiFull.sub")}
        tools={data.trendingAi}
        href="/categories/ai-tools"
        icon={<Bot className="size-5 text-emerald-500" />}
      />

      <ToolSection
        title={t("home.highestRated")}
        subtitle={t("home.highestRated.sub")}
        tools={data.topRated}
        href="/tools?sort=rating"
        icon={<Star className="size-5 text-amber-500" />}
      />

      <ToolSection
        title={t("home.bestFree")}
        subtitle={t("home.bestFreeFull.sub")}
        tools={data.bestFree}
        href="/tools?pricing=FREE"
        icon={<Gift className="size-5 text-rose-500" />}
      />

      <ToolSection
        title={t("home.openSourcePicks")}
        subtitle={t("home.openSourcePicks.sub")}
        tools={data.openSource}
        href="/tools?pricing=OPEN_SOURCE"
        icon={<GitFork className="size-5 text-sky-500" />}
      />

      <ToolSection
        title={t("home.enterpriseSoftware")}
        subtitle={t("home.enterpriseSoftware.sub")}
        tools={data.enterprise}
        href="/categories/saas"
        icon={<Building2 className="size-5 text-indigo-500" />}
      />

      <ToolSection
        title={t("home.trendingApps")}
        subtitle={t("home.trendingAppsFull.sub")}
        tools={data.trendingApps}
        href="/categories/apps"
        icon={<Flame className="size-5 text-orange-500" />}
      />

      <ToolSection
        title={t("home.recentlyAdded")}
        subtitle={t("home.recentlyAdded.sub")}
        tools={data.newest}
        href="/tools?sort=newest"
        icon={<Rocket className="size-5 text-teal-500" />}
      />

      {data.comparisons.length > 0 && (
        <FadeIn>
          <section className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  <Scale className="size-5 text-indigo-500" />
                  {t("home.latestComparisons")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("home.latestComparisons.sub")}</p>
              </div>
              <Link href="/compare" className="group inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("common.viewAll")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
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

      <Testimonials items={testimonials} />

      {data.posts.length > 0 && (
        <FadeIn>
          <section className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  <TrendingUp className="size-5 text-primary" /> {t("home.fromBlog")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("home.blog.sub")}</p>
              </div>
              <Link href="/blog" className="group inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("home.allPosts")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
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

      <HomeFaq />

      <FadeIn>
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 px-6 py-14 text-center">
            <div className="aurora" aria-hidden />
            <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">{t("home.neverMiss")}</h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              {t("home.neverMiss.sub")}
            </p>
            <div className="relative mt-6">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
