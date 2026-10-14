import Icon from '@/components/ui/Icon.jsx';
import Modal from '@/components/ui/Modal.jsx';

export default function DiscardModal({ open, onKeepEditing, onConfirm }) {
  return (
    <Modal
      open={open}
      overlayClassName="bg-slate-900/40 duration-150"
      panelClassName="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 duration-150"
    >
      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
        <Icon name="warning" className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">Discard unsaved changes?</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Your unsaved edits will be lost and the last saved values restored. The saved dish record on the server will remain unchanged.
        </p>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg" onClick={onKeepEditing}>
          Keep editing
        </button>
        <button className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs" onClick={onConfirm}>
          Discard changes
        </button>
      </div>
    </Modal>
  );
}
