import Icon from '@/components/ui/Icon.jsx';
import { CONNECTION } from '@/constants/connection.js';

const CONNECTION_STYLES = {
  [CONNECTION.CONNECTED]: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70',
    dot: 'bg-emerald-500',
  },
  [CONNECTION.CHECKING]: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    dot: 'bg-amber-500 animate-ping',
  },
  [CONNECTION.DISCONNECTED]: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    dot: 'bg-rose-500',
  },
};

// `connection` reflects the outcome of the latest real API request.
export default function Header({ connection, isRefreshing, onRefresh }) {
  const conn = CONNECTION_STYLES[connection];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Brand Wordmark & Ops Tag */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tight">
          <Icon name="plus" className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-slate-900 tracking-tight text-base">nosh</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">OPS</span>
        </div>
      </div>

      {/* Header Actions: Connectivity Badge, Refresh, Help */}
      <div className="flex items-center gap-3">
        <button
          data-testid="connection-status"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors focus:outline-none ${conn.badge}`}
          title="Server connection status. Click to check again."
          onClick={onRefresh}
        >
          <span className={`w-2 h-2 rounded-full ${conn.dot}`} />
          <span>{connection}</span>
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <button
          aria-label="Reload dish data"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none transition-colors"
          title="Reload dish records from server"
          onClick={onRefresh}
        >
          <Icon name="refresh" className={`w-4 h-4 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        <div className="relative group">
          <button aria-label="Help information" className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg focus:outline-none transition-colors">
            <Icon name="info" />
          </button>
          <div className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 leading-relaxed">
            <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Nosh Enterprise Operations
            </div>
            Dish catalogue management with Optimistic Concurrency Control (OCC). Edits stay as local drafts until you save; the list refreshes
            automatically every few seconds.
          </div>
        </div>
      </div>
    </header>
  );
}
