import { badRequest } from '../utils/httpErrors.js';

export const MAX_DISH_NAME_LENGTH = 80;
const MAX_VERSION = 2_147_483_647; // PostgreSQL INTEGER upper bound

// Supplied IDs are short strings such as "1". Allow letters, digits, "-" and "_" (max 64 chars).
const DISH_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const UPDATE_FIELDS = ['dishName', 'isPublished', 'expectedVersion'];

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function isValidDishId(value) {
  return typeof value === 'string' && DISH_ID_PATTERN.test(value);
}

export function parseDishId(value) {
  if (!isValidDishId(value)) {
    throw badRequest('INVALID_DISH_ID', 'dishId must be 1-64 characters long and contain only letters, digits, "-" or "_".');
  }
  return value;
}

/**
 * Validates the PATCH /dishes/:dishId body. Types are checked strictly (no coercion),
 * so "true" or "1" are rejected. Returns the cleaned values with a trimmed dishName.
 */
export function parseUpdateDishBody(body) {
  if (!isPlainObject(body)) {
    throw validationError([{ field: 'body', message: 'Request body must be a JSON object.' }]);
  }

  const errors = [];

  for (const field of Object.keys(body)) {
    if (!UPDATE_FIELDS.includes(field)) {
      errors.push({ field, message: `"${field}" is not allowed. Only dishName, isPublished and expectedVersion can be sent.` });
    }
  }

  if (!('dishName' in body)) {
    errors.push({ field: 'dishName', message: '"dishName" is required.' });
  } else if (typeof body.dishName !== 'string') {
    errors.push({ field: 'dishName', message: '"dishName" must be a string.' });
  } else if (body.dishName.trim().length > MAX_DISH_NAME_LENGTH) {
    errors.push({ field: 'dishName', message: `"dishName" must be at most ${MAX_DISH_NAME_LENGTH} characters.` });
  }

  if (!('isPublished' in body)) {
    errors.push({ field: 'isPublished', message: '"isPublished" is required.' });
  } else if (typeof body.isPublished !== 'boolean') {
    errors.push({ field: 'isPublished', message: '"isPublished" must be a boolean (true or false).' });
  }

  if (!('expectedVersion' in body)) {
    errors.push({ field: 'expectedVersion', message: '"expectedVersion" is required.' });
  } else if (!Number.isInteger(body.expectedVersion) || body.expectedVersion < 1 || body.expectedVersion > MAX_VERSION) {
    errors.push({ field: 'expectedVersion', message: '"expectedVersion" must be a positive integer.' });
  }

  if (errors.length > 0) throw validationError(errors);

  return {
    dishName: body.dishName.trim(),
    isPublished: body.isPublished,
    expectedVersion: body.expectedVersion,
  };
}

function validationError(details) {
  return badRequest('VALIDATION_ERROR', details.map((d) => d.message).join(' '), { details });
}
