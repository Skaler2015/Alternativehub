import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/authz";
import { generateToolContent } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(5000),
  websiteUrl: z.string().url(),
});

/** Admin endpoint: generate AI content for a tool draft (summary, pros/cons, tags, FAQs, SEO). */
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: { slug: true },
  });

  const content = await generateToolContent({
    ...parsed.data,
    categories: categories.map((c) => c.slug),
  });

  if (!content) {
    return NextResponse.json(
      { error: "AI generation unavailable — check ANTHROPIC_API_KEY" },
      { status: 503 },
    );
  }

  return NextResponse.json({ content });
}
