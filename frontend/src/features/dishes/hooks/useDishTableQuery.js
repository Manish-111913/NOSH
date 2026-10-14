import { useMemo, useState } from 'react';
import { DEFAULT_ROWS_PER_PAGE, STATUS_FILTER } from '../constants.js';
import { filterAndSortDishes } from '../utils/filterAndSortDishes.js';

// Search, status filter, sorting and pagination for the dish table.
export function useDishTableQuery(dishes) {
  const [query, setQueryValue] = useState('');
  const [statusFilter, setStatusFilterValue] = useState(STATUS_FILTER.ALL);
  const [sort, setSort] = useState({ field: 'dishName', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPageValue] = useState(DEFAULT_ROWS_PER_PAGE);

  const filtered = useMemo(() => filterAndSortDishes(dishes, { query, statusFilter, sort }), [dishes, query, statusFilter, sort]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  return {
    query,
    statusFilter,
    sort,
    rowsPerPage,
    page,
    totalPages,
    totalItems,
    rangeText: `Showing ${startIndex + 1}–${endIndex} of ${totalItems} dishes`,
    rows: filtered.slice(startIndex, endIndex),

    setQuery(value) {
      setQueryValue(value);
      setCurrentPage(1);
    },
    clearQuery() {
      setQueryValue('');
    },
    setStatusFilter(value) {
      setStatusFilterValue(value);
      setCurrentPage(1);
    },
    clearFilters() {
      setQueryValue('');
      setStatusFilterValue(STATUS_FILTER.ALL);
    },
    toggleSort(field) {
      setSort((s) => (s.field === field ? { field, direction: s.direction === 'asc' ? 'desc' : 'asc' } : { field, direction: 'asc' }));
    },
    setRowsPerPage(value) {
      setRowsPerPageValue(value);
      setCurrentPage(1);
    },
    goToPage: setCurrentPage,
  };
}
