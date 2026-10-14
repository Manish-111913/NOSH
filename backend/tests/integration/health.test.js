import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createPool } from '../../src/db/pool.js';
import { createTestApp, createTestPool } from '../helpers/testDb.js';

const pool = createTestPool();
afterAll(() => pool.end());

describe('GET /health', () => {
  it('reports the database as up', async () => {
    const res = await request(createTestApp(pool)).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });
});

describe('when the database is unreachable', () => {
  // Port 1 has nothing listening, so every query fails to connect.
  const deadPool = createPool({ connectionString: 'postgresql://nosh:nosh@127.0.0.1:1/nosh_test' });
  const app = createApp({ pool: deadPool });
  afterAll(() => deadPool.end());

  it('GET /health returns 503', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.database).toBe('down');
  });

  it('GET /dishes returns 503 without leaking internals', async () => {
    const res = await request(app).get('/dishes');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: { code: 'DATABASE_UNAVAILABLE', message: 'The database is temporarily unavailable. Please try again.' },
    });
  });

  it('PATCH /dishes/:id returns 503', async () => {
    const res = await request(app).patch('/dishes/1').send({ dishName: 'A', isPublished: true, expectedVersion: 1 });
    expect(res.status).toBe(503);
  });
});

describe('CORS', () => {
  it('allows the configured frontend origin', async () => {
    const res = await request(createTestApp(pool)).get('/health').set('Origin', 'http://localhost:5729');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5729');
  });

  it('does not allow other origins', async () => {
    const res = await request(createTestApp(pool)).get('/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
