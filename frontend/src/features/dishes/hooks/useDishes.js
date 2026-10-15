import { useCallback, useEffect, useRef, useState } from 'react';
import { CONNECTION } from '@/constants/connection.js';
import { dishesApi } from '../api/dishesApi.js';
import { POLL_INTERVAL_MS } from '../constants.js';

// Failures that mean "server unreachable", as opposed to the server answering with an error.
// DATABASE_BUSY (a timeout) is a 503 too, but the server is reachable, so it doesn't count.
const isConnectionFailure = (err) =>
  err.status === 0 || ((err.status === 502 || err.status === 503 || err.status === 504) && err.code !== 'DATABASE_BUSY');

/**
 * Saved dish records from the backend (never drafts).
 *   status: 'loading' (first load) | 'success' | 'error' (nothing could be loaded)
 * Re-fetches every POLL_INTERVAL_MS while the tab is visible, so changes saved elsewhere appear automatically.
 */
export function useDishes() {
  const [dishes, setDishes] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connection, setConnection] = useState(CONNECTION.CHECKING);

  // Each list request gets an id; only the newest response may update state, so slow responses never overwrite newer data.
  const latestListRequest = useRef(0);
  const pollInFlight = useRef(false);

  const trackConnection = useCallback((err) => {
    setConnection(err && isConnectionFailure(err) ? CONNECTION.DISCONNECTED : CONNECTION.CONNECTED);
  }, []);

  const loadDishes = useCallback(
    async (reason) => {
      const requestId = ++latestListRequest.current;
      if (reason === 'refresh') setIsRefreshing(true);

      try {
        const data = await dishesApi.list();
        trackConnection(null);
        if (requestId === latestListRequest.current) {
          setDishes(data);
          setStatus('success');
          setLoadError(null);
        }
        return { ok: true };
      } catch (err) {
        trackConnection(err);
        if (requestId === latestListRequest.current) {
          // Keep already-loaded dishes on screen; show the full error state only if nothing was ever loaded.
          setStatus((prev) => (prev === 'success' ? prev : 'error'));
          setLoadError(err);
        }
        return { ok: false, error: err };
      } finally {
        if (reason === 'refresh') setIsRefreshing(false);
      }
    },
    [trackConnection]
  );

  // Initial load + polling. Timers and listeners are removed when the page unmounts.
  useEffect(() => {
    loadDishes('initial');

    async function poll() {
      if (document.visibilityState !== 'visible' || pollInFlight.current) return;
      pollInFlight.current = true;
      await loadDishes('poll');
      pollInFlight.current = false;
    }

    const timer = setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', poll);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
      latestListRequest.current++; // ignore responses that arrive after unmount
    };
  }, [loadDishes]);

  // Puts one saved record into the list (after a save, a reload, or a 409 response).
  const replaceDish = useCallback((dish) => {
    latestListRequest.current++; // a list request already in flight may be older than this record
    setDishes((prev) => prev.map((d) => (d.dishId === dish.dishId ? dish : d)));
  }, []);

  const saveDish = useCallback(
    async (dishId, changes) => {
      try {
        const saved = await dishesApi.update(dishId, changes);
        trackConnection(null);
        replaceDish(saved);
        return saved;
      } catch (err) {
        trackConnection(err);
        throw err;
      }
    },
    [replaceDish, trackConnection]
  );

  const fetchDish = useCallback(
    async (dishId) => {
      try {
        const latest = await dishesApi.get(dishId);
        trackConnection(null);
        replaceDish(latest);
        return latest;
      } catch (err) {
        trackConnection(err);
        throw err;
      }
    },
    [replaceDish, trackConnection]
  );

  const refresh = useCallback(() => loadDishes('refresh'), [loadDishes]);

  return { dishes, status, loadError, isRefreshing, connection, refresh, saveDish, fetchDish, replaceDish };
}
