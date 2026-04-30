import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_COLORS = {
  success: 'text-success border-success-border bg-success-bg',
  error: 'text-danger border-danger-border bg-danger-bg',
  warning: 'text-warning border-warning-border bg-warning-bg',
  info: 'text-info border-info-border bg-info-bg',
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 6000),
    warning: (msg) => addToast(msg, 'warning', 5000),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 w-[360px] max-w-[calc(100vw-48px)] p-4 rounded-lg bg-surface-raised border border-border animate-slide-in-right`}
              style={{ boxShadow: 'var(--shadow-raised)' }}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${t.type === 'success' ? 'text-success' : t.type === 'error' ? 'text-danger' : t.type === 'warning' ? 'text-warning' : 'text-info'}`} />
              <p className="flex-1 text-body text-fg-primary font-medium">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 p-1 rounded-md text-fg-tertiary hover:text-fg-primary hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
