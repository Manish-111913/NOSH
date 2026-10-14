import { createApp } from '../../src/app.js';
import { runMigrations } from '../../src/db/migrate.js';
import { createPool } from '../../src/db/pool.js';
import { readSeedFile, seedDishes } from '../../src/db/seed.js';

const DEFAULT_TEST_DATABASE_URL = 'postgresql://nosh:nosh_local_password@localhost:54329/nosh_test';

export function getTestDatabaseUrl() {
  const url = process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL;
  const databaseName = new URL(url).pathname.slice(1);
  // Safety net: tests delete data, so never let them point at a real database.
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to run tests against "${databaseName}". TEST_DATABASE_URL must point to a database whose name ends with "_test".`);
  }
  return url;
}

export function createTestPool() {
  return createPool({ connectionString: getTestDatabaseUrl() });
}

export function createTestApp(pool) {
  return createApp({ pool, corsOrigins: ['http://localhost:5729'] });
}

/** Ensures the schema exists, empties the dishes table and loads the official seed file. */
export async function resetDatabase(pool) {
  await runMigrations(pool);
  await pool.query('TRUNCATE dishes');
  await seedDishes(pool, await readSeedFile());
}

/** Inserts an extra dish directly (used for records the official data does not contain, e.g. bad image URLs). */
export async function insertDish(pool, { dishId, dishName, imageUrl, isPublished = false, version = 1 }) {
  await pool.query(
    'INSERT INTO dishes (dish_id, dish_name, image_url, is_published, version) VALUES ($1, $2, $3, $4, $5)',
    [dishId, dishName, imageUrl, isPublished, version]
  );
}

/** Reads a dish straight from the database (bypassing the API). */
export async function getDishRow(pool, dishId) {
  const { rows } = await pool.query(
    'SELECT dish_id AS "dishId", dish_name AS "dishName", image_url AS "imageUrl", is_published AS "isPublished", version FROM dishes WHERE dish_id = $1',
    [dishId]
  );
  return rows[0] ?? null;
}

export async function countDishes(pool) {
  const { rows } = await pool.query('SELECT count(*)::int AS count FROM dishes');
  return rows[0].count;
}
