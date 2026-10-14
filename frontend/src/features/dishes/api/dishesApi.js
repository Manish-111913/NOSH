import { http } from '@/api/httpClient.js';

/**
 * Backend endpoints for dishes.
 * Dish shape: { dishId, dishName, imageUrl, isPublished, version }
 */
export const dishesApi = {
  list: () => http.get('/dishes'),

  get: (dishId) => http.get(`/dishes/${encodeURIComponent(dishId)}`),

  // Throws ApiError: 400 (validation), 404 (unknown dish), 409 (VERSION_CONFLICT, data.currentDish = latest saved dish).
  update: (dishId, { dishName, isPublished, expectedVersion }) =>
    http.patch(`/dishes/${encodeURIComponent(dishId)}`, { dishName, isPublished, expectedVersion }),
};
