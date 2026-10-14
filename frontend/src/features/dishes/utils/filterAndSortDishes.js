import { STATUS_FILTER } from '../constants.js';

export function filterAndSortDishes(dishes, { query, statusFilter, sort }) {
  const q = query.trim().toLowerCase();

  const filtered = dishes.filter((d) => {
    if (statusFilter === STATUS_FILTER.PUBLISHED && !d.isPublished) return false;
    if (statusFilter === STATUS_FILTER.UNPUBLISHED && d.isPublished) return false;
    if (q !== '') return d.dishName.toLowerCase().includes(q) || d.dishId.toLowerCase().includes(q);
    return true;
  });

  return filtered.sort((a, b) => {
    let fieldA = a[sort.field];
    let fieldB = b[sort.field];
    if (typeof fieldA === 'string') fieldA = fieldA.toLowerCase();
    if (typeof fieldB === 'string') fieldB = fieldB.toLowerCase();
    if (fieldA < fieldB) return sort.direction === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}
