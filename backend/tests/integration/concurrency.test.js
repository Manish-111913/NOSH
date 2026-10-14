import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, createTestPool, getDishRow, resetDatabase } from '../helpers/testDb.js';

// These tests run against real PostgreSQL to prove the row lock makes check-and-update atomic.
const pool = createTestPool();
const app = createTestApp(pool);

beforeEach(() => resetDatabase(pool));
afterAll(() => pool.end());

describe('concurrent PATCH requests with the same expectedVersion', () => {
  it('lets exactly one of two simultaneous saves win; the other gets 409', async () => {
    const [first, second] = await Promise.all([
      request(app).patch('/dishes/2').send({ dishName: 'Paneer Tikka Masala', isPublished: true, expectedVersion: 1 }),
      request(app).patch('/dishes/2').send({ dishName: 'Malai Paneer Tikka', isPublished: false, expectedVersion: 1 }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = first.status === 200 ? first : second;
    const loser = first.status === 200 ? second : first;

    // Version moved forward exactly once and the stored row is exactly the winner's request (no mixing).
    const stored = await getDishRow(pool, '2');
    expect(stored).toEqual(winner.body);
    expect(stored.version).toBe(2);
    expect(loser.body.currentDish).toEqual(winner.body);
  });

  it('keeps the version consistent under 20 simultaneous saves', async () => {
    const responses = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        request(app).patch('/dishes/3').send({ dishName: `Rabdi #${i}`, isPublished: i % 2 === 0, expectedVersion: 1 })
      )
    );

    const succeeded = responses.filter((r) => r.status === 200);
    const conflicted = responses.filter((r) => r.status === 409);

    expect(succeeded).toHaveLength(1);
    expect(conflicted).toHaveLength(19);
    expect(await getDishRow(pool, '3')).toEqual(succeeded[0].body);
  });
});
