import { describe, expect, it } from 'vitest';
import { isValidImageUrl } from '../../src/utils/imageUrl.js';

describe('isValidImageUrl', () => {
  it.each([
    'https://nosh-assignment.s3.ap-south-1.amazonaws.com/jeera-rice.jpg',
    'http://example.com/dish.png',
    'https://localhost:8080/a.jpg',
  ])('accepts %s', (url) => {
    expect(isValidImageUrl(url)).toBe(true);
  });

  it.each([
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['blank', '   '],
    ['relative path', 'images/dish.jpg'],
    ['malformed', 'https//broken'],
    ['ftp scheme', 'ftp://example.com/dish.jpg'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['data URI', 'data:image/png;base64,AAAA'],
    ['no hostname', 'http://'],
    ['file URL', 'file:///etc/passwd'],
  ])('rejects %s', (_label, url) => {
    expect(isValidImageUrl(url)).toBe(false);
  });
});
