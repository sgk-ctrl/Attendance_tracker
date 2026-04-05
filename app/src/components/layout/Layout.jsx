import { Outlet } from 'react-router-dom';
import { ToastProvider } from '../../context/ToastContext';

export default function Layout() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--gray-100)]">
        <Outlet />
      </div>
    </ToastProvider>
  );
}
