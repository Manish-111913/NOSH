import Icon from '@/components/ui/Icon.jsx';
import { MAX_DISH_NAME_LENGTH } from '../../constants.js';

const PUBLICATION_OPTIONS = [
  {
    value: true,
    label: 'Published',
    description: 'Active and visible to customers on digital menus.',
    dot: 'bg-emerald-500',
    card: 'has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/30 has-[:checked]:ring-1 has-[:checked]:ring-emerald-500',
    radio: 'text-emerald-600 focus:ring-emerald-500',
  },
  {
    value: false,
    label: 'Unpublished',
    description: 'Draft or internal record, hidden from public menus.',
    dot: 'bg-slate-400',
    card: 'has-[:checked]:border-slate-700 has-[:checked]:bg-slate-50 has-[:checked]:ring-1 has-[:checked]:ring-slate-700',
    radio: 'text-slate-600 focus:ring-slate-500',
  },
];

export default function DishEditForm({ dish, form, disabled, showNameError, showImageError, onChange }) {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {/* Dish Name */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-800 text-xs" htmlFor="drawerDishNameInput">
            Dish Name {form.isPublished && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[11px] text-slate-400">
            {form.dishName.length} / {MAX_DISH_NAME_LENGTH}
          </span>
        </div>
        <input
          id="drawerDishNameInput"
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
          maxLength={MAX_DISH_NAME_LENGTH}
          type="text"
          value={form.dishName}
          disabled={disabled}
          onChange={(e) => onChange({ ...form, dishName: e.target.value })}
        />
        {showNameError && (
          <div role="alert" className="flex items-start gap-1.5 text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
            <Icon name="alertCircle" className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>A published dish must have a non-empty name.</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span className="truncate pr-2">
            Saved: <span className="text-slate-600 font-medium">{dish.dishName || '(empty)'}</span>
          </span>
          <span className="shrink-0">Trims whitespace on save</span>
        </div>
      </div>

      {/* Publication Status */}
      <fieldset className="space-y-2" disabled={disabled}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 text-xs">Publication Status</span>
          <span className="text-[10px] text-slate-400">
            Saved: <span className="font-medium text-slate-600">{dish.isPublished ? 'Published' : 'Unpublished'}</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {PUBLICATION_OPTIONS.map((option) => (
            <label
              key={option.label}
              className={`relative flex flex-col p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer transition-all ${option.card}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full ${option.dot}`} /> {option.label}
                </span>
                <input
                  className={`w-3.5 h-3.5 border-slate-300 ${option.radio}`}
                  name="drawerPublicationRadio"
                  type="radio"
                  value={option.label}
                  checked={form.isPublished === option.value}
                  onChange={() => onChange({ ...form, isPublished: option.value })}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">{option.description}</p>
            </label>
          ))}
        </div>

        {showImageError && (
          <div role="alert" className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200">
            <Icon name="warning" className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-rose-950">Image URL Validation Error</p>
              <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                This dish cannot be published because its image URL is invalid. The image URL must use HTTP or HTTPS.
              </p>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="font-medium text-slate-700">Notice:</span> Publishing requires a non-empty dish name and a valid HTTP/HTTPS image URL.
          Draft changes stay in this browser tab until you click Save.
        </p>
      </fieldset>
    </form>
  );
}
