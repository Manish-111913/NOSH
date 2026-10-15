import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { requestLogger } from './middleware/requestLogger.js';
import { createDishesRouter } from './routes/dishes.routes.js';
import { createHealthRouter } from './routes/health.routes.js';

/**
 * Builds the Express app. The database pool is passed in (not imported),
 * so tests can create an app against the test database.
 */
export function createApp({ pool, corsOrigins = [], logRequests = false }) {
  const app = express();

  app.disable('x-powered-by');
  if (logRequests) app.use(requestLogger);

  app.use(cors({ origin: corsOrigins, methods: ['GET', 'PATCH'], allowedHeaders: ['Content-Type'] }));
  app.use(express.json({ limit: '10kb' }));

  // Small index so opening the API's base URL in a browser shows what's available.
  app.get('/', (req, res) => {
    res.json({
      name: 'Nosh Dish API',
      endpoints: ['GET /dishes', 'GET /dishes/:dishId', 'PATCH /dishes/:dishId', 'GET /health'],
    });
  });
  app.use('/health', createHealthRouter(pool));
  app.use('/dishes', createDishesRouter(pool));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
