import Icon from '@/components/ui/Icon.jsx';
import DishThumb from '../DishThumb.jsx';

// Read-only summary of the saved dish record.
export default function DishIdentityCard({ dish }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Saved Record (Read-only)</span>
        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
          <Icon name="lock" className="w-3 h-3 text-slate-400" />
          Governed by OCC
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative flex items-center justify-center">
          <DishThumb src={dish.imageUrl} alt={dish.dishName || 'Dish thumbnail'} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-semibold text-slate-900 text-xs truncate">{dish.dishName || <span className="italic text-slate-400">(no name)</span>}</h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded select-all">{dish.dishId}</span>
            <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">v{dish.version}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                dish.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {dish.isPublished ? 'Published' : 'Unpublished'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5" title={dish.imageUrl}>
            Image: {dish.imageUrl || '(none)'}
          </p>
        </div>
      </div>
    </div>
  );
}
