import { useCallback, useEffect, useState } from 'react';

// Drafts live in sessionStorage: they survive a page refresh but stay private to this browser tab,
// so two tabs editing the same dish keep independent drafts.
const STORAGE_KEY = 'nosh.dishDrafts.v1';

const isValidDraft = (draft) =>
  draft !== null &&
  typeof draft === 'object' &&
  typeof draft.dishName === 'string' &&
  typeof draft.isPublished === 'boolean' &&
  Number.isInteger(draft.baseVersion) &&
  draft.baseVersion >= 1;

function loadStoredDrafts() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '{}');
    return Object.fromEntries(Object.entries(stored).filter(([, draft]) => isValidDraft(draft)));
  } catch {
    return {};
  }
}

/**
 * Unsaved local edits, keyed by dishId: { dishName, isPublished, baseVersion }.
 * baseVersion is the saved version the edit started from; it is sent as expectedVersion on save.
 */
export function useDishDrafts() {
  const [drafts, setDrafts] = useState(loadStoredDrafts);

  useEffect(() => {
    try {
      if (Object.keys(drafts).length > 0) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable (private mode, quota). Drafts still work in memory.
    }
  }, [drafts]);

  const clearDraft = useCallback((dishId) => {
    setDrafts(({ [dishId]: _removed, ...rest }) => rest);
  }, []);

  // Records an edit. If the values match the saved dish again (and nothing newer was saved meanwhile), the draft is dropped.
  const updateDraft = useCallback((dish, values) => {
    setDrafts((prev) => {
      const baseVersion = prev[dish.dishId]?.baseVersion ?? dish.version;
      const matchesSaved =
        baseVersion === dish.version && values.dishName === dish.dishName && values.isPublished === dish.isPublished;

      if (matchesSaved) {
        const { [dish.dishId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [dish.dishId]: { dishName: values.dishName, isPublished: values.isPublished, baseVersion } };
    });
  }, []);

  return { drafts, updateDraft, clearDraft };
}
