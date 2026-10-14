import { ToastProvider } from '@/context/ToastContext.jsx';
import { DishesPage } from '@/features/dishes';

export default function App() {
  return (
    <ToastProvider>
      <DishesPage />
    </ToastProvider>
  );
}
