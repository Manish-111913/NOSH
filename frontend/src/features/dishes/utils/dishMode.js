import { MODE } from '../constants.js';

// Maps the data-loading status from useDishes() to a dashboard mode.
export function getDishesMode(status, dishes) {
  if (status === 'loading') return MODE.LOADING;
  if (status === 'error') return MODE.ERROR;
  if (dishes.length === 0) return MODE.EMPTY;
  return MODE.LIVE;
}
