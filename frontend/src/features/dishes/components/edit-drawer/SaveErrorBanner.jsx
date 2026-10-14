import Icon from '@/components/ui/Icon.jsx';

const TITLES = {
  validation: 'The server rejected these changes.',
  network: 'Unable to save changes. Check connection and retry.',
};

export default function SaveErrorBanner({ error, isRetrying, onRetry, onDismiss }) {
  return (
    <div role="alert" className="px-5 py-3 bg-rose-50 border-t border-rose-200 text-xs text-rose-900 shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Icon name="warning" className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-rose-950">{TITLES[error.kind]}</p>
            <p className="text-[11px] text-rose-800 mt-0.5">{error.message} Your draft changes are preserved.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {error.kind === 'network' && (
            <button
              className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded shadow-xs transition-colors"
              disabled={isRetrying}
              onClick={onRetry}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
          <button aria-label="Dismiss error" className="text-rose-500 hover:text-rose-800 p-1" onClick={onDismiss}>
            <Icon name="close" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
