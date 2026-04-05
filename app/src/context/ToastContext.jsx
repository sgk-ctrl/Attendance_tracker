import { createContext, useContext, useCallback, useState, useRef } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((msg, type = '') => {
    const id = ++toastId;
    const duration = type === 'error' ? 6000 : 3000;
    setToasts(prev => [...prev, { id, msg, type, duration }]);
    timersRef.current[id] = setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 pointer-events-none w-[calc(100%-40px)] max-w-[400px]"
      role="alert"
      aria-live="assertive"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast rounded-lg px-4 py-3 text-sm font-medium shadow-lg text-white ${
            t.type === 'error' ? 'bg-[var(--red-600)]' :
            t.type === 'success' ? 'bg-[var(--green-600)]' :
            'bg-[var(--gray-900)]'
          }`}
          onClick={() => onDismiss(t.id)}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
