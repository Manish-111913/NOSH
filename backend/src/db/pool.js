import pg from 'pg';

export function createPool({
  connectionString,
  ssl = false,
  // A save waiting for another save's row lock gives up after this long (instead of waiting forever).
  lockTimeoutMs = 5_000,
  // If a transaction is left open (e.g. the app hangs mid-request), Postgres ends that session and releases its locks.
  idleInTransactionTimeoutMs = 10_000,
  // No single query may run longer than this.
  statementTimeoutMs = 10_000,
}) {
  const pool = new pg.Pool({
    connectionString,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    lock_timeout: lockTimeoutMs,
    idle_in_transaction_session_timeout: idleInTransactionTimeoutMs,
    statement_timeout: statementTimeoutMs,
  });

  // An idle client can lose its connection (e.g. database restart). Log it instead of crashing the process.
  pool.on('error', (err) => {
    console.error('[db] Unexpected error on idle client:', err.message);
  });

  return pool;
}
