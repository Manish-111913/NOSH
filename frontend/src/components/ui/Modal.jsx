// Centered dialog that fades/scales in. It stays mounted while closed so the exit transition can play;
// `invisible` (transitioned together with opacity) removes it from keyboard focus and screen readers once closed.
export default function Modal({ open, overlayClassName = 'bg-slate-900/40 duration-150', panelClassName = '', children }) {
  return (
    <div
      aria-modal="true"
      role="dialog"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-[opacity,visibility] ${overlayClassName} ${open ? '' : 'opacity-0 invisible pointer-events-none'}`}
    >
      <div className={`transform transition-transform ${panelClassName} ${open ? 'scale-100' : 'scale-95'}`}>{children}</div>
    </div>
  );
}
