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

const steps: string[][] = [
  ["tsx", "scripts/db-wait.ts"],
  ["tsx", "scripts/migrate-retry.ts"],
  ["tsx", "scripts/seed-if-empty.ts"],
  ["tsx", "scripts/expand-catalog-7.ts"],
];

for (const [cmd, ...args] of steps) {
  const res = spawnSync("npx", [cmd, ...args], { stdio: "inherit", shell: process.platform === "win32" });
  if (res.status !== 0) {
    console.error(`[prebuild] step failed: ${cmd} ${args.join(" ")}`);
    process.exit(res.status ?? 1);
  }
}
