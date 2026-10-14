import { HttpError } from '../utils/httpErrors.js';

// Error codes that mean "PostgreSQL is unreachable" rather than a bug in our code.
const DB_UNAVAILABLE_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '57P01', '57P03', '08000', '08001', '08003', '08006']);

function isDatabaseUnavailable(err) {
  return DB_UNAVAILABLE_CODES.has(err.code) || /timeout exceeded when trying to connect|Connection terminated/i.test(err.message ?? '');
}

function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

// Central error handler: every failed request ends here and gets the same JSON shape.
// Internal details (SQL, stack traces, connection strings) are logged, never sent to the client.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json(err.toResponseBody());
  }
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Request body is not valid JSON.');
  }
  if (err.type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  }
  if (isDatabaseUnavailable(err)) {
    console.error(`[error] ${req.method} ${req.originalUrl} - database unavailable: ${err.message}`);
    return sendError(res, 503, 'DATABASE_UNAVAILABLE', 'The database is temporarily unavailable. Please try again.');
  }

  console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong on the server.');
}
