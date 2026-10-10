import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/authz";
import { normalizeRow, type CatalogRow } from "@/lib/catalog/normalize";
import { bulkInsert } from "../../../../../scripts/bulk-catalog";
import { ROWS as ROWS4 } from "../../../../../scripts/catalog-4-data";
import { ROWS as ROWS5 } from "../../../../../scripts/catalog-5-data";
import { ROWS as ROWS6 } from "../../../../../scripts/catalog-6-data";
import { ROWS as ROWS7 } from "../../../../../scripts/catalog-7-data";

export const dynamic = "force-dynamic";
// Vercel Pro: a single call gets up to 5 minutes. Bulk inserts are chunked and
// commit as they go, so even if a call is cut off the work done persists and the
// next call resumes (every insert uses skipDuplicates).
export const maxDuration = 300;

// Leave headroom under maxDuration so we return cleanly instead of being killed
// mid-batch.
const BUDGET_MS = 250_000;

const BATCHES: { label: string; rows: unknown[][] }[] = [
  { label: "catalog-4", rows: ROWS4 as unknown[][] },
  { label: "catalog-5", rows: ROWS5 as unknown[][] },
  { label: "catalog-6", rows: ROWS6 as unknown[][] },
  { label: "catalog-7", rows: ROWS7 as unknown[][] },
];

/**
 * Admin-only bulk catalog publisher — decoupled from the Vercel build.
 *
 * Why this exists: populating thousands of rows during the build is unreliable
 * on a distant, connection-limited database (Supabase free tier in Singapore).
 * This route does the same work from the normal serverless runtime, where it can
 * be retried on demand and is safely idempotent (skipDuplicates), so a few taps
 * reliably publish the full catalog.
 *
 * Auth: a signed-in ADMIN/MODERATOR (browser), or `Authorization: Bearer
 * <CRON_SECRET>` (curl / automation).
 */
async function authorize(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) return true;
  const user = await getApiUser();
  return !!user && (user.role === "ADMIN" || user.role === "MODERATOR");
}

async function handle(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const before = await prisma.tool.count();
  const perBatch: { batch: string; added: number }[] = [];
  let stoppedEarly = false;

  for (const { label, rows } of BATCHES) {
    if (Date.now() - start > BUDGET_MS) {
      stoppedEarly = true;
      break;
    }
    try {
      const normalized = (rows as CatalogRow[]).map(normalizeRow);
      const added = await bulkInsert(prisma, normalized, label);
      perBatch.push({ batch: label, added });
    } catch (err) {
      perBatch.push({ batch: label, added: -1 });
      console.error(`[populate-catalog] ${label} failed:`, err);
    }
  }

  const after = await prisma.tool.count();
  const done = !stoppedEarly && after < 100000; // all batches attempted this call
  return NextResponse.json({
    ok: true,
    before,
    after,
    added: after - before,
    perBatch,
    stoppedEarly,
    done,
    note: stoppedEarly
      ? "Time budget reached — run again to continue (safe to repeat)."
      : "All batches attempted. Re-running is safe and only adds what's missing.",
    elapsedMs: Date.now() - start,
  });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
