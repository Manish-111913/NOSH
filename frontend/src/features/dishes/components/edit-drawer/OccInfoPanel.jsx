import Icon from '@/components/ui/Icon.jsx';

// Explains which version this edit will be checked against when saving.
export default function OccInfoPanel({ expectedVersion, savedVersion }) {
  return (
    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
          <Icon name="shield" className="w-3.5 h-3.5 text-slate-500" />
          Optimistic Concurrency Control (OCC)
        </span>
        <span className="font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">expectedVersion: {expectedVersion}</span>
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed">
        The server validates <code className="font-mono text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200">expectedVersion</code> on save (
        <code className="font-mono text-slate-700 bg-white px-1 py-0.5 rounded border border-slate-200">PATCH /dishes/:dishId</code>) to avoid overwriting remote edits.
      </p>
      {expectedVersion !== savedVersion && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 leading-relaxed">
          Your draft started from v{expectedVersion}, but the server now has v{savedVersion}. Saving will be rejected with a conflict until you reload.
        </p>
      )}
    </div>
  );
}
