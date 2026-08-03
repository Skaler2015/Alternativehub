import { NextResponse } from "next/server";
import { z } from "zod";
import { searchTools, type SearchHit } from "@/lib/search";
import { prisma } from "@/lib/prisma";
import { aiEnabled, chatAssistant } from "@/lib/ai";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Filler words that add noise to catalog search ("free alternatives to X" → "X").
const STOPWORDS = new Set([
  "a", "an", "the", "to", "of", "for", "and", "or", "vs", "versus", "is", "are", "my",
  "best", "top", "good", "great", "free", "paid", "cheap", "alternative", "alternatives",
  "tool", "tools", "app", "apps", "software", "website", "site", "online", "some", "any",
  "what", "which", "recommend", "suggest", "need", "want", "looking", "find", "show", "me",
  "like", "similar", "instead", "with", "without", "that", "this", "can", "you", "please",
  "beginner", "beginners", "on", "in", "use", "using", "about",
]);

function extractKeywords(message: string): string[] {
  return [...new Set(
    message
      .toLowerCase()
      .replace(/[^a-z0-9\s.+-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w)),
  )];
}

/** Ground the chat in the catalog: full-phrase search, then keyword search, then alternatives of the top hit. */
async function findRelevantTools(message: string, limit = 6): Promise<SearchHit[]> {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  const push = (hits: SearchHit[]) => {
    for (const h of hits) {
      if (!seen.has(h.id)) { seen.add(h.id); out.push(h); }
      if (out.length >= limit) break;
    }
  };

  // 1) Full message (works for exact names / short queries)
  try { push((await searchTools(message, { limit })).hits); } catch { /* ignore */ }

  // 2) Per-keyword search (handles natural-language questions)
  if (out.length < limit) {
    for (const kw of extractKeywords(message)) {
      if (out.length >= limit) break;
      try { push((await searchTools(kw, { limit })).hits); } catch { /* ignore */ }
    }
  }

  // 3) If the top hit is a specific tool, add its alternatives ("alternatives to X")
  if (out.length > 0 && out.length < limit) {
    try {
      const alts = await prisma.alternative.findMany({
        where: { sourceToolId: out[0].id, target: { status: "PUBLISHED", deletedAt: null } },
        orderBy: { matchScore: "desc" },
        take: limit,
        select: { target: { include: { category: true } } },
      });
      push(alts.map((a) => ({
        id: a.target.id, slug: a.target.slug, name: a.target.name, tagline: a.target.tagline,
        logoUrl: a.target.logoUrl, category: a.target.category.name, categorySlug: a.target.category.slug,
        pricingModel: a.target.pricingModel, rating: a.target.rating, reviewCount: a.target.reviewCount,
        popularityScore: a.target.popularityScore,
      })));
    } catch { /* ignore */ }
  }

  return out.slice(0, limit);
}

const schema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(8)
    .optional(),
});

/**
 * AI chat assistant endpoint. Grounds answers in the real tool catalog:
 * searches for relevant tools, feeds them to the AI provider, and returns
 * both a natural-language answer and the matched tool cards. Without an AI
 * provider configured it gracefully returns the matched tools with a helper
 * message — still useful.
 */
export async function POST(req: Request) {
  const rl = await rateLimit(`aichat:${getClientIp(req)}`, 20, 60);
  if (!rl.success) {
    return NextResponse.json({ error: "You're chatting fast — please wait a moment." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { message, history } = parsed.data;

  // Ground in the catalog (phrase → keywords → alternatives)
  const tools = await findRelevantTools(message, 6);

  const toolsContext = tools
    .map((t) => `- ${t.name} (${t.category}, ${t.pricingModel}, ${t.rating.toFixed(1)}★): ${t.tagline ?? ""} [/tools/${t.slug}]`)
    .join("\n");

  let answer: string;
  if (aiEnabled()) {
    const ai = await chatAssistant({ message, toolsContext, history });
    answer =
      ai ??
      (tools.length
        ? `Here are some tools that match your question:`
        : `I couldn't find a good match. Try naming a specific tool or category — for example "alternatives to Photoshop".`);
  } else {
    answer = tools.length
      ? `Here are the top tools matching your question:`
      : `No tools matched. Try a broader term or browse categories.`;
  }

  return NextResponse.json({
    answer,
    tools: tools.map((t) => ({
      slug: t.slug,
      name: t.name,
      tagline: t.tagline,
      logoUrl: t.logoUrl,
      category: t.category,
      pricingModel: t.pricingModel,
      rating: t.rating,
    })),
  });
}
