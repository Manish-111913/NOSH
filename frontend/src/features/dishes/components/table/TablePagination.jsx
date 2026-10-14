import { ROWS_PER_PAGE_OPTIONS } from '../../constants.js';

const PAGE_BUTTON =
  'px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs';

export default function TablePagination({ page, totalPages, rowsPerPage, rangeText, onRowsPerPageChange, onPageChange }) {
  return (
    <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <span className="text-slate-500">Rows per page:</span>
        <select
          className="bg-white border border-slate-200 rounded-md pl-2 pr-7 py-1 text-xs text-slate-700 font-medium focus:outline-none"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        >
          {ROWS_PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-slate-400">|</span>
        <span className="text-slate-600 font-medium">{rangeText}</span>
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button className={PAGE_BUTTON} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <span className="px-2 py-1 text-slate-500 text-[11px] font-mono">
          Page {page} of {totalPages}
        </span>
        <button className={PAGE_BUTTON} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
