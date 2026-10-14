// npm run db:migrate — creates/updates the database schema.
import { config } from '../src/config/env.js';
import { runMigrations } from '../src/db/migrate.js';
import { createPool } from '../src/db/pool.js';

const pool = createPool({ connectionString: config.databaseUrl, ssl: config.databaseSsl });

try {
  const applied = await runMigrations(pool);
  console.log(applied.length ? `[migrate] Applied: ${applied.join(', ')}` : '[migrate] Database schema is already up to date.');
} catch (err) {
  console.error(`[migrate] Failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
