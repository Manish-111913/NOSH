import dotenv from 'dotenv';

// Loads backend/.env when present. Real environment variables (e.g. on Render) take priority.
dotenv.config({ quiet: true });

function readRequired(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable ${name}. Copy backend/.env.example to backend/.env.`);
  }
  return value.trim();
}

function readPort(value, fallback) {
  const port = Number(value ?? fallback);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }
  return port;
}

function readList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: readPort(process.env.PORT, 4729),
  databaseUrl: readRequired('DATABASE_URL'),
  // Set to "true" when the database requires SSL (e.g. Render's *external* connection string).
  databaseSsl: process.env.DATABASE_SSL === 'true',
  // Comma-separated list of frontend origins allowed to call the API.
  corsOrigins: readList(process.env.CORS_ORIGINS || 'http://localhost:5729'),
});
