import { MODE } from '../../constants.js';
import { useDishTableQuery } from '../../hooks/useDishTableQuery.js';
import DishTableToolbar from './DishTableToolbar.jsx';
import DishTableHead from './DishTableHead.jsx';
import DishRow from './DishRow.jsx';
import DishTableSkeleton from './DishTableSkeleton.jsx';
import EmptyCatalogState from './EmptyCatalogState.jsx';
import NoResultsState from './NoResultsState.jsx';
import TablePagination from './TablePagination.jsx';

export default function DishTable({ dishes, drafts, mode, connection, editingDishId, onEdit, onRefresh }) {
  const table = useDishTableQuery(dishes);

  const isNoMatches = mode === MODE.LIVE && table.totalItems === 0;
  const showTable = mode === MODE.LIVE && !isNoMatches;

  let summary;
  if (mode === MODE.ERROR) summary = 'Failed to load catalogue';
  else if (mode === MODE.LOADING) summary = 'Loading dish catalogue...';
  else if (mode === MODE.EMPTY) summary = '0 dishes registered';
  else if (isNoMatches) summary = `0 matches found (${dishes.length} total)`;
  else summary = table.rangeText;

  return (
    <section aria-label="Dish Catalogue" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <DishTableToolbar
        query={table.query}
        statusFilter={table.statusFilter}
        disabled={mode === MODE.LOADING || mode === MODE.ERROR}
        connection={connection}
        summary={summary}
        onSearch={table.setQuery}
        onClearSearch={table.clearQuery}
        onStatusFilterChange={table.setStatusFilter}
      />

      {showTable && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <DishTableHead sort={table.sort} onSort={table.toggleSort} />
            <tbody className="divide-y divide-slate-100 bg-white">
              {table.rows.map((dish) => (
                <DishRow key={dish.dishId} dish={dish} draft={drafts[dish.dishId]} isEditing={editingDishId === dish.dishId} onEdit={onEdit} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode === MODE.LOADING && <DishTableSkeleton />}
      {mode === MODE.EMPTY && <EmptyCatalogState onRefresh={onRefresh} />}
      {isNoMatches && <NoResultsState onClearFilters={table.clearFilters} />}

      {showTable && (
        <TablePagination
          page={table.page}
          totalPages={table.totalPages}
          rowsPerPage={table.rowsPerPage}
          rangeText={table.rangeText}
          onRowsPerPageChange={table.setRowsPerPage}
          onPageChange={table.goToPage}
        />
      )}
    </section>
  );
}
