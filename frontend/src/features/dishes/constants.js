// What the dashboard is currently showing.
export const MODE = {
  LIVE: 'live',
  LOADING: 'loading',
  EMPTY: 'empty-db',
  ERROR: 'backend-error',
};

export const STATUS_FILTER = {
  ALL: 'ALL',
  PUBLISHED: 'PUBLISHED',
  UNPUBLISHED: 'UNPUBLISHED',
};

// Must match MAX_DISH_NAME_LENGTH in backend/src/validators/dishes.validator.js.
export const MAX_DISH_NAME_LENGTH = 80;

export const ROWS_PER_PAGE_OPTIONS = [5, 10, 20];
export const DEFAULT_ROWS_PER_PAGE = 10;

// How often the dashboard re-fetches dishes to pick up changes saved elsewhere.
export const POLL_INTERVAL_MS = 5_000;
