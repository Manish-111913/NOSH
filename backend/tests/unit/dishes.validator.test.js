import { describe, expect, it } from 'vitest';
import { isValidDishId, parseDishId, parseUpdateDishBody } from '../../src/validators/dishes.validator.js';

const validBody = { dishName: 'Paneer Curry', isPublished: true, expectedVersion: 1 };

function expectValidationError(body, field) {
  try {
    parseUpdateDishBody(body);
  } catch (err) {
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    if (field) expect(err.details.map((d) => d.field)).toContain(field);
    return;
  }
  throw new Error('Expected a validation error');
}

describe('parseUpdateDishBody', () => {
  it('accepts a valid body and trims the name', () => {
    expect(parseUpdateDishBody({ ...validBody, dishName: '  Paneer Curry  ' })).toEqual(validBody);
  });

  it('allows an empty name when the dish is unpublished', () => {
    expect(parseUpdateDishBody({ dishName: '   ', isPublished: false, expectedVersion: 3 })).toEqual({
      dishName: '',
      isPublished: false,
      expectedVersion: 3,
    });
  });

  it('rejects a body that is not an object', () => {
    expectValidationError(undefined, 'body');
    expectValidationError(null, 'body');
    expectValidationError([validBody], 'body');
    expectValidationError('text', 'body');
  });

  it.each(['dishName', 'isPublished', 'expectedVersion'])('rejects a missing %s', (field) => {
    const body = { ...validBody };
    delete body[field];
    expectValidationError(body, field);
  });

  it('rejects a non-string dishName', () => {
    expectValidationError({ ...validBody, dishName: 42 }, 'dishName');
    expectValidationError({ ...validBody, dishName: null }, 'dishName');
  });

  it('rejects a dishName longer than 80 characters', () => {
    expectValidationError({ ...validBody, dishName: 'x'.repeat(81) }, 'dishName');
  });

  it('does not coerce isPublished', () => {
    expectValidationError({ ...validBody, isPublished: 'true' }, 'isPublished');
    expectValidationError({ ...validBody, isPublished: 1 }, 'isPublished');
    expectValidationError({ ...validBody, isPublished: null }, 'isPublished');
  });

  it.each([0, -1, 1.5, '1', null, Number.NaN, 2 ** 31])('rejects expectedVersion = %s', (expectedVersion) => {
    expectValidationError({ ...validBody, expectedVersion }, 'expectedVersion');
  });

  it.each(['imageUrl', 'version', 'dishId'])('rejects attempts to set %s', (field) => {
    expectValidationError({ ...validBody, [field]: 'anything' }, field);
  });
});

describe('dishId validation', () => {
  it('accepts the identifier format used by the seed data', () => {
    expect(isValidDishId('1')).toBe(true);
    expect(isValidDishId('dish_42-a')).toBe(true);
    expect(parseDishId('5')).toBe('5');
  });

  it('rejects malformed identifiers', () => {
    for (const id of ['', ' ', '1 2', '../etc', 'a'.repeat(65), 1, null]) {
      expect(isValidDishId(id)).toBe(false);
    }
    expect(() => parseDishId('bad id')).toThrow(expect.objectContaining({ status: 400, code: 'INVALID_DISH_ID' }));
  });
});
