import Spinner from '@/components/ui/Spinner.jsx';

export default function DrawerFooter({ hasDraft, canSave, isSaving, onSave, onDiscard, onClose }) {
  return (
    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
      <button
        className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
        type="button"
        title="Throw away the draft and restore the saved values"
        disabled={!hasDraft || isSaving}
        onClick={onDiscard}
      >
        Discard
      </button>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          type="button"
          title="Close the editor. Your draft is kept."
          onClick={onClose}
        >
          Close
        </button>
        <button
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          type="button"
          disabled={!canSave}
          onClick={onSave}
        >
          {isSaving && <Spinner />}
          <span>{isSaving ? 'Saving...' : 'Save changes'}</span>
        </button>
      </div>
    </div>
  );
}
