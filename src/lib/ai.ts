import Anthropic from "@anthropic-ai/sdk";

/**
 * AI content layer — Claude (Anthropic).
 *
 * Generates summaries, pros/cons, tags, FAQs, SEO metadata and category
 * suggestions for tool listings. All functions return null when
 * ANTHROPIC_API_KEY is unset so the platform runs fine without AI configured.
 *
 * Uses structured outputs (output_config.format) so responses are guaranteed
 * to match the schema, and server-side refusal fallbacks so classifier
 * declines transparently retry on a fallback model.
 */

const MODEL = process.env.AI_MODEL ?? "claude-opus-5";

let client: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (client !== undefined) return client;
  client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return client;
}

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

export async function generateToolContent(input: {
  name: string;
  description: string;
  websiteUrl: string;
  categories: string[];
}): Promise<GeneratedToolContent | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 8192,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system:
      "You are the content engine for AlternativeHub, a software-alternatives discovery platform. " +
      "Write accurate, neutral, useful listing content. Never invent features; when unsure, stay general. " +
      "Cons must be genuine drawbacks users report, not softballs.",
    output_config: {
      format: { type: "json_schema", schema: TOOL_CONTENT_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content:
          `Generate listing content for this tool.\n\n` +
          `Name: ${input.name}\nWebsite: ${input.websiteUrl}\n` +
          `Description: ${input.description}\n\n` +
          `Available category slugs: ${input.categories.join(", ")}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  try {
    return JSON.parse(text.text) as GeneratedToolContent;
  } catch {
    return null;
  }
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
  const anthropic = getClient();
  if (!anthropic) return null;

  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 2048,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { format: { type: "json_schema", schema: RECOMMENDATION_SCHEMA } },
    messages: [
      {
        role: "user",
        content:
          `Rank the best alternatives to "${input.toolName}" (${input.toolDescription}).\n\n` +
          `Candidates:\n${input.candidates.map((c) => `- ${c.slug}: ${c.name} — ${c.tagline ?? ""}`).join("\n")}\n\n` +
          `Return only slugs from the candidate list, strongest alternative first.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  try {
    return JSON.parse(text.text) as { recommendations: string[]; reasoning: string };
  } catch {
    return null;
  }
}

/** AI comparison verdict for the comparison engine. */
export async function generateComparisonSummary(input: {
  tools: { name: string; pros: string[]; cons: string[]; pricingModel: string }[];
}): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 1024,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [
      {
        role: "user",
        content:
          `Write a neutral 3-4 sentence comparison verdict for: ` +
          input.tools.map((t) => t.name).join(" vs ") +
          `.\n\nData:\n` +
          input.tools
            .map(
              (t) =>
                `${t.name} (${t.pricingModel}) — Pros: ${t.pros.join("; ")}. Cons: ${t.cons.join("; ")}.`,
            )
            .join("\n") +
          `\n\nName which tool wins for which use case. Plain prose, no markdown.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  const text = response.content.find((b) => b.type === "text");
  return text && text.type === "text" ? text.text : null;
}
