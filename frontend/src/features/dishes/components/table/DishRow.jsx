import DishThumb from '../DishThumb.jsx';

export default function DishRow({ dish, draft, isEditing, onEdit }) {
  const hasNewerSavedVersion = Boolean(draft && draft.baseVersion < dish.version);

  return (
    <tr data-testid={`dish-row-${dish.dishId}`} className={`hover:bg-slate-50 transition-colors ${isEditing ? 'bg-blue-50/50' : ''}`}>
      <td className="py-3 px-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative flex items-center justify-center">
          <DishThumb src={dish.imageUrl} alt={dish.dishName} />
        </div>
        <div className="min-w-0">
          <div className={`font-semibold text-slate-900 truncate max-w-xs ${isEditing ? 'text-blue-900 font-bold' : ''}`}>
            {dish.dishName || <span className="italic font-normal text-slate-400">(no name)</span>}
          </div>
          {draft && (
            <span className="text-[10px] text-amber-700 font-medium">
              ● Unsaved local draft{hasNewerSavedVersion && ' · newer version saved on server'}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 font-mono text-slate-600 select-all">{dish.dishId}</td>
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
            dish.isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dish.isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span>{dish.isPublished ? 'Published' : 'Unpublished'}</span>
        </span>
      </td>
      <td className="py-3 px-4 font-mono text-slate-600 font-medium">v{dish.version}</td>
      <td className="py-3 px-4 text-right">
        <button
          className={`px-2.5 py-1 text-xs font-medium border rounded shadow-2xs transition-colors ${
            isEditing ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
          onClick={() => onEdit(dish.dishId)}
        >
          {isEditing ? 'Editing' : 'Edit'}
        </button>
      </td>
    </tr>
  );
}
