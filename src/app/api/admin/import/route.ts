import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, logActivity } from "@/lib/authz";
import { enrichTool, fetchSiteMetadata, findDuplicates } from "@/lib/automation";
import { slugify, faviconUrl } from "@/lib/utils";
import { invalidate, CACHE_KEYS } from "@/lib/cache";

export const maxDuration = 300;

const schema = z.object({
  csv: z.string().min(1).max(200_000),
  enrich: z.boolean().default(true),
  autoPublish: z.boolean().default(false),
});

/** Minimal CSV parser with quoted-field support. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

const VALID_PRICING = ["FREE", "FREEMIUM", "PAID", "SUBSCRIPTION", "ONE_TIME", "OPEN_SOURCE", "CONTACT"];

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const rows = parseCsv(parsed.data.csv.trim());
  if (rows.length < 2) return NextResponse.json({ error: "CSV needs a header and rows" }, { status: 400 });

  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  for (const required of ["name", "websiteUrl", "description", "categorySlug", "pricingModel"]) {
    if (idx(required) === -1) {
      return NextResponse.json({ error: `Missing column: ${required}` }, { status: 400 });
    }
  }

  const skipped: string[] = [];
  const importedIds: string[] = [];

  for (const row of rows.slice(1).slice(0, 100)) {
    const name = row[idx("name")]?.trim();
    const websiteUrl = row[idx("websiteUrl")]?.trim();
    const description = row[idx("description")]?.trim();
    const categorySlug = row[idx("categorySlug")]?.trim();
    const pricingModel = row[idx("pricingModel")]?.trim().toUpperCase();

    if (!name || !websiteUrl || !description) {
      skipped.push(`${name || "(no name)"}: missing fields`);
      continue;
    }
    if (!VALID_PRICING.includes(pricingModel)) {
      skipped.push(`${name}: invalid pricingModel "${pricingModel}"`);
      continue;
    }

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      skipped.push(`${name}: unknown category "${categorySlug}"`);
      continue;
    }

    const duplicates = await findDuplicates(name, websiteUrl);
    if (duplicates.length > 0) {
      skipped.push(`${name}: duplicate of ${duplicates[0].slug}`);
      continue;
    }

    let slug = slugify(name);
    if (await prisma.tool.findUnique({ where: { slug } })) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    // Automatic metadata + logo
    const meta = await fetchSiteMetadata(websiteUrl);

    const tool = await prisma.tool.create({
      data: {
        slug,
        name,
        websiteUrl,
        description,
        tagline: meta?.description?.slice(0, 120),
        logoUrl: faviconUrl(websiteUrl) || null,
        pricingModel: pricingModel as never,
        categoryId: category.id,
        submittedById: user.id,
        status: parsed.data.autoPublish ? "PUBLISHED" : "PENDING",
        publishedAt: parsed.data.autoPublish ? new Date() : null,
        isOpenSource: pricingModel === "OPEN_SOURCE",
      },
    });
    importedIds.push(tool.id);
  }

  // AI enrichment pipeline (sequential to respect provider rate limits)
  if (parsed.data.enrich) {
    for (const id of importedIds) {
      await enrichTool(id).catch(() => {});
    }
  }

  await logActivity({
    userId: user.id,
    action: "tool.bulk_import",
    entity: "Tool",
    meta: { imported: importedIds.length, skipped: skipped.length },
  });
  await invalidate(CACHE_KEYS.home, CACHE_KEYS.categories);

  return NextResponse.json({ imported: importedIds.length, skipped });
}
