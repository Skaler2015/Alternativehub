# AlternativeHub — System Architecture

> **Domain:** alternativehub.in · **Tagline:** Discover Better Alternatives
>
> An enterprise-grade discovery platform for finding the best alternatives to Apps,
> Websites, AI Tools, Desktop Software, SaaS, Browser Extensions, APIs and Games.

---

## 1. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              EDGE / CDN                                │
│      (Vercel Edge Network / Cloudflare — static assets, ISR cache)     │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────────┐
│                       NEXT.JS 15 (App Router, RSC)                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Public Site │  │  User Account │  │  Admin Panel │  │  REST API │  │
│  │  (RSC + ISR) │  │  (SSR + auth) │  │  (RBAC)      │  │  /api/*   │  │
│  └──────────────┘  └───────────────┘  └──────────────┘  └───────────┘  │
└───────┬───────────────────┬──────────────────┬───────────────┬────────┘
        │                   │                  │               │
┌───────▼───────┐   ┌───────▼──────┐   ┌───────▼──────┐  ┌─────▼───────┐
│  PostgreSQL   │   │    Redis     │   │  Meilisearch │  │ Cloudinary  │
│  (Prisma ORM) │   │ cache + rate │   │ instant/fuzzy│  │ media CDN   │
│  source of    │   │ limiting +   │   │ typo-tolerant│  │ logos/shots │
│  truth        │   │ counters     │   │ search       │  │             │
└───────────────┘   └──────────────┘   └──────────────┘  └─────────────┘
                            │
                    ┌───────▼────────┐
                    │  AI Layer      │  Claude API (Anthropic)
                    │  summaries,    │  pros/cons, tags, FAQs, SEO meta,
                    │  content gen   │  category detection, recommendations
                    └────────────────┘
```

### Key architectural decisions

| Decision | Choice | Rationale |
|---|---|---|
| Rendering | RSC-first, dynamic pages + Redis data cache | DB-backed pages stay fresh; hot queries served from Redis in <1 ms |
| Search | Meilisearch with Postgres fallback | Typo tolerance, instant (<50 ms) search; graceful degradation if search is down |
| Auth | NextAuth v5 (JWT strategy) + Prisma adapter | Google OAuth + credentials; JWT keeps middleware/edge DB-free |
| Cache | Layered: Redis (data) → ISR (page) → CDN (asset) | Scales reads to millions of users |
| Media | Cloudinary | On-the-fly transforms, AVIF/WebP, global CDN |
| AI | Claude (Anthropic) behind a provider-agnostic `lib/ai` facade | Best-in-class summarization; swappable provider |
| RBAC | Role enum (USER / MODERATOR / ADMIN) + granular permission checks in a single `authz` module | Fast checks without joins on the hot path |

---

## 2. Folder Structure

```
alternativehub/
├── docs/                        # Architecture, roadmap, API reference
├── prisma/
│   ├── schema.prisma            # Production-grade schema (see §3)
│   └── seed.ts                  # Real seed data: 28 categories, 30+ tools
├── public/                      # Static assets
├── scripts/
│   └── sync-search.ts           # Sync Postgres → Meilisearch index
├── src/
│   ├── app/
│   │   ├── (auth)/login, register
│   │   ├── (site)/              # Public pages (navbar/footer layout)
│   │   │   ├── page.tsx         # Home
│   │   │   ├── tools/           # Browse + tool detail pages
│   │   │   ├── categories/      # Category hub + category pages
│   │   │   ├── alternatives/    # Programmatic SEO: "Best X Alternatives"
│   │   │   ├── compare/         # Comparison engine (chatgpt-vs-claude…)
│   │   │   ├── search/          # Full search results
│   │   │   ├── blog/            # Blog index + posts
│   │   │   ├── submit/          # Submit-a-tool flow
│   │   │   └── dashboard/       # User: bookmarks, reviews, settings
│   │   ├── admin/               # Admin panel (RBAC-guarded layout)
│   │   ├── api/                 # REST API (see §4)
│   │   ├── sitemap.ts robots.ts manifest.ts rss.xml/
│   │   └── layout.tsx globals.css not-found.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn-style primitives (Radix + CVA)
│   │   ├── layout/              # Navbar, footer, theme toggle, user menu
│   │   ├── search/              # ⌘K command palette, hero search, voice
│   │   ├── tools/               # ToolCard, ratings, scores, reviews, FAQ…
│   │   ├── home/                # Hero, trending, category grid, newsletter
│   │   ├── seo/                 # JSON-LD, breadcrumbs
│   │   └── admin/               # Stat cards, data tables, sidebar
│   ├── lib/
│   │   ├── prisma.ts redis.ts cache.ts search.ts ai.ts cloudinary.ts
│   │   ├── auth.ts authz.ts rate-limit.ts seo.ts validations.ts
│   │   ├── automation.ts        # Metadata/logo fetch, dedupe, link checks
│   │   ├── data/                # Data-access layer (cached queries)
│   │   └── utils.ts constants.ts
│   └── middleware.ts            # Security headers
├── docker-compose.yml           # Postgres + Redis + Meilisearch for dev
└── next.config.ts tailwind (v4 via CSS) tsconfig.json
```

---

## 3. Database Schema (summary)

Source of truth: `prisma/schema.prisma`. ~30 models:

- **Identity & access** — `User`, `Account`, `Session`, `VerificationToken`,
  `Role` (enum) + granular permissions in `lib/authz`.
- **Catalog** — `Tool` (the core entity: scores, pricing, SEO fields, AI
  content), `Category` (self-relational → subcategories), `Company`,
  `Platform`/`ToolPlatform`, `Feature`/`ToolFeature`, `PricingPlan`,
  `Tag`/`ToolTag`, `Media` (screenshots/videos/logos), `Faq`.
- **Graph** — `Alternative` (tool↔tool alternative edges w/ match score),
  `Comparison`/`ComparisonItem` (multi-tool VS pages).
- **Community** — `Review`, `ReviewVote`, `Vote` (tool up/down),
  `Bookmark`, `Collection`/`CollectionItem`, `Report`, `Notification`,
  `RecentlyViewed`, `NewsletterSubscriber`.
- **Content** — `BlogPost` (+ category enum), AI-generated fields stored
  alongside human-editable overrides.
- **Ops & insight** — `AnalyticsEvent`, `ApiLog`, `ActivityLog` (audit trail).

Scores stored denormalized on `Tool` for read performance
(`rating`, `reviewCount`, `alternativeScore`, `aiScore`, `popularityScore`,
`trustScore`, `viewCount`, `upvotes`) and recomputed on write / by cron.

---

## 4. REST API Surface

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | * | NextAuth (Google + credentials) |
| `/api/auth/register` | POST | Email signup (bcrypt, zod-validated) |
| `/api/search` | GET | Instant search — Meilisearch w/ typo tolerance, category filters, Postgres fallback |
| `/api/tools` | GET/POST | List (filter/sort/paginate) / submit tool |
| `/api/tools/[slug]` | GET | Tool detail (cached) |
| `/api/tools/[slug]/reviews` | GET/POST | Reviews (rate-limited) |
| `/api/tools/[slug]/vote` | POST | Up/down vote |
| `/api/tools/[slug]/bookmark` | POST/DELETE | Bookmark toggle |
| `/api/tools/[slug]/report` | POST | Report tool |
| `/api/newsletter` | POST | Subscribe |
| `/api/track` | POST | Analytics events (view, click-out) |
| `/api/ai/generate` | POST | Admin: AI summary/pros/cons/tags/FAQs/SEO |
| `/api/admin/stats` | GET | Dashboard metrics |
| `/api/admin/tools/[id]` | PATCH/DELETE | Approve/reject/feature/edit/delete/restore |
| `/api/admin/import` | POST | CSV bulk import + AI enrichment |

All mutating routes: zod validation, session auth, Redis rate limiting,
audit logged to `ActivityLog`.

---

## 5. Caching Strategy

1. **Redis data cache** (`lib/cache.ts`) — query results keyed + TTL'd
   (`home:v1` 5 min, `tool:<slug>` 10 min, trending 15 min). Invalidated on
   admin writes.
2. **HTTP** — `s-maxage` + `stale-while-revalidate` on API GETs.
3. **Counters** — view counts buffered in Redis, flushed to Postgres.

## 6. SEO System

- Per-entity `generateMetadata` with canonical, OG + Twitter cards.
- JSON-LD: `SoftwareApplication` + `AggregateRating`, `FAQPage`,
  `BreadcrumbList`, `ItemList`, `Article`, `WebSite` + `SearchAction`.
- Programmatic pages: `/alternatives/[slug]` ("Best Canva Alternatives"),
  `/compare/[a-vs-b]` — generated from the alternatives graph.
- `sitemap.ts` (dynamic, incl. images), `robots.ts`, RSS feed, automatic
  internal linking from the alternatives graph.

## 7. Security

- Strict security headers (CSP-ready, HSTS, nosniff, frame-deny) in middleware.
- NextAuth CSRF protection; SameSite cookies.
- Prisma parameterized queries (SQLi-safe); zod input validation everywhere.
- Redis sliding-window rate limiting per IP+route; bcrypt(12) password hashing.
- RBAC guards on every admin server action & API route + audit logging.

## 8. Automation Pipeline

`lib/automation.ts` + admin import flow:
metadata scrape → logo fetch (favicon service / Cloudinary) → AI summary,
pros/cons, tags, FAQs, SEO meta → category detection → duplicate detection
(slug/domain fuzzy match) → similar-tool detection (shared category/tags) →
broken-link checks → search index sync → sitemap ping.

## 9. Monetization Hooks

`Tool.sponsored`, `Tool.featured`, `Tool.affiliateUrl` (click-outs tracked in
`AnalyticsEvent`), premium listing tier field, AdSense-ready slots in layouts,
API-key model (`ApiLog`) for a future paid API tier.
