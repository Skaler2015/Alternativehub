# AlternativeHub — Development Roadmap

## Phase 0 — Foundation (this repository) ✅
- [x] Architecture, folder structure, database schema design
- [x] Next.js 15 + TypeScript + Tailwind v4 + shadcn-style design system
- [x] Prisma schema (30+ models), seed data with real tools
- [x] NextAuth v5 (Google + credentials), RBAC (user/moderator/admin)
- [x] Redis cache layer + rate limiting, Meilisearch w/ Postgres fallback
- [x] Home, browse, tool pages, categories, search, compare engine
- [x] Programmatic SEO pages (/alternatives/*), blog, sitemap/robots/RSS/JSON-LD
- [x] User dashboard (bookmarks, reviews, settings), submit flow
- [x] Admin panel (stats, moderation, users, reports, CSV import, AI generator)
- [x] AI content layer (Claude): summaries, pros/cons, tags, FAQs, SEO meta

## Phase 1 — Launch hardening
- [ ] E2E tests (Playwright) + unit tests on data layer
- [ ] Sentry + OpenTelemetry tracing; structured logging
- [ ] Image pipeline: automated screenshot capture worker (Playwright + Cloudinary)
- [ ] Background jobs (BullMQ on Redis): score recompute, broken-link sweep,
      search reindex, sitemap ping
- [ ] Email (Resend): verification, review replies, weekly digest

## Phase 2 — Growth
- [ ] Public REST API with keys + usage metering (monetized tiers)
- [ ] Collections sharing, follower graph, tool changelogs
- [ ] Browser extension ("Find alternatives for this site")
- [ ] i18n (next-intl), hreflang SEO
- [ ] Editorial workflow: drafts, scheduled publishing, AI-assisted blog pipeline

## Phase 3 — Scale
- [ ] Read replicas + pgBouncer; partition AnalyticsEvent
- [ ] Vector similarity (pgvector) for semantic "similar tools"
- [ ] Realtime trending (Redis sorted sets → materialized views)
- [ ] Native mobile apps (Expo) sharing the REST API
