import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withTransaction } from './transaction.js';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../db/migrations/', import.meta.url));

// Arbitrary constant used as a Postgres advisory-lock key so two migration runs never overlap.
const MIGRATION_LOCK_KEY = 482_901;

/**
 * Applies every db/migrations/*.sql file that has not been applied yet, in filename order.
 * Each file runs in its own transaction and is recorded in schema_migrations.
 * Returns the names of the files applied in this run.
 */
export async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();
  const applied = [];

  for (const file of files) {
    const wasApplied = await withTransaction(pool, async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [MIGRATION_LOCK_KEY]);

      const existing = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (existing.rowCount > 0) return false;

      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      return true;
    });

    if (wasApplied) applied.push(file);
  }

  return applied;
}
