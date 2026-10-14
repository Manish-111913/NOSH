// Central place for frontend configuration (see frontend/.env.example).

// Backend base URL, e.g. http://localhost:4729 locally or https://<service>.onrender.com in production.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4729').replace(/\/+$/, '');

// Requests slower than this are reported as a timeout instead of hanging forever.
export const REQUEST_TIMEOUT_MS = 15_000;
