import { createApp } from './app.js';
import { config } from './config/env.js';
import { createPool } from './db/pool.js';

const pool = createPool({ connectionString: config.databaseUrl, ssl: config.databaseSsl });
const app = createApp({ pool, corsOrigins: config.corsOrigins, logRequests: config.nodeEnv !== 'test' });

const server = app.listen(config.port, () => {
  console.log(`[server] Nosh API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  console.log(`[server] Allowed CORS origins: ${config.corsOrigins.join(', ') || '(none)'}`);
});

// Report database reachability at startup. The API still starts; requests return 503 until the database is up.
pool
  .query('SELECT 1')
  .then(() => console.log('[db] Connected to PostgreSQL'))
  .catch((err) => console.error(`[db] Cannot reach PostgreSQL yet: ${err.message}`));

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received, shutting down...`);

  // Stop accepting connections, let in-flight requests finish, then close the database pool.
  server.close(async () => {
    await pool.end();
    console.log('[server] Closed HTTP server and database pool');
    process.exit(0);
  });

  // Force exit if something hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
