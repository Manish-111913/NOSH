// npm run db:reset -- --yes
// DESTRUCTIVE: deletes every dish and re-inserts the original seed data (all versions back to 1).
// Meant for local development and the browser tests only. Never runs automatically.
import { config } from '../src/config/env.js';
import { createPool } from '../src/db/pool.js';
import { withTransaction } from '../src/db/transaction.js';
import { readSeedFile, seedDishes } from '../src/db/seed.js';

if (!process.argv.includes('--yes')) {
  console.error('[reset] This deletes ALL dishes and saved edits. Re-run with: npm run db:reset -- --yes');
  process.exit(1);
}
if (config.nodeEnv === 'production') {
  console.error('[reset] Refusing to reset a production database.');
  process.exit(1);
}

const pool = createPool({ connectionString: config.databaseUrl, ssl: config.databaseSsl });

try {
  const dishes = await readSeedFile();
  await withTransaction(pool, (client) => client.query('TRUNCATE dishes'));
  const { inserted } = await seedDishes(pool, dishes);
  console.log(`[reset] Cleared dishes and re-seeded ${inserted} dish(es).`);
} catch (err) {
  console.error(`[reset] Failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
