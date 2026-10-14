import { useState } from 'react';

// Dish image that swaps to a placeholder glyph when the URL fails to load.
export default function DishThumb({ src, alt }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (failedSrc === src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="1.75" />
          <path d="M12 8v8M8 12h8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailedSrc(src)} />;
}
