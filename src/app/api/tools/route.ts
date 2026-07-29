import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser, logActivity } from "@/lib/authz";
import { submitToolSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { listTools } from "@/lib/data/queries";
import { findDuplicates } from "@/lib/automation";
import { slugify } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const result = await listTools({
    categorySlug: searchParams.get("category") ?? undefined,
    pricing: searchParams.get("pricing") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: Number(searchParams.get("page")) || 1,
  });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
  });
}

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rl = await rateLimit(`submit:${user.id}`, 5, 3600);
  if (!rl.success) {
    return NextResponse.json({ error: "Submission limit reached — try again later" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitToolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, websiteUrl, description, categorySlug, pricingModel, tagline } = parsed.data;

  const duplicates = await findDuplicates(name, websiteUrl);
  if (duplicates.length > 0) {
    return NextResponse.json(
      { error: `Looks like a duplicate of "${duplicates[0].name}" (${duplicates[0].slug})` },
      { status: 409 },
    );
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return NextResponse.json({ error: "Unknown category" }, { status: 400 });

  let slug = slugify(name);
  const slugTaken = await prisma.tool.findUnique({ where: { slug } });
  if (slugTaken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const tool = await prisma.tool.create({
    data: {
      slug,
      name,
      websiteUrl,
      description,
      tagline,
      pricingModel,
      categoryId: category.id,
      submittedById: user.id,
      status: "PENDING",
      isOpenSource: pricingModel === "OPEN_SOURCE",
    },
  });

  await logActivity({
    userId: user.id,
    action: "tool.submit",
    entity: "Tool",
    entityId: tool.id,
    meta: { name },
  });

  return NextResponse.json({ ok: true, slug: tool.slug }, { status: 201 });
}
