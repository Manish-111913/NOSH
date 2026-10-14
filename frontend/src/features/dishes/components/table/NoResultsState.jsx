import Icon from '@/components/ui/Icon.jsx';

export default function NoResultsState({ onClearFilters }) {
  return (
    <div className="p-12 text-center bg-white">
      <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <Icon name="search" className="w-7 h-7" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-bold text-slate-900">No matching dishes</h3>
      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
        Try another search term or clear the selected filters.
      </p>
      <div className="mt-4">
        <button
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          onClick={onClearFilters}
        >
          <Icon name="close" className="w-3.5 h-3.5 text-slate-500" />
          <span>Clear filters</span>
        </button>
      </div>
    </div>
  );
}
