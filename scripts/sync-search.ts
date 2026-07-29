/**
 * Sync all published tools into Meilisearch.
 * Usage: npm run search:sync
 */
import { syncSearchIndex } from "../src/lib/search";

async function main() {
  const count = await syncSearchIndex();
  console.log(`✓ Indexed ${count} tools into Meilisearch`);
}

main()
  .catch((err) => {
    console.error("Search sync failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
