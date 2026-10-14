import Icon from '@/components/ui/Icon.jsx';

export default function DishNotFoundState({ onBack }) {
  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-white">
      <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <Icon name="sad" className="w-7 h-7" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-bold text-slate-900">This dish could not be found</h3>
      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
        This dish could not be found. It may have been removed or is no longer available in the catalogue database.
      </p>
      <div className="mt-5">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm transition-colors" onClick={onBack}>
          <Icon name="arrowLeft" className="w-3.5 h-3.5" />
          <span>Back to dishes</span>
        </button>
      </div>
    </div>
  );
}
