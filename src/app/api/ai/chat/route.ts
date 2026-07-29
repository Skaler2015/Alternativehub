import { NextResponse } from "next/server";
import { z } from "zod";
import { searchTools } from "@/lib/search";
import { aiEnabled, chatAssistant } from "@/lib/ai";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  // Ground in the catalog
  let tools: Awaited<ReturnType<typeof searchTools>>["hits"] = [];
  try {
    const res = await searchTools(message, { limit: 6 });
    tools = res.hits;
  } catch {
    tools = [];
  }

  const toolsContext = tools
    .map((t) => `- ${t.name} (${t.category}, ${t.pricingModel}, ${t.rating.toFixed(1)}★): ${t.tagline ?? ""} [/tools/${t.slug}]`)
    .join("\n");

  let answer: string;
  if (aiEnabled()) {
    const ai = await chatAssistant({ message, toolsContext, history });
    answer =
      ai ??
      (tools.length
        ? `Here are some tools that match "${message}":`
        : `I couldn't find a good match for "${message}". Try browsing our categories.`);
  } else {
    answer = tools.length
      ? `Here are the top tools matching "${message}". (Enable AI for smart recommendations.)`
      : `No tools matched "${message}". Try a broader term or browse categories.`;
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
