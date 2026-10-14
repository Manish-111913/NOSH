import Icon from '@/components/ui/Icon.jsx';

export default function PageHeading({ isRefreshing, onRefresh }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dishes</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage dish information, publication status, and saved versions.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
          onClick={onRefresh}
        >
          <Icon name="refresh" className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh dishes</span>
        </button>
      </div>
    </div>
  );
}
