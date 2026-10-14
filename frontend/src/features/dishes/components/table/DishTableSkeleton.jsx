const SKELETON_ROWS = [
  ['w-4/5', 'w-1/3'],
  ['w-3/5', 'w-1/4'],
  ['w-2/3', 'w-1/4'],
];

export default function DishTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100 bg-white">
      {SKELETON_ROWS.map(([titleWidth, subWidth], i) => (
        <div key={i} className="py-3.5 px-4 flex items-center justify-between gap-4 animate-shimmer">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1 max-w-sm">
              <div className={`h-3.5 bg-slate-200 rounded ${titleWidth}`} />
              <div className={`h-2.5 bg-slate-100 rounded ${subWidth}`} />
            </div>
          </div>
          <div className="w-20 h-3 bg-slate-200 rounded hidden sm:block" />
          <div className="w-24 h-5 bg-slate-200 rounded-full hidden md:block" />
          <div className="w-12 h-3 bg-slate-200 rounded hidden sm:block" />
          <div className="w-14 h-7 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}
