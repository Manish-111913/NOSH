import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createPool } from '../../src/db/pool.js';
import { createTestApp, getDishRow, getTestDatabaseUrl, resetDatabase } from '../helpers/testDb.js';

// Short timeouts so the tests run quickly; production uses the defaults in db/pool.js.
const pool = createPool({ connectionString: getTestDatabaseUrl(), lockTimeoutMs: 500, idleInTransactionTimeoutMs: 1_000 });
const app = createTestApp(pool);

beforeEach(() => resetDatabase(pool));
afterAll(() => pool.end());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const validSave = { dishName: 'Jeera Rice', isPublished: true, expectedVersion: 1 };

// Opens a separate connection that locks one dish row and keeps the transaction open.
async function lockRow(dishId, clientOptions = {}) {
  const client = new pg.Client({ connectionString: getTestDatabaseUrl(), ...clientOptions });
  client.on('error', () => {}); // Postgres may end this session on purpose
  await client.connect();
  await client.query('BEGIN');
  await client.query('SELECT 1 FROM dishes WHERE dish_id = $1 FOR UPDATE', [dishId]);
  return client;
}

describe('database timeouts', () => {
  it('uses safe defaults: 5 s lock wait, 10 s idle transaction, 10 s per statement', async () => {
    const defaults = createPool({ connectionString: getTestDatabaseUrl() });
    try {
      const show = async (name) => (await defaults.query(`SHOW ${name}`)).rows[0][name];
      expect(await show('lock_timeout')).toBe('5s');
      expect(await show('idle_in_transaction_session_timeout')).toBe('10s');
      expect(await show('statement_timeout')).toBe('10s');
    } finally {
      await defaults.end();
    }
  });

  it('a save stuck behind a locked row fails fast with 503 DATABASE_BUSY and changes nothing', async () => {
    const blocker = await lockRow('1');
    try {
      const started = Date.now();
      const res = await request(app).patch('/dishes/1').send(validSave);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_BUSY');
      expect(Date.now() - started).toBeLessThan(3_000);
    } finally {
      await blocker.query('ROLLBACK');
      await blocker.end();
    }

    expect(await getDishRow(pool, '1')).toMatchObject({ version: 1 });
    const retry = await request(app).patch('/dishes/1').send(validSave);
    expect(retry.status).toBe(200);
    expect(retry.body.version).toBe(2);
  });

  it('a transaction left hanging is ended by Postgres, so its lock is released', async () => {
    // Simulates an app that locked the row and then froze without committing.
    const hung = await lockRow('2', { idle_in_transaction_session_timeout: 1_000 });
    await sleep(1_500);

    const res = await request(app).patch('/dishes/2').send({ dishName: 'Paneer Tikka', isPublished: true, expectedVersion: 1 });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(2);

    await hung.end().catch(() => {});
  });
});
