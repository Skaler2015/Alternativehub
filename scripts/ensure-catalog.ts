/**
 * Ensure the full software catalog is present — self-healing across providers.
 *
 * Why: the lean Vercel build seeds the base catalog + batch 7. A FRESH database
 * (e.g. after migrating Neon -> Supabase) would otherwise come up with only a
 * fraction of the tools.
 *
 * Reliability notes learned the hard way on Supabase free tier:
 *   - Run everything over DATABASE_URL, the TRANSACTION pooler (:6543,
 *     pgbouncer). PgBouncer multiplexes many client connections onto a few
 *     backend ones, so bulk work can't exhaust the tiny free-tier connection
 *     limit. (An earlier attempt over the session pooler / DIRECT_URL opened a
 *     real backend connection per client and briefly starved the running site.)
 *   - A generous wall-clock BUDGET caps the step so it can never push the whole
 *     build past Vercel's limit; whatever is left finishes on the next deploy.
 *     Every batch uses skipDuplicates, so re-running only inserts what's missing.
 *   - Tool count is logged before/after each batch, so the deploy log shows
 *     exactly which batch added how many rows (or added nothing).
 *
 * Never fails the build: problems log a warning and exit 0. A live site with a
 * partial catalog beats a failed deploy.
 */
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

// The known-good full catalog is ~4,555 unique tools. Stay below it so a
// fresh/partial DB triggers population while a healthy one skips.
const TARGET = 4000;

// Stop STARTING new batches after this long. The batch already running finishes;
// the rest wait for the next deploy. Vercel Pro allows ~45 min builds, so 25 min
// leaves ample margin for the rest of the build.
const BUDGET_MS = 25 * 60 * 1000;

const BATCHES = [
  "scripts/expand-catalog.ts",
  "scripts/expand-catalog-2.ts",
  "scripts/expand-catalog-3.ts",
  "scripts/expand-catalog-4.ts",
  "scripts/expand-catalog-5.ts",
  "scripts/expand-catalog-6.ts",
  "scripts/expand-catalog-7.ts",
];

async function countTools(): Promise<number> {
  const prisma = new PrismaClient();
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

  console.log(`[ensure-catalog] ${count} tools present (< ${TARGET}) — populating over the transaction pooler...`);

  const start = Date.now();
  for (const batch of BATCHES) {
    if (Date.now() - start > BUDGET_MS) {
      console.warn(`[ensure-catalog] Time budget hit — stopping. Remaining batches run on the next deploy.`);
      break;
    }
    const before = count;
    const res = spawnSync("npx", ["tsx", batch], {
      stdio: "inherit",
      shell: process.platform === "win32",
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
