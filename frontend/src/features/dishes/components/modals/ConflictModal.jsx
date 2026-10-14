import Icon from '@/components/ui/Icon.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Spinner from '@/components/ui/Spinner.jsx';

const COPY = {
  conflict: {
    title: 'This dish was updated elsewhere',
    body: 'Your changes were not saved because this dish has a newer version. Review the latest saved data before continuing.',
  },
  stale: {
    title: 'A newer saved version is available',
    body: 'This dish was saved elsewhere after you started editing. Saving your draft will be rejected until you reload the latest version.',
  },
};

function StatusPill({ isPublished }) {
  return isPublished ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Unpublished
    </span>
  );
}

// Compares the local draft with the latest saved server record. Nothing is overwritten without explicit confirmation.
export default function ConflictModal({
  open,
  reason,
  confirmingReload,
  isReloading,
  reloadError,
  draft,
  expectedVersion,
  serverRecord,
  onClose,
  onKeepDraft,
  onPromptReload,
  onCancelReload,
  onConfirmReload,
}) {
  const copy = COPY[reason] ?? COPY.conflict;

  return (
    <Modal
      open={open}
      overlayClassName="bg-slate-900/60 duration-200"
      panelClassName="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 duration-200 max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Icon name="warning" className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{copy.title}</h3>
            {reason === 'conflict' && (
              <span className="font-mono text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded border border-rose-200">HTTP 409 Conflict</span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{copy.body}</p>
        </div>
        <button aria-label="Close dialog" className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-blue-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Your editing session
            </span>
            <span className="font-mono text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded border border-blue-200">expected: v{expectedVersion}</span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Your current draft name:</span>
              <p className="font-bold text-blue-900 bg-white/80 p-1.5 rounded border border-blue-200/60 break-words min-h-[30px]">{draft?.dishName}</p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500">Draft publication status:</span>
              <StatusPill isPublished={draft?.isPublished} />
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-amber-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" /> Latest saved version
            </span>
            <span className="font-mono text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded border border-amber-200">Server: v{serverRecord?.version}</span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Latest saved dish name:</span>
              <p className="font-bold text-amber-950 bg-white/80 p-1.5 rounded border border-amber-200/60 break-words min-h-[30px]">{serverRecord?.dishName}</p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500">Latest saved status:</span>
              <StatusPill isPublished={serverRecord?.isPublished} />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation step before reloading the server version */}
      {confirmingReload && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
          <p className="font-bold text-rose-950 flex items-center gap-1.5">
            <Icon name="warning" className="w-4 h-4 text-rose-600" />
            Warning: Discard local draft?
          </p>
          <p className="text-[11px] text-rose-800 leading-snug">
            Reloading will discard your unsaved draft and load the latest saved version from the server into the editor.
          </p>
          {reloadError && <p className="text-[11px] font-semibold text-rose-900 bg-white/70 border border-rose-200 rounded p-2">{reloadError}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button
              className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg shadow-xs flex items-center gap-1.5"
              disabled={isReloading}
              onClick={onConfirmReload}
            >
              {isReloading && <Spinner />}
              {isReloading ? 'Reloading...' : 'Yes, discard draft & reload'}
            </button>
            <button
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
              disabled={isReloading}
              onClick={onCancelReload}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal Footer Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200 text-xs">
        <button
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          onClick={onKeepDraft}
        >
          <Icon name="check" className="w-3.5 h-3.5 text-slate-500" />
          <span>Keep my draft</span>
        </button>
        <button
          className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
          onClick={onPromptReload}
        >
          <Icon name="refresh" className="w-3.5 h-3.5" />
          <span>Reload latest version</span>
        </button>
      </div>
    </Modal>
  );
}
