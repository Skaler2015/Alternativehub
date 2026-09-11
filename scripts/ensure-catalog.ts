/**
 * Ensure the full software catalog is present — self-healing across providers.
 *
 * Why: the lean Vercel build seeds the base catalog + batch 7. A FRESH database
 * (e.g. after migrating Neon -> Supabase) would otherwise come up with only a
 * fraction of the tools.
 *
 * Reliability notes learned the hard way on Supabase:
 *   - Heavy bulk inserts run over DIRECT_URL (the session-mode pooler / direct
 *     connection, :5432) instead of the transaction pooler (:6543). The
 *     transaction pooler is meant for short serverless queries and is flaky for
 *     long bulk work; the session connection is the right channel for seeding.
 *   - A wall-clock BUDGET caps how long this step runs so a slow (high-latency)
 *     provider can never push the whole build past Vercel's limit. Whatever is
 *     left is finished on the next deploy — every batch uses skipDuplicates, so
 *     re-running is safe and only inserts what's missing.
 *   - The tool count is logged before and after each batch, so the deploy log
 *     shows exactly which batch added how many rows (or added nothing).
 *
 * Never fails the build: problems log a warning and exit 0. A live site with a
 * partial catalog beats a failed deploy.
 */
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

// The known-good full catalog is ~4,555 unique tools. Stay below it so a
// fresh/partial DB triggers population while a healthy one skips.
const TARGET = 4000;

// Stop STARTING new batches after this many ms. The batch already running
// finishes; the rest wait for the next deploy. Keeps total build time bounded
// even on a high-latency database an ocean away from the build region.
const BUDGET_MS = 12 * 60 * 1000; // 12 minutes

const BATCHES = [
  "scripts/expand-catalog.ts",
  "scripts/expand-catalog-2.ts",
  "scripts/expand-catalog-3.ts",
  "scripts/expand-catalog-4.ts",
  "scripts/expand-catalog-5.ts",
  "scripts/expand-catalog-6.ts",
  "scripts/expand-catalog-7.ts",
];

// Bulk work belongs on the direct/session connection, not the txn pooler.
const bulkUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

function makeClient(): PrismaClient {
  return bulkUrl ? new PrismaClient({ datasourceUrl: bulkUrl }) : new PrismaClient();
}

async function countTools(): Promise<number> {
  const prisma = makeClient();
  try {
    return await prisma.tool.count();
  } catch (err) {
    console.warn("[ensure-catalog] Could not read tool count.", err);
    return -1;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function main() {
  let count = await countTools();
  if (count < 0) {
    console.warn("[ensure-catalog] Skipping — no DB read.");
    return;
  }
  if (count >= TARGET) {
    console.log(`[ensure-catalog] ${count} tools present (>= ${TARGET}) — catalog complete, skipping.`);
    return;
  }

  console.log(
    `[ensure-catalog] ${count} tools present (< ${TARGET}) — populating` +
      `${bulkUrl && process.env.DIRECT_URL ? " via DIRECT_URL (session pooler)" : ""}...`,
  );

  const start = Date.now();
  for (const batch of BATCHES) {
    if (Date.now() - start > BUDGET_MS) {
      console.warn(`[ensure-catalog] Time budget hit — stopping. Remaining batches run on next deploy.`);
      break;
    }
    const before = count;
    const res = spawnSync("npx", ["tsx", batch], {
      stdio: "inherit",
      shell: process.platform === "win32",
      // Route the batch's own PrismaClient at the bulk (session) connection.
      env: bulkUrl ? { ...process.env, DATABASE_URL: bulkUrl } : process.env,
    });
    count = await countTools();
    const added = count >= 0 && before >= 0 ? count - before : NaN;
    const status = res.status === 0 ? "ok" : `exit ${res.status}`;
    console.log(`[ensure-catalog] ${batch}: ${status}, +${Number.isNaN(added) ? "?" : added} tools (now ${count}).`);
    if (count >= TARGET) {
      console.log(`[ensure-catalog] Reached target (${count}) — done.`);
      break;
    }
  }
  console.log(`[ensure-catalog] Population pass complete. Tools now: ${count}.`);
}

main();
