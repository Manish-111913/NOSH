import { Router } from 'express';

// GET /health -> 200 when the API and database are reachable, 503 when the database is down.
export function createHealthRouter(pool) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });

  return router;
}
