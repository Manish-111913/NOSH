// Early (client-side) checks that mirror the backend rules. The backend stays authoritative.

export function isValidImageUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
  } catch {
    return false;
  }
}

/** Reasons the form cannot be saved as published. */
export function getPublishProblems(form, dish) {
  return {
    nameMissing: form.isPublished && form.dishName.trim().length === 0,
    invalidImageUrl: form.isPublished && !isValidImageUrl(dish.imageUrl),
  };
}
