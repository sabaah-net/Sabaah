'use client';
import { useState, useCallback, useEffect, createContext, useContext } from 'react';

interface ToastItem {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'info';
}

interface ToastCtx {
  show: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastCtx>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let nextId = 0;

  const show = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast show ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
