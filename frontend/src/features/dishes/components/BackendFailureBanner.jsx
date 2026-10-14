import { useState } from 'react';
import Icon from '@/components/ui/Icon.jsx';

const VARIANTS = {
  // Nothing could be loaded.
  failed: {
    box: 'border-rose-200 bg-rose-50 text-rose-900',
    iconBox: 'bg-rose-100 text-rose-600',
    title: 'Unable to load dishes. Check your connection and try again.',
    titleClass: 'text-rose-950',
    textClass: 'text-rose-800',
    button: 'bg-rose-600 hover:bg-rose-700',
  },
  // Dishes were loaded earlier, but the latest refresh failed.
  stale: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    iconBox: 'bg-amber-100 text-amber-600',
    title: 'Lost connection to the server. Showing the last loaded dishes.',
    titleClass: 'text-amber-950',
    textClass: 'text-amber-800',
    button: 'bg-amber-600 hover:bg-amber-700',
  },
};

export default function BackendFailureBanner({ variant = 'failed', error, onRetry }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const style = VARIANTS[variant];

  async function handleRetry() {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div role="alert" className={`p-4 rounded-xl border text-xs shadow-xs ${style.box}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.iconBox}`}>
            <Icon name="warning" />
          </div>
          <div>
            <p className={`font-bold text-sm ${style.titleClass}`}>{style.title}</p>
            <p className={`text-[11px] mt-0.5 ${style.textClass}`}>
              {error?.message} Retrying automatically every few seconds. Any open local drafts are preserved safely.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            className={`px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 ${style.button}`}
            disabled={isRetrying}
            onClick={handleRetry}
          >
            <Icon name="refresh" className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry request'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
