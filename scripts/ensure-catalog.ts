/**
 * Ensure the full software catalog is present — self-healing across providers.
 *
 * Why: the lean Vercel build only seeds the base catalog + batch 7. That's fine
 * for an already-populated production DB, but a FRESH database (e.g. migrating
 * from Neon to Supabase) would come up with only a fraction of the tools.
 *
 * This step counts the tools already in the DB and, only when the catalog is
 * clearly under-populated (below TARGET), runs every expansion batch in order.
 * Every batch uses createMany({ skipDuplicates }), so re-running is safe and
 * cheap — existing rows are skipped, nothing is overwritten. On an established
 * DB (count >= TARGET) it does nothing and the build stays fast.
 *
 * Never fails the build: a problem here logs a warning and exits 0, because a
 * live site with a partial catalog beats a failed deploy.
 */
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

// The known-good full catalog is ~4,555 unique tools. Stay comfortably below it
// so a fresh/partial DB triggers a full population, while a healthy production
// DB (or one with a few admin-deleted tools) skips the work.
const TARGET = 4000;

const BATCHES = [
  "scripts/expand-catalog.ts",
  "scripts/expand-catalog-2.ts",
  "scripts/expand-catalog-3.ts",
  "scripts/expand-catalog-4.ts",
  "scripts/expand-catalog-5.ts",
  "scripts/expand-catalog-6.ts",
  "scripts/expand-catalog-7.ts",
];

async function main() {
  const prisma = new PrismaClient();
  let count = -1;
  try {
    count = await prisma.tool.count();
  } catch (err) {
    console.warn("[ensure-catalog] Could not read tool count — skipping.", err);
    await prisma.$disconnect().catch(() => {});
    return;
  }
  await prisma.$disconnect().catch(() => {});

  if (count >= TARGET) {
    console.log(`[ensure-catalog] ${count} tools present (>= ${TARGET}) — catalog looks complete, skipping.`);
    return;
  }

  console.log(`[ensure-catalog] Only ${count} tools present (< ${TARGET}) — populating full catalog...`);
  for (const batch of BATCHES) {
    const res = spawnSync("npx", ["tsx", batch], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (res.status !== 0) {
      // Batches are individually non-fatal by design; keep going so a single
      // slow/failed batch doesn't leave the rest unrun.
      console.warn(`[ensure-catalog] batch had a non-zero exit: ${batch} (continuing).`);
    }
  }
  console.log("[ensure-catalog] Catalog population pass complete.");
}

main();
