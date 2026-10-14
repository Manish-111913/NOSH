import Icon from '@/components/ui/Icon.jsx';
import { MODE } from '../constants.js';

const CARDS = [
  {
    label: 'Total dishes',
    hint: 'Calculated from saved backend records',
    valueClass: 'text-slate-900',
    iconBox: 'bg-slate-100 text-slate-600',
    icon: 'collection',
  },
  {
    label: 'Published dishes',
    hint: 'Currently visible on menu interfaces',
    valueClass: 'text-emerald-600',
    iconBox: 'bg-emerald-50 text-emerald-600',
    icon: 'checkCircle',
  },
  {
    label: 'Unpublished dishes',
    hint: 'Draft or archived internal records',
    valueClass: 'text-slate-700',
    iconBox: 'bg-slate-100 text-slate-500',
    icon: 'eyeOff',
  },
];

export default function MetricsRow({ mode, dishes }) {
  const published = dishes.filter((d) => d.isPublished).length;

  let values;
  if (mode === MODE.ERROR) values = ['—', '—', '—'];
  else if (mode === MODE.EMPTY) values = [0, 0, 0];
  else values = [dishes.length, published, dishes.length - published];

  return (
    <section aria-label="Dish Metrics Overview" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {CARDS.map((card, i) => (
        <div key={card.label} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              {mode === MODE.LOADING ? (
                <div className="h-7 w-12 bg-slate-200 rounded animate-shimmer" />
              ) : (
                <h3 data-testid={`metric-${card.label.split(' ')[0].toLowerCase()}`} className={`text-2xl font-bold tracking-tight ${card.valueClass}`}>{values[i]}</h3>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{card.hint}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBox}`}>
            <Icon name={card.icon} className="w-5 h-5" />
          </div>
        </div>
      ))}
    </section>
  );
}
