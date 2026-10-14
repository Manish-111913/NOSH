/**
 * True when the value parses as an absolute http:// or https:// URL with a hostname.
 * Only the format is checked; the image is never downloaded.
 */
export function isValidImageUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;

  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
}
