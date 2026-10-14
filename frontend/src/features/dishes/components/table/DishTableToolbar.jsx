import Icon from '@/components/ui/Icon.jsx';
import { CONNECTION } from '@/constants/connection.js';
import { POLL_INTERVAL_MS, STATUS_FILTER } from '../../constants.js';

const SYNC_STATUS = {
  [CONNECTION.CONNECTED]: { dot: 'bg-emerald-500', label: `Synced · auto-refresh ${POLL_INTERVAL_MS / 1000}s` },
  [CONNECTION.CHECKING]: { dot: 'bg-amber-500', label: 'Connecting to server...' },
  [CONNECTION.DISCONNECTED]: { dot: 'bg-rose-500', label: 'Server disconnected' },
};

export default function DishTableToolbar({ query, statusFilter, disabled, connection, summary, onSearch, onClearSearch, onStatusFilterChange }) {
  const sync = SYNC_STATUS[connection];

  return (
    <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-1 max-w-xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon name="search" />
          </div>
          <input
            aria-label="Search dishes"
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-colors disabled:opacity-50 disabled:bg-slate-100"
            placeholder="Search by dish name or ID..."
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => onSearch(e.target.value)}
          />
          {query.length > 0 && (
            <button className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600" title="Clear search" onClick={onClearSearch}>
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          aria-label="Filter by publication status"
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-slate-700 font-medium focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
          value={statusFilter}
          disabled={disabled}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value={STATUS_FILTER.ALL}>All statuses</option>
          <option value={STATUS_FILTER.PUBLISHED}>Published</option>
          <option value={STATUS_FILTER.UNPUBLISHED}>Unpublished</option>
        </select>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
        <span className="font-medium text-slate-600" data-testid="results-summary">
          {summary}
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${sync.dot}`} />
          <span>{sync.label}</span>
        </span>
      </div>
    </div>
  );
}
