/**
 * Runs the database seed automatically during deploy — but ONLY when the
 * database is empty. On later deploys (data already present) it skips, so
 * admin edits are never overwritten.
 *
 * Wired into the Vercel build command so production seeds itself with no
 * manual step. A seed failure logs a warning but does NOT fail the build,
 * so the site always deploys.
 */
import { PrismaClient } from "@prisma/client";

async function run() {
  const prisma = new PrismaClient();
  let toolCount = -1;
  try {
    toolCount = await prisma.tool.count();
  } catch (err) {
    console.warn("[seed-if-empty] Could not read tool count — skipping seed.", err);
    await prisma.$disconnect().catch(() => {});
    return;
  }
  await prisma.$disconnect().catch(() => {});

  if (toolCount > 0) {
    console.log(`[seed-if-empty] ${toolCount} tools already present — skipping seed.`);
    return;
  }

  console.log("[seed-if-empty] Database is empty — running seed...");
  try {
    await import("../prisma/seed");
    console.log("[seed-if-empty] Seed complete.");
  } catch (err) {
    // Never break the deploy — a live-but-empty site beats a failed deploy.
    console.warn("[seed-if-empty] Seed failed (deploy will continue).", err);
  }
}

run();
