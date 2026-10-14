// npm run db:seed [-- path/to/dishes.json]
// Inserts dishes from the supplied JSON. Safe to re-run: existing dishes (and their edits/versions) are never changed.
import { config } from '../src/config/env.js';
import { createPool } from '../src/db/pool.js';
import { DEFAULT_SEED_FILE, readSeedFile, seedDishes } from '../src/db/seed.js';

const seedFile = process.argv[2] ?? DEFAULT_SEED_FILE;
const pool = createPool({ connectionString: config.databaseUrl, ssl: config.databaseSsl });

try {
  const dishes = await readSeedFile(seedFile);
  const { inserted, skipped } = await seedDishes(pool, dishes);
  console.log(`[seed] ${seedFile}`);
  console.log(`[seed] Inserted ${inserted} new dish(es), skipped ${skipped} already present.`);
} catch (err) {
  console.error(`[seed] Failed: ${err.message}`);
  if (err.code === '42P01') console.error('[seed] The dishes table does not exist. Run "npm run db:migrate" first.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
