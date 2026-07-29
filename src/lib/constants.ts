export const SITE = {
  name: "AlternativeHub",
  tagline: "Discover Better Alternatives",
  description:
    "Discover the best alternatives to apps, websites, AI tools, desktop software, SaaS products, browser extensions, APIs and games. Community-rated, AI-analyzed, always up to date.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://alternativehub.in",
  twitter: "@alternativehub",
  email: "hello@alternativehub.in",
} as const;

export const SEARCH_PLACEHOLDERS = [
  "Search Apps...",
  "Search Websites...",
  "Search AI Tools...",
  "Search Software...",
] as const;

export const TRENDING_SEARCHES = [
  "ChatGPT alternatives",
  "Photoshop alternatives",
  "Notion alternatives",
  "Free VPN",
  "AI video tools",
  "Canva alternatives",
] as const;

export const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
  { value: "alternatives", label: "Alternative Score" },
] as const;

export const PRICING_LABELS: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  SUBSCRIPTION: "Subscription",
  ONE_TIME: "One-time",
  OPEN_SOURCE: "Open Source",
  CONTACT: "Contact",
};

export const PAGE_SIZE = 24;
