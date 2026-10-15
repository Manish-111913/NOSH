import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { countDishes, createTestApp, createTestPool, getDishRow, insertDish, resetDatabase } from '../helpers/testDb.js';

const pool = createTestPool();
const app = createTestApp(pool);

beforeAll(() => resetDatabase(pool));
beforeEach(() => resetDatabase(pool));
afterAll(() => pool.end());

const patchDish = (dishId, body) => request(app).patch(`/dishes/${dishId}`).send(body);

describe('GET /dishes', () => {
  it('returns every seeded dish with the five fields and version 1', async () => {
    const res = await request(app).get('/dishes');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
    for (const dish of res.body) {
      expect(Object.keys(dish).sort()).toEqual(['dishId', 'dishName', 'imageUrl', 'isPublished', 'version']);
      expect(typeof dish.dishId).toBe('string');
      expect(dish.version).toBe(1);
    }
    expect(res.body.find((d) => d.dishId === '1')).toEqual({
      dishId: '1',
      dishName: 'Jeera Rice',
      imageUrl: 'https://nosh-assignment.s3.ap-south-1.amazonaws.com/jeera-rice.jpg',
      isPublished: true,
      version: 1,
    });
  });

  it('returns an empty array when there are no dishes', async () => {
    await pool.query('TRUNCATE dishes');
    const res = await request(app).get('/dishes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /dishes/:dishId', () => {
  it('returns one dish', async () => {
    const res = await request(app).get('/dishes/2');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ dishId: '2', dishName: 'Paneer Tikka', version: 1 });
  });

  it('returns 404 for an unknown dish', async () => {
    const res = await request(app).get('/dishes/999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DISH_NOT_FOUND');
  });
});

describe('PATCH /dishes/:dishId — successful save', () => {
  it('saves the explicit values, increments the version and persists them', async () => {
    const res = await patchDish('1', { dishName: '  Paneer Curry  ', isPublished: false, expectedVersion: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      dishId: '1',
      dishName: 'Paneer Curry',
      imageUrl: 'https://nosh-assignment.s3.ap-south-1.amazonaws.com/jeera-rice.jpg',
      isPublished: false,
      version: 2,
    });
    expect(await getDishRow(pool, '1')).toEqual(res.body);
  });

  it('stores isPublished explicitly instead of toggling it', async () => {
    // Dish 1 is already published; sending true twice must keep it true.
    const first = await patchDish('1', { dishName: 'Jeera Rice', isPublished: true, expectedVersion: 1 });
    const second = await patchDish('1', { dishName: 'Jeera Rice', isPublished: true, expectedVersion: 2 });

    expect(first.body.isPublished).toBe(true);
    expect(second.body.isPublished).toBe(true);
    expect(second.body.version).toBe(3);
  });

  it('allows saving an unpublished dish with an empty name', async () => {
    const res = await patchDish('3', { dishName: '   ', isPublished: false, expectedVersion: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ dishName: '', isPublished: false, version: 2 });
  });

  it('does not change other dishes', async () => {
    await patchDish('1', { dishName: 'Changed', isPublished: true, expectedVersion: 1 });
    expect(await getDishRow(pool, '2')).toMatchObject({ dishName: 'Paneer Tikka', version: 1 });
  });
});

describe('PATCH /dishes/:dishId — publishing rules', () => {
  it.each(['', '    '])('rejects publishing with name %j and changes nothing', async (dishName) => {
    const before = await getDishRow(pool, '2');
    const res = await patchDish('2', { dishName, isPublished: true, expectedVersion: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('DISH_NAME_REQUIRED');
    expect(await getDishRow(pool, '2')).toEqual(before);
  });

  it.each([
    ['empty URL', ''],
    ['malformed URL', 'not a url'],
    ['unsupported scheme', 'ftp://example.com/dish.jpg'],
    ['missing hostname', 'http://'],
  ])('rejects publishing a dish whose stored image URL is a %s', async (_label, imageUrl) => {
    await insertDish(pool, { dishId: 'bad-image', dishName: 'Mystery Dish', imageUrl, isPublished: false });

    const res = await patchDish('bad-image', { dishName: 'Mystery Dish', isPublished: true, expectedVersion: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_IMAGE_URL');
    expect(await getDishRow(pool, 'bad-image')).toMatchObject({ isPublished: false, version: 1 });
  });

  it('still allows unpublishing a dish with an invalid image URL', async () => {
    await insertDish(pool, { dishId: 'bad-image', dishName: 'Mystery Dish', imageUrl: 'broken.jpg', isPublished: false });
    const res = await patchDish('bad-image', { dishName: 'Renamed', isPublished: false, expectedVersion: 1 });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(2);
  });

  it('accepts a well-formed URL without downloading it (host does not exist)', async () => {
    await insertDish(pool, { dishId: 'offline-image', dishName: 'Offline', imageUrl: 'https://no-such-host.invalid/dish.jpg' });
    const res = await patchDish('offline-image', { dishName: 'Offline', isPublished: true, expectedVersion: 1 });
    expect(res.status).toBe(200);
    expect(res.body.isPublished).toBe(true);
  });
});

describe('PATCH /dishes/:dishId — invalid input', () => {
  it.each([
    ['isPublished as a string', { dishName: 'A', isPublished: 'true', expectedVersion: 1 }],
    ['fractional version', { dishName: 'A', isPublished: true, expectedVersion: 1.5 }],
    ['zero version', { dishName: 'A', isPublished: true, expectedVersion: 0 }],
    ['negative version', { dishName: 'A', isPublished: true, expectedVersion: -1 }],
    ['string version', { dishName: 'A', isPublished: true, expectedVersion: '1' }],
    ['missing dishName', { isPublished: true, expectedVersion: 1 }],
    ['non-string dishName', { dishName: 123, isPublished: true, expectedVersion: 1 }],
    ['imageUrl change attempt', { dishName: 'A', isPublished: true, expectedVersion: 1, imageUrl: 'https://evil.example/x.jpg' }],
    ['version change attempt', { dishName: 'A', isPublished: true, expectedVersion: 1, version: 99 }],
  ])('rejects %s with 400 and changes nothing', async (_label, body) => {
    const before = await getDishRow(pool, '1');
    const res = await patchDish('1', body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
    expect(await getDishRow(pool, '1')).toEqual(before);
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app).patch('/dishes/1').set('Content-Type', 'application/json').send('{"dishName": "A",');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects a malformed dish identifier', async () => {
    const res = await patchDish('bad%20id', { dishName: 'A', isPublished: true, expectedVersion: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DISH_ID');
  });

  it('returns 404 for an unknown dish and does not create it', async () => {
    const res = await patchDish('999', { dishName: 'Ghost', isPublished: false, expectedVersion: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DISH_NOT_FOUND');
    expect(await getDishRow(pool, '999')).toBeNull();
    expect(await countDishes(pool)).toBe(5);
  });
});

describe('PATCH /dishes/:dishId — version conflict', () => {
  it('returns 409 with the latest saved dish and keeps the first save intact', async () => {
    // Tab A and tab B both loaded version 1. Tab A saves first.
    const tabA = await patchDish('4', { dishName: 'Hyderabadi Biryani', isPublished: true, expectedVersion: 1 });
    expect(tabA.status).toBe(200);
    expect(tabA.body.version).toBe(2);

    // Tab B saves its stale draft.
    const tabB = await patchDish('4', { dishName: 'Chicken Dum Biryani', isPublished: false, expectedVersion: 1 });

    expect(tabB.status).toBe(409);
    expect(tabB.body.error.code).toBe('VERSION_CONFLICT');
    expect(tabB.body.currentDish).toEqual(tabA.body);
    expect(await getDishRow(pool, '4')).toEqual(tabA.body);
  });

  it('checks the version before publishing rules (stale + invalid still returns 409)', async () => {
    await patchDish('5', { dishName: 'Alfredo', isPublished: true, expectedVersion: 1 });
    const res = await patchDish('5', { dishName: '', isPublished: true, expectedVersion: 1 });
    expect(res.status).toBe(409);
  });
});

describe('GET /', () => {
  it('lists the available endpoints', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.endpoints).toContain('PATCH /dishes/:dishId');
  });
});

describe('Unknown routes', () => {
  it('returns a JSON 404', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
