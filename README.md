# AlternativeHub

> **Discover Better Alternatives** — the most advanced platform for finding alternatives to apps, websites, AI tools, desktop software, SaaS, browser extensions, APIs and games.

**Domain:** [alternativehub.in](https://alternativehub.in)

![Stack](https://img.shields.io/badge/Next.js%2015-black) ![TS](https://img.shields.io/badge/TypeScript-blue) ![Prisma](https://img.shields.io/badge/Prisma%20%2B%20PostgreSQL-2D3748) ![Redis](https://img.shields.io/badge/Redis-red) ![Meilisearch](https://img.shields.io/badge/Meilisearch-ff5caa)

## Features

- 🔍 **Instant search** — Meilisearch-powered, typo-tolerant, with ⌘K command palette, voice search and Postgres fallback
- 🤖 **AI content engine** (Claude) — auto-generated summaries, pros/cons, tags, FAQs, SEO metadata, category detection and alternative ranking
- ⚖️ **Comparison engine** — any 2–4 tools side by side (`/compare/chatgpt-vs-claude-vs-gemini`), features, pricing, platforms, winner
- 📈 **Programmatic SEO** — `/alternatives/<tool>` pages, JSON-LD everywhere, dynamic sitemap (with images), RSS, robots, canonical + OG/Twitter cards
- ⭐ **Community** — reviews, up/down votes, bookmarks, recently viewed, submissions with moderation
- 🛡️ **Admin panel** — dashboard, listing moderation, AI enrichment, CSV bulk import, reviews/reports/users, RBAC + audit log
- ⚙️ **Automation** — metadata scraping, logo fetch, duplicate detection, similar-tool linking, broken-link sweeps, score recompute
- 🎨 **Premium UI** — Tailwind v4 design system, glassmorphism, dark mode, Framer Motion, fully responsive
- 🔒 **Security** — rate limiting (Redis sliding window), zod validation, bcrypt, CSRF via NextAuth, strict headers, SQLi-safe via Prisma

## Quick Start

```bash
# 1. Infrastructure (Postgres + Redis + Meilisearch)
docker compose up -d

# 2. Environment
cp .env.example .env   # fill in AUTH_SECRET at minimum

# 3. Install, migrate, seed
npm install
npm run db:push
npm run db:seed

# 4. (optional) Index search
npm run search:sync

# 5. Run
npm run dev
```

Seed admin: `admin@alternativehub.in` / `admin12345` — **change immediately in production**.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run db:push` / `db:migrate` | Sync / migrate the schema |
| `npm run db:seed` | Seed real categories, tools, comparisons, blog |
| `npm run search:sync` | Push published tools to Meilisearch |
| `npm run typecheck` | TypeScript check |

## Environment

See [.env.example](.env.example). Everything except `DATABASE_URL` and `AUTH_SECRET` is optional — Redis, Meilisearch, Cloudinary and the AI layer all degrade gracefully when unconfigured.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, folder structure, DB schema, API surface, caching, SEO & security strategy
- [docs/ROADMAP.md](docs/ROADMAP.md) — phased development roadmap

## Deployment

Built for Vercel (or any Node host) + managed Postgres (Neon/Supabase/RDS) + Redis (Upstash) + Meilisearch Cloud + Cloudinary. Set env vars, run `prisma migrate deploy`, seed, sync search — done.
