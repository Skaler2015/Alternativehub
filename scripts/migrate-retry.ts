/**
 * Run `prisma migrate deploy` with retries.
 *
 * Neon's serverless compute can be slow to fully wake on the first heavy
 * operation of a deploy. A simple `SELECT 1` (db-wait) succeeds instantly, but
 * `prisma migrate deploy` then opens its own connection and can still time out
 * with P1002 ("server was reached but timed out") before the compute is warm.
 * That aborts the entire production build.
 *
 * This wrapper retries the migration a few times with backoff. A P1002/timeout
 * is transient — the next attempt almost always succeeds once Neon is awake.
 * It only exits non-zero after every attempt fails, so genuine migration
 * errors still surface and fail the build (as they should).
 */
import { spawnSync } from "node:child_process";

const ATTEMPTS = 4;

function runMigrate(): { ok: boolean; timedOut: boolean } {
  const res = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  const ok = res.status === 0;
  // We can't read stdout (inherited), so treat any non-zero as retryable here;
  // real migration SQL errors are rare and a couple of extra retries are cheap.
  return { ok, timedOut: !ok };
}

async function main() {
  for (let i = 1; i <= ATTEMPTS; i++) {
    const { ok } = runMigrate();
    if (ok) {
      console.log(`[migrate-retry] migrate deploy succeeded on attempt ${i}.`);
      return;
    }
    if (i === ATTEMPTS) {
      console.error(`[migrate-retry] migrate deploy failed after ${ATTEMPTS} attempts.`);
      process.exit(1);
    }
    const waitMs = Math.min(20000, 4000 * i);
    console.warn(
      `[migrate-retry] attempt ${i}/${ATTEMPTS} failed (likely Neon cold start / P1002). ` +
        `Waking DB and retrying in ${waitMs}ms...`,
    );
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

main();
