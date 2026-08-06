/**
 * Wait for the database to be reachable before running migrations.
 *
 * Neon's free tier suspends after inactivity; the first connection during a
 * deploy can time out (P1002) and abort the whole build. This pings the DB with
 * a few retries so Neon has time to wake up, then lets the build continue.
 * It never hard-fails the build — if the DB is still unreachable it logs and
 * exits 0 so the subsequent `prisma migrate deploy` reports the real error.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const attempts = 12;
  for (let i = 1; i <= attempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log(`[db-wait] Database reachable on attempt ${i}.`);
      await prisma.$disconnect().catch(() => {});
      return;
    } catch {
      const waitMs = Math.min(10000, 1500 * i);
      console.warn(`[db-wait] Attempt ${i}/${attempts} failed — waking DB, retrying in ${waitMs}ms.`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  console.warn("[db-wait] DB still unreachable after retries; continuing (migrate will report the error).");
  await prisma.$disconnect().catch(() => {});
}

main();
