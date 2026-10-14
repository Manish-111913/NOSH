import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/config/env.js';

/**
 * Error thrown for every failed request.
 *   status: HTTP status, or 0 when the server could not be reached / timed out
 *   code:   backend error code (e.g. VERSION_CONFLICT), or NETWORK_ERROR / TIMEOUT
 *   data:   the full JSON error body (e.g. { error, currentDish } for a 409)
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const timedOut = err.name === 'AbortError';
    throw new ApiError(
      timedOut ? 'The server took too long to respond.' : 'Unable to reach the server. Check your connection and try again.',
      { status: 0, code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR' }
    );
  } finally {
    clearTimeout(timer);
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.error?.message || `Request failed with status ${response.status}.`, {
      status: response.status,
      code: payload?.error?.code || 'HTTP_ERROR',
      details: payload?.error?.details,
      data: payload,
    });
  }

  return payload;
}

export const http = {
  get: (path) => request(path),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
};
