import Icon from '@/components/ui/Icon.jsx';

export default function DrawerHeader({ dish, hasDraft, onClose }) {
  return (
    <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between bg-white shrink-0">
      <div className="space-y-1 min-w-0 pr-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Edit dish</h2>
          {hasDraft ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Saved on server</span>
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">Update dish details and publication settings.</p>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 select-all">dishId: {dish.dishId}</span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-slate-500 font-mono">Saved: v{dish.version}</span>
        </div>
      </div>
      <button
        aria-label="Close edit drawer"
        title="Close (your draft is kept)"
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
    </div>
  );
}
