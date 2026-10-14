import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { parseSeedDishes, readSeedFile, seedDishes } from '../../src/db/seed.js';
import { countDishes, createTestApp, createTestPool, getDishRow, resetDatabase } from '../helpers/testDb.js';

const pool = createTestPool();

beforeEach(() => resetDatabase(pool));
afterAll(() => pool.end());

describe('seed', () => {
  it('loads the official dataset with version 1 for every dish', async () => {
    const { rows } = await pool.query('SELECT dish_id, version FROM dishes ORDER BY dish_id');
    expect(rows.map((r) => r.dish_id)).toEqual(['1', '2', '3', '4', '5']);
    expect(rows.every((r) => r.version === 1)).toBe(true);
  });

  it('is idempotent: re-seeding neither duplicates dishes nor overwrites saved edits', async () => {
    const app = createTestApp(pool);
    const saved = await request(app)
      .patch('/dishes/1')
      .send({ dishName: 'Jeera Rice Deluxe', isPublished: false, expectedVersion: 1 });
    expect(saved.status).toBe(200);

    const result = await seedDishes(pool, await readSeedFile());

    expect(result).toEqual({ inserted: 0, skipped: 5 });
    expect(await countDishes(pool)).toBe(5);
    expect(await getDishRow(pool, '1')).toEqual(saved.body);
  });

  it('inserts only dishes that are missing', async () => {
    await pool.query("DELETE FROM dishes WHERE dish_id = '5'");
    const result = await seedDishes(pool, await readSeedFile());
    expect(result).toEqual({ inserted: 1, skipped: 4 });
    expect(await countDishes(pool)).toBe(5);
  });

  it('rejects invalid seed data before touching the database', () => {
    expect(() => parseSeedDishes({})).toThrow('JSON array');
    expect(() => parseSeedDishes([{ dishId: 1, dishName: 'A', imageUrl: 'x', isPublished: true }])).toThrow('dishId');
    expect(() => parseSeedDishes([{ dishId: '1', dishName: 'A', imageUrl: 'x', isPublished: 'yes' }])).toThrow('isPublished');
    expect(() =>
      parseSeedDishes([
        { dishId: '1', dishName: 'A', imageUrl: 'x', isPublished: true },
        { dishId: '1', dishName: 'B', imageUrl: 'y', isPublished: true },
      ])
    ).toThrow('duplicate');
  });
});

describe('persistence across a backend restart', () => {
  it('returns saved values after the app and its connection pool are recreated', async () => {
    // "Backend" #1 saves a change, then shuts down completely.
    const firstPool = createTestPool();
    const saved = await request(createTestApp(firstPool))
      .patch('/dishes/2')
      .send({ dishName: 'Paneer Tikka Special', isPublished: false, expectedVersion: 1 });
    expect(saved.status).toBe(200);
    await firstPool.end();

    // "Backend" #2 starts with a brand-new pool and reads the same data from PostgreSQL.
    const secondPool = createTestPool();
    try {
      const res = await request(createTestApp(secondPool)).get('/dishes/2');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ...saved.body, version: 2 });
    } finally {
      await secondPool.end();
    }
  });
});
