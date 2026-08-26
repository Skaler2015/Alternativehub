/**
 * Build-time DB bootstrap guard.
 *
 * Runs the database steps (wait → migrate → seed-if-empty → catalog) ONLY when a
 * DATABASE_URL is available. Preview builds (feature branches without the
 * production database env) skip them and just build the app, so they stop
 * failing. Production builds have DATABASE_URL, so they run the full chain and
 * still fail loudly if a migration genuinely breaks.
 */
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn("[prebuild] DATABASE_URL not set — skipping DB steps (normal for preview builds).");
  process.exit(0);
}

// The schema now declares directUrl = env("DIRECT_URL") for pooled providers
// (e.g. Supabase PgBouncer on :6543, direct on :5432). On single-URL providers
// like Neon, DIRECT_URL is absent — default it to DATABASE_URL so migrate steps
// (and any child process) always have a resolvable direct connection.
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.warn("[prebuild] DIRECT_URL not set — defaulting to DATABASE_URL.");
}

const steps: string[][] = [
  ["tsx", "scripts/db-wait.ts"],
  ["tsx", "scripts/migrate-retry.ts"],
  ["tsx", "scripts/seed-if-empty.ts"],
  // Self-healing: populates the full catalog on a fresh/partial DB, no-ops on a
  // complete one. Replaces the old single-batch step so provider migrations
  // (e.g. Neon → Supabase) come up with the whole catalog, not just batch 7.
  ["tsx", "scripts/ensure-catalog.ts"],
];

for (const [cmd, ...args] of steps) {
  const res = spawnSync("npx", [cmd, ...args], { stdio: "inherit", shell: process.platform === "win32" });
  if (res.status !== 0) {
    console.error(`[prebuild] step failed: ${cmd} ${args.join(" ")}`);
    process.exit(res.status ?? 1);
  }
}
