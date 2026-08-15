import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { addKeywordsBulk, getOrCreateProject } from "@/lib/rank/data";
import { parseBulkKeywords } from "@/lib/rank/normalize";

export const dynamic = "force-dynamic";

async function guard() {
  const user = await getApiUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;
  return user;
}

/** Bulk add keywords (pasted text or explicit array). Duplicate-proof upsert. */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as
    | { text?: string; keywords?: string[]; group?: string; targetUrl?: string }
    | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });

  const parsed = body.text
    ? parseBulkKeywords(body.text)
    : { valid: (body.keywords ?? []).map((k) => String(k)), total: 0, duplicates: 0, invalid: 0 };

  const project = await getOrCreateProject();
  const { added, skipped } = await addKeywordsBulk(project.id, parsed.valid, {
    group: body.group?.trim() || null,
    targetUrl: body.targetUrl?.trim() || null,
  });
  return NextResponse.json({
    ok: true,
    imported: parsed.valid.length,
    duplicatesInPaste: parsed.duplicates,
    invalid: parsed.invalid,
    added,
    skippedExisting: skipped,
  });
}

/** Delete keywords by id. */
export async function DELETE(req: Request) {
  if (!(await guard())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { ids?: string[] } | null;
  if (!body?.ids?.length) return NextResponse.json({ ok: false, error: "No ids" }, { status: 400 });
  const res = await prisma.rankKeyword.deleteMany({ where: { id: { in: body.ids } } });
  return NextResponse.json({ ok: true, deleted: res.count });
}
