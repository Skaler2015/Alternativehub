import { CORS_HEADERS } from "@/lib/api/public";
import { SITE } from "@/lib/constants";

export const dynamic = "force-static";

/**
 * OpenAPI 3.1 description of the public v1 API. Lets developers import the
 * whole API into Postman / Insomnia / Swagger UI or generate typed clients.
 */
const PRICING = ["FREE", "FREEMIUM", "PAID", "SUBSCRIPTION", "ONE_TIME", "OPEN_SOURCE", "CONTACT"];

const spec = {
  openapi: "3.1.0",
  info: {
    title: `${SITE.name} Public API`,
    version: "1.0.0",
    description:
      "Free, read-only REST API over the AlternativeHub software catalog. No authentication required; rate-limited to 120 requests/min per IP.",
    contact: { name: SITE.name, url: `${SITE.url}/developers`, email: SITE.email },
    license: { name: "Fair use — attribution required", url: `${SITE.url}/terms` },
  },
  servers: [{ url: `${SITE.url}/api/v1`, description: "Production" }],
  paths: {
    "/tools": {
      get: {
        operationId: "listTools",
        summary: "List tools",
        description: "List published tools with search, filtering, sorting and pagination.",
        parameters: [
          { name: "q", in: "query", description: "Full-text search across name, tagline and description.", schema: { type: "string" } },
          { name: "category", in: "query", description: "Filter by category slug.", schema: { type: "string" } },
          { name: "pricing", in: "query", description: "Filter by pricing model.", schema: { type: "string", enum: PRICING } },
          { name: "sort", in: "query", description: "Sort order.", schema: { type: "string", enum: ["popular", "top_rated", "newest", "name"], default: "popular" } },
          { name: "page", in: "query", description: "1-based page number.", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", description: "Results per page.", schema: { type: "integer", minimum: 1, maximum: 50, default: 20 } },
        ],
        responses: {
          "200": {
            description: "A page of tools.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Tool" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/tools/{slug}": {
      get: {
        operationId: "getTool",
        summary: "Get a tool by slug",
        parameters: [
          { name: "slug", in: "path", required: true, description: "The tool's unique slug.", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "The tool.",
            content: {
              "application/json": {
                schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Tool" } } },
              },
            },
          },
          "404": { description: "Tool not found." },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/categories": {
      get: {
        operationId: "listCategories",
        summary: "List categories",
        responses: {
          "200": {
            description: "All categories with published-tool counts.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { type: "array", items: { $ref: "#/components/schemas/Category" } } },
                },
              },
            },
          },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
  },
  components: {
    responses: {
      RateLimited: {
        description: "Rate limit exceeded (120 req/min per IP).",
        content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" } } } } },
      },
    },
    schemas: {
      Ref: {
        type: "object",
        properties: { slug: { type: "string" }, name: { type: "string" } },
      },
      Tool: {
        type: "object",
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          tagline: { type: ["string", "null"] },
          description: { type: "string" },
          url: { type: "string", format: "uri" },
          websiteUrl: { type: "string", format: "uri" },
          logoUrl: { type: ["string", "null"] },
          videoUrl: { type: ["string", "null"] },
          pricing: { type: "string", enum: PRICING },
          rating: { type: "number" },
          reviewCount: { type: "integer" },
          upvotes: { type: "integer" },
          verified: { type: "boolean" },
          openSource: { type: "boolean" },
          featured: { type: "boolean" },
          pros: { type: "array", items: { type: "string" } },
          cons: { type: "array", items: { type: "string" } },
          useCases: { type: "array", items: { type: "string" } },
          integrations: { type: "array", items: { type: "string" } },
          category: { anyOf: [{ $ref: "#/components/schemas/Ref" }, { type: "null" }] },
          platforms: { type: "array", items: { $ref: "#/components/schemas/Ref" } },
          tags: { type: "array", items: { $ref: "#/components/schemas/Ref" } },
          publishedAt: { type: ["string", "null"], format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          parentSlug: { type: ["string", "null"] },
          toolCount: { type: "integer" },
          url: { type: "string", format: "uri" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
          hasMore: { type: "boolean" },
        },
      },
    },
  },
} as const;

export function GET() {
  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
