import Header from '@/components/layout/Header.jsx';
import Toast from '@/components/ui/Toast.jsx';

// Page frame: top header + scrollable content area with the global toast.
export default function AppShell({ children, ...headerProps }) {
  return (
    <>
      <Header {...headerProps} />
      <main className="flex-1 min-w-0 bg-slate-50 overflow-y-auto custom-scrollbar relative">
        <Toast />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-12">{children}</div>
      </main>
    </>
  );
}
