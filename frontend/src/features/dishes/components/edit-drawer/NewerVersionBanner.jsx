import Icon from '@/components/ui/Icon.jsx';

// Shown when a newer version was saved elsewhere while this tab holds a draft. The draft is never replaced automatically.
export default function NewerVersionBanner({ savedVersion, draftVersion, onReview, onDismiss }) {
  return (
    <div role="status" className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3 shrink-0">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon name="warning" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-950">A newer saved version (v{savedVersion}) is available on server.</p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Your draft is based on v{draftVersion} and is preserved. Review the latest data before saving.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button className="px-2.5 py-1 text-[11px] font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded shadow-2xs" onClick={onReview}>
          Review
        </button>
        <button aria-label="Dismiss" className="text-amber-800 hover:text-amber-950 p-1" onClick={onDismiss}>
          <Icon name="close" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
