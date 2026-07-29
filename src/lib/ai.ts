import Anthropic from "@anthropic-ai/sdk";

/**
 * AI content layer — provider-agnostic.
 *
 * Generates summaries, pros/cons, tags, FAQs, SEO metadata and category
 * suggestions for tool listings.
 *
 * Provider selection (controlled by AI_PROVIDER: "gemini" | "anthropic" | "auto"):
 *   - "auto" (default): prefer Google Gemini (has a free tier) when
 *     GEMINI_API_KEY is set, otherwise fall back to Anthropic Claude when
 *     ANTHROPIC_API_KEY is set.
 *   - "gemini": force Gemini.
 *   - "anthropic": force Claude.
 * If no key is configured, every function returns null and the platform runs
 * fine without AI.
 *
 * This lets you start free on Gemini and switch to paid Claude later by just
 * adding ANTHROPIC_API_KEY and setting AI_PROVIDER=anthropic — no code change.
 */

type Provider = "gemini" | "anthropic";

function pickProvider(): Provider | null {
  const pref = (process.env.AI_PROVIDER ?? "auto").toLowerCase();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  if (pref === "gemini") return hasGemini ? "gemini" : null;
  if (pref === "anthropic") return hasAnthropic ? "anthropic" : null;
  // auto — prefer the free provider first
  if (hasGemini) return "gemini";
  if (hasAnthropic) return "anthropic";
  return null;
}

// ── Anthropic (Claude) ──────────────────────────────────────────────────

let anthropicClient: Anthropic | null | undefined;
function getAnthropic(): Anthropic | null {
  if (anthropicClient !== undefined) return anthropicClient;
  anthropicClient = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return anthropicClient;
}

async function anthropicJson<T>(
  system: string,
  prompt: string,
  schema: Record<string, unknown>,
): Promise<T | null> {
  const client = getAnthropic();
  if (!client) return null;
  const model = process.env.AI_MODEL ?? "claude-opus-5";
  const response = await client.beta.messages.create({
    model,
    max_tokens: 8192,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  try {
    return JSON.parse(text.text) as T;
  } catch {
    return null;
  }
}

async function anthropicText(system: string, prompt: string): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;
  const model = process.env.AI_MODEL ?? "claude-opus-5";
  const response = await client.beta.messages.create({
    model,
    max_tokens: 1024,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b) => b.type === "text");
  return text && text.type === "text" ? text.text : null;
}

// ── Google Gemini (free tier) ───────────────────────────────────────────

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function geminiGenerate(
  system: string,
  prompt: string,
  jsonMode: boolean,
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  try {
    const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: jsonMode ? { responseMimeType: "application/json" } : {},
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

async function geminiJson<T>(
  system: string,
  prompt: string,
  schema: Record<string, unknown>,
): Promise<T | null> {
  // Describe the exact JSON shape in the prompt (Gemini JSON mode + schema hint)
  const augmented = `${prompt}\n\nRespond ONLY with a JSON object matching this JSON Schema (no markdown, no commentary):\n${JSON.stringify(schema)}`;
  const raw = await geminiGenerate(system, augmented, true);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // occasionally wrapped in ```json … ``` — strip and retry
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      return null;
    }
  }
}

// ── Unified helpers ─────────────────────────────────────────────────────

async function generateJson<T>(
  system: string,
  prompt: string,
  schema: Record<string, unknown>,
): Promise<T | null> {
  const provider = pickProvider();
  if (provider === "gemini") return geminiJson<T>(system, prompt, schema);
  if (provider === "anthropic") return anthropicJson<T>(system, prompt, schema);
  return null;
}

async function generateText(system: string, prompt: string): Promise<string | null> {
  const provider = pickProvider();
  if (provider === "gemini") return geminiGenerate(system, prompt, false);
  if (provider === "anthropic") return anthropicText(system, prompt);
  return null;
}

/** True when at least one AI provider is configured. */
export function aiEnabled(): boolean {
  return pickProvider() !== null;
}

// ── Public API ──────────────────────────────────────────────────────────

export type GeneratedToolContent = {
  summary: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  tags: string[];
  faqs: { question: string; answer: string }[];
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  suggestedCategory: string;
};

const TOOL_CONTENT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Neutral 2-3 sentence summary of the tool" },
    pros: { type: "array", items: { type: "string" }, description: "4-6 concrete strengths" },
    cons: { type: "array", items: { type: "string" }, description: "3-5 honest weaknesses" },
    bestFor: { type: "array", items: { type: "string" }, description: "3-4 ideal user personas" },
    tags: { type: "array", items: { type: "string" }, description: "5-8 lowercase tags" },
    faqs: {
      type: "array",
      description: "4 frequently asked questions with concise answers",
      items: {
        type: "object",
        properties: { question: { type: "string" }, answer: { type: "string" } },
        required: ["question", "answer"],
        additionalProperties: false,
      },
    },
    seoTitle: { type: "string", description: "SEO title, max 60 chars, includes the tool name" },
    seoDescription: { type: "string", description: "Meta description, 140-160 chars" },
    keywords: { type: "array", items: { type: "string" }, description: "6-10 SEO keywords" },
    suggestedCategory: { type: "string", description: "Best-fit category slug from the provided list" },
  },
  required: [
    "summary", "pros", "cons", "bestFor", "tags", "faqs",
    "seoTitle", "seoDescription", "keywords", "suggestedCategory",
  ],
  additionalProperties: false,
} as const;

