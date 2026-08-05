import type { Metadata } from "next";
import { Flame, Sparkles, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import {
  getTrendingTools,
  getRecentlyAddedTools,
  getRecommendedForUser,
} from "@/lib/recommendations";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Trending Software & Tools",
  description:
    "Discover the software and AI tools people are exploring right now on AlternativeHub — trending this week, freshly added, and picks personalized for you.",
  path: "/trending",
  keywords: ["trending software", "popular tools", "new tools", "trending apps", "what's hot"],
});

function Section({
  icon,
  title,
  subtitle,
  tools,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tools: Awaited<ReturnType<typeof getTrendingTools>>;
}) {
  if (tools.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}

export default async function TrendingPage() {
  const [{ t }, session] = await Promise.all([getT(), auth()]);
  const userId = session?.user?.id;

  const [trending, recent, forYou] = await Promise.all([
    getTrendingTools({ days: 7, limit: 12 }),
    getRecentlyAddedTools(12),
    userId ? getRecommendedForUser(userId, 6) : Promise.resolve([]),
  ]);

  const jsonLd = itemListJsonLd(
    trending.map((x) => ({ name: x.name, path: `/tools/${x.slug}` })),
    "Trending Software",
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: t("nav.trending"), path: "/trending" },
        ]}
      />

      <div className="mt-4 max-w-2xl">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Flame className="size-7 text-primary" /> {t("trending.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("trending.subtitle")}</p>
      </div>

      <Section
        icon={<Sparkles className="size-5 text-primary" />}
        title={t("trending.forYou")}
        subtitle={t("trending.forYouSub")}
        tools={forYou}
      />

      <Section
        icon={<Flame className="size-5 text-primary" />}
        title={t("trending.thisWeek")}
        subtitle={t("trending.thisWeekSub")}
        tools={trending}
      />

      <Section
        icon={<Clock className="size-5 text-primary" />}
        title={t("trending.recentlyAdded")}
        subtitle={t("trending.recentlyAddedSub")}
        tools={recent}
      />

      {trending.length === 0 && recent.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {t("trending.empty")}
        </p>
      )}
    </div>
  );
}
