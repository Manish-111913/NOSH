import pg from 'pg';

export function createPool({ connectionString, ssl = false }) {
  const pool = new pg.Pool({
    connectionString,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // An idle client can lose its connection (e.g. database restart). Log it instead of crashing the process.
  pool.on('error', (err) => {
    console.error('[db] Unexpected error on idle client:', err.message);
  });

  return pool;
}
