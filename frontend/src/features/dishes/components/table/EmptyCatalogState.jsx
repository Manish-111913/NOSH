import Icon from '@/components/ui/Icon.jsx';

export default function EmptyCatalogState({ onRefresh }) {
  return (
    <div className="p-12 text-center bg-white">
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3.5">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="5" strokeDasharray="2 2" strokeWidth="1.5" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-slate-900 tracking-tight">No dishes available</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
        There are currently no dish records in your restaurant catalogue database.
      </p>
      <div className="mt-5">
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors" onClick={onRefresh}>
          <Icon name="refresh" className="w-3.5 h-3.5" />
          <span>Refresh dishes</span>
        </button>
      </div>
    </div>
  );
}
