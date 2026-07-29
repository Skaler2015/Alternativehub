import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

/** Consistent metadata builder: canonical, Open Graph, Twitter cards. */
export function buildMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const url = `${SITE.url}${input.path}`;
  const image = input.image ?? `${SITE.url}/og-default.png`;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: SITE.name,
      type: "website",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      site: SITE.twitter,
      images: [image],
    },
  };
}

// ── JSON-LD builders ────────────────────────────────────────────────────

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: `${SITE.url}/icon.svg`,
    sameAs: [`https://twitter.com/${SITE.twitter.replace(/^@/, "")}`],
  };
}

export function softwareAppJsonLd(tool: {
  name: string;
  description: string;
  slug: string;
  logoUrl?: string | null;
  rating: number;
  reviewCount: number;
  pricingModel: string;
  category: string;
  websiteUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    url: `${SITE.url}/tools/${tool.slug}`,
    image: tool.logoUrl ?? undefined,
    applicationCategory: tool.category,
    offers: {
      "@type": "Offer",
      price: tool.pricingModel === "FREE" || tool.pricingModel === "OPEN_SOURCE" ? "0" : undefined,
      priceCurrency: "USD",
    },
    ...(tool.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: tool.rating.toFixed(1),
            reviewCount: tool.reviewCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    sameAs: [tool.websiteUrl],
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

export function itemListJsonLd(items: { name: string; path: string }[], name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: `${SITE.url}${item.path}`,
    })),
  };
}

export function articleJsonLd(post: {
  title: string;
  excerpt: string;
  slug: string;
  coverUrl?: string | null;
  publishedAt?: Date | null;
  updatedAt: Date;
  author?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: `${SITE.url}/blog/${post.slug}`,
    image: post.coverUrl ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: post.author ?? SITE.name },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}