const TOOL_CONTENT_SYSTEM =
  "You are the content engine for AlternativeHub, a software-alternatives discovery platform. " +
  "Write accurate, neutral, useful listing content. Never invent features; when unsure, stay general. " +
  "Cons must be genuine drawbacks users report, not softballs.";

export async function generateToolContent(input: {
  name: string;
  description: string;
  websiteUrl: string;
  categories: string[];
}): Promise<GeneratedToolContent | null> {
  const prompt =
    `Generate listing content for this tool.\n\n` +
    `Name: ${input.name}\nWebsite: ${input.websiteUrl}\n` +
    `Description: ${input.description}\n\n` +
    `Available category slugs: ${input.categories.join(", ")}`;
  return generateJson<GeneratedToolContent>(
    TOOL_CONTENT_SYSTEM,
    prompt,
    TOOL_CONTENT_SCHEMA as unknown as Record<string, unknown>,
  );
}

const RECOMMENDATION_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      description: "Tool slugs from the candidate list, best alternatives first",
      items: { type: "string" },
    },
    reasoning: { type: "string", description: "One-sentence rationale" },
  },
  required: ["recommendations", "reasoning"],
  additionalProperties: false,
} as const;

/** AI-ranked alternative suggestions from a candidate pool. */
export async function rankAlternatives(input: {
  toolName: string;
  toolDescription: string;
  candidates: { slug: string; name: string; tagline: string | null }[];
}): Promise<{ recommendations: string[]; reasoning: string } | null> {
  const prompt =
    `Rank the best alternatives to "${input.toolName}" (${input.toolDescription}).\n\n` +
    `Candidates:\n${input.candidates.map((c) => `- ${c.slug}: ${c.name} — ${c.tagline ?? ""}`).join("\n")}\n\n` +
    `Return only slugs from the candidate list, strongest alternative first.`;
  return generateJson(
    "You recommend the best software alternatives objectively.",
    prompt,
    RECOMMENDATION_SCHEMA as unknown as Record<string, unknown>,
  );
}

/** AI chat assistant — answers grounded in the provided tool catalog context. */
export async function chatAssistant(input: {
  message: string;
  toolsContext: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<string | null> {
  const system =
    "You are AlternativeHub's friendly discovery assistant. Help users find and choose software. " +
    "Recommend ONLY tools from the CATALOG provided below — never invent tools or links. " +
    "Be concise (2-4 sentences), mention specific tool names, and briefly say why each fits. " +
    "If the catalog has nothing relevant, say so and suggest browsing categories.";

  const historyText = (input.history ?? [])
    .slice(-4)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const prompt =
    `CATALOG:\n${input.toolsContext || "(no matching tools found)"}\n\n` +
    (historyText ? `Conversation so far:\n${historyText}\n\n` : "") +
    `User question: ${input.message}`;

  return generateText(system, prompt);
}

/** AI review summary — condenses user reviews into a short "what users say" blurb. */
export async function summarizeReviews(input: {
  toolName: string;
  reviews: { rating: number; body: string }[];
}): Promise<string | null> {
  if (input.reviews.length < 2) return null;
  const system =
    "You summarize user reviews for a software directory. Write a neutral 2-3 sentence summary of the " +
    "overall sentiment — what users praise and what they criticize. No markdown, no bullet points.";
  const prompt =
    `Summarize the reviews for ${input.toolName}:\n\n` +
    input.reviews.slice(0, 20).map((r) => `[${r.rating}/5] ${r.body}`).join("\n");
  return generateText(system, prompt);
}

/** AI comparison verdict for the comparison engine. */
export async function generateComparisonSummary(input: {
  tools: { name: string; pros: string[]; cons: string[]; pricingModel: string }[];
}): Promise<string | null> {
  const prompt =
    `Write a neutral 3-4 sentence comparison verdict for: ` +
    input.tools.map((t) => t.name).join(" vs ") +
    `.\n\nData:\n` +
    input.tools
      .map((t) => `${t.name} (${t.pricingModel}) — Pros: ${t.pros.join("; ")}. Cons: ${t.cons.join("; ")}.`)
      .join("\n") +
    `\n\nName which tool wins for which use case. Plain prose, no markdown.`;
  return generateText("You write objective, concise software comparison verdicts.", prompt);
}
