const COLUMNS = [
  { field: 'dishName', label: 'Dish', width: 'min-w-[180px] sm:min-w-[240px]' },
  { field: 'dishId', label: 'Dish ID', width: 'min-w-[80px] sm:min-w-[110px]' },
  { field: 'isPublished', label: 'Publication Status', width: 'min-w-[120px] sm:min-w-[130px]' },
  { field: 'version', label: 'Version', width: 'min-w-[70px] sm:min-w-[90px]' },
];

export default function DishTableHead({ sort, onSort }) {
  return (
    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px] select-none">
      <tr>
        {COLUMNS.map((col) => (
          <th key={col.field} className={`py-3 px-4 ${col.width} cursor-pointer hover:text-slate-900 group`} onClick={() => onSort(col.field)}>
            <div className="flex items-center gap-1">
              <span>{col.label}</span>
              {sort.field === col.field ? (
                <span className="text-slate-900 font-bold">{sort.direction === 'asc' ? '↑' : '↓'}</span>
              ) : (
                <span className="text-slate-400 group-hover:text-slate-700">↕</span>
              )}
            </div>
          </th>
        ))}
        <th className="py-3 px-4 text-right min-w-[100px]">Actions</th>
      </tr>
    </thead>
  );
}
