import Icon from '@/components/ui/Icon.jsx';
import { useToast } from '@/context/ToastContext.jsx';

const TOAST_STYLES = {
  info: 'bg-slate-900 text-white border-slate-800',
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  error: 'bg-rose-50 text-rose-900 border-rose-200',
};

export default function Toast() {
  const { toast, dismissToast } = useToast();
  if (!toast) return null;

  return (
    <div className={`mx-4 sm:mx-6 lg:mx-8 mt-4 p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${TOAST_STYLES[toast.type]}`}>
      <div className="flex items-center gap-2">
        <span>{toast.message}</span>
      </div>
      <button aria-label="Dismiss toast" className="text-slate-400 hover:text-slate-600 p-1" onClick={dismissToast}>
        <Icon name="close" />
      </button>
    </div>
  );
}
