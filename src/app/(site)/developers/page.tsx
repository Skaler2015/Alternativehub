import type { Metadata } from "next";
import { Code2, Zap, Globe, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "Developer API",
  description:
    "Free, read-only REST API for the AlternativeHub catalog — query thousands of software tools, alternatives, categories, ratings and pricing as JSON. No API key required.",
  path: "/developers",
  keywords: ["software api", "tools api", "alternatives api", "developer api", "rest api", "json"],
});

const base = SITE.url;

type Endpoint = {
  method: string;
  path: string;
  desc: string;
  params?: { name: string; desc: string }[];
  example: string;
};

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/tools",
    desc: "List published tools with pagination, search, filtering and sorting.",
    params: [
      { name: "q", desc: "Full-text search across name, tagline and description." },
      { name: "category", desc: "Filter by category slug (e.g. ai-tools)." },
      { name: "pricing", desc: "FREE · FREEMIUM · PAID · SUBSCRIPTION · ONE_TIME · OPEN_SOURCE · CONTACT" },
      { name: "sort", desc: "popular (default) · top_rated · newest · name" },
      { name: "page", desc: "1-based page number." },
      { name: "limit", desc: "Results per page (1–50, default 20)." },
    ],
    example: `${base}/api/v1/tools?category=ai-tools&pricing=FREEMIUM&sort=top_rated&limit=5`,
  },
  {
    method: "GET",
    path: "/api/v1/tools/{slug}",
    desc: "Fetch a single tool by its slug, including pros, cons, use-cases, integrations, platforms and tags.",
    example: `${base}/api/v1/tools/notion`,
  },
  {
    method: "GET",
    path: "/api/v1/categories",
    desc: "List every category with its published-tool count.",
    example: `${base}/api/v1/categories`,
  },
];

const SAMPLE = `{
  "data": [
    {
      "slug": "notion",
      "name": "Notion",
      "tagline": "One workspace for notes, docs and projects",
      "url": "${base}/tools/notion",
      "pricing": "FREEMIUM",
      "rating": 4.7,
      "reviewCount": 128,
      "category": { "slug": "productivity", "name": "Productivity" },
      "platforms": [{ "slug": "web", "name": "Web" }],
      "tags": [{ "slug": "notes", "name": "Notes" }]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 342, "totalPages": 18, "hasMore": true }
}`;

const FEATURES = [
  { icon: Zap, title: "No key required", sub: "Public and free. Just make a GET request." },
  { icon: Globe, title: "CORS-enabled", sub: "Call it straight from the browser, any origin." },
  { icon: ShieldCheck, title: "Rate-limited", sub: "120 requests/min per IP, cached at the edge." },
];

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Developers", path: "/developers" }]} />

      <div className="mt-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <Code2 className="size-7 text-primary" /> Developer API
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A free, read-only REST API over the entire AlternativeHub catalog. Build integrations,
          dashboards, or your own discovery tools on top of thousands of community-rated software
          listings — all responses are JSON.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-4">
            <f.icon className="size-5 text-primary" />
            <p className="mt-2 text-sm font-semibold">{f.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{f.sub}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Base URL</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border bg-muted/50 p-4 text-sm">
          <code>{base}/api/v1</code>
        </pre>
        <p className="mt-3 text-sm text-muted-foreground">
          Machine-readable{" "}
          <a href="/api/v1/openapi.json" className="font-medium text-primary hover:underline">
            OpenAPI 3.1 spec
          </a>{" "}
          — import it into Postman, Insomnia or Swagger UI, or generate a typed client.
        </p>
      </section>

      <section className="mt-10 space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Endpoints</h2>
        {ENDPOINTS.map((ep) => (
          <div key={ep.path} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {ep.method}
              </span>
              <code className="text-sm font-semibold">{ep.path}</code>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{ep.desc}</p>

            {ep.params && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Parameter</th>
                      <th className="pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ep.params.map((p) => (
                      <tr key={p.name}>
                        <td className="py-2 pr-4 align-top">
                          <code className="text-xs">{p.name}</code>
                        </td>
                        <td className="py-2 align-top text-muted-foreground">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-4 text-xs font-medium text-muted-foreground">Example</p>
            <pre className="mt-1.5 overflow-x-auto rounded-xl border bg-muted/50 p-3 text-xs">
              <code>curl &quot;{ep.example}&quot;</code>
            </pre>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Example response</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <code className="text-xs">GET /api/v1/tools</code>
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border bg-muted/50 p-4 text-xs leading-relaxed">
          <code>{SAMPLE}</code>
        </pre>
      </section>

      <section className="mt-10 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">Fair use</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The API is rate-limited to 120 requests per minute per IP and cached at the edge. Please
          cache responses on your side and attribute AlternativeHub with a link when you display our
          data. Need higher limits or a commercial plan?{" "}
          <a href="/contact" className="font-medium text-primary hover:underline">
            Get in touch
          </a>
          .
        </p>
      </section>
    </div>
  );
}
