import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isValidDishId } from '../validators/dishes.validator.js';
import { withTransaction } from './transaction.js';

// The dataset supplied with the assignment.
export const DEFAULT_SEED_FILE = fileURLToPath(new URL('../../db/seed/dishes.json', import.meta.url));

/**
 * Validates the raw seed JSON and maps it to the dish model.
 * Throws a descriptive error for the first invalid record.
 */
export function parseSeedDishes(raw) {
  if (!Array.isArray(raw)) {
    throw new Error('Seed data must be a JSON array of dishes.');
  }

  const seenIds = new Set();

  return raw.map((record, index) => {
    const label = `Seed record #${index + 1}`;

    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`${label} must be an object.`);
    }

    const { dishId, dishName, imageUrl, isPublished } = record;

    if (!isValidDishId(dishId)) {
      throw new Error(`${label}: "dishId" must be a string of 1-64 letters, digits, "-" or "_".`);
    }
    if (seenIds.has(dishId)) {
      throw new Error(`${label}: duplicate dishId "${dishId}".`);
    }
    if (typeof dishName !== 'string') throw new Error(`${label}: "dishName" must be a string.`);
    if (typeof imageUrl !== 'string') throw new Error(`${label}: "imageUrl" must be a string.`);
    if (typeof isPublished !== 'boolean') throw new Error(`${label}: "isPublished" must be a boolean.`);

    seenIds.add(dishId);
    return { dishId, dishName, imageUrl, isPublished };
  });
}

export async function readSeedFile(filePath = DEFAULT_SEED_FILE) {
  const text = await readFile(filePath, 'utf8');
  return parseSeedDishes(JSON.parse(text));
}

/**
 * Inserts dishes that do not exist yet. Existing rows are never touched,
 * so re-running the seed keeps saved edits and versions (ON CONFLICT DO NOTHING).
 */
export async function seedDishes(pool, dishes) {
  return withTransaction(pool, async (client) => {
    let inserted = 0;

    for (const dish of dishes) {
      const result = await client.query(
        `INSERT INTO dishes (dish_id, dish_name, image_url, is_published, version)
         VALUES ($1, $2, $3, $4, 1)
         ON CONFLICT (dish_id) DO NOTHING`,
        [dish.dishId, dish.dishName, dish.imageUrl, dish.isPublished]
      );
      inserted += result.rowCount;
    }

    return { inserted, skipped: dishes.length - inserted };
  });
}
