import DrawerContent from './DrawerContent.jsx';

// Slide-over shell. Stays mounted so the open/close transition can play.
export default function EditDrawer({ open, session, dish, ...contentProps }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-50 transition-[opacity,visibility] duration-200 ${open ? '' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={contentProps.onClose}
      />
      <aside
        aria-label="Dish Edit Drawer"
        className={`fixed inset-y-0 right-0 w-full sm:w-[500px] max-w-full bg-white shadow-2xl z-50 border-l border-slate-200 transform transition-[transform,visibility] duration-200 ease-in-out flex flex-col ${open ? '' : 'translate-x-full invisible'}`}
      >
        {/* Keyed by session so temporary error banners reset every time the drawer is (re)opened. */}
        {dish && <DrawerContent key={session} dish={dish} {...contentProps} />}
      </aside>
    </>
  );
}
