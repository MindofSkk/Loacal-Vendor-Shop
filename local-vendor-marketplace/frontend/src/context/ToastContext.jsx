import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const typeStyles = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-600 text-white'
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-red-600 text-white'
  },
  warning: {
    icon: TriangleAlert,
    className: 'border-amber-200 bg-amber-500 text-white'
  },
  info: {
    icon: Info,
    className: 'border-violet-200 bg-violet-700 text-white'
  }
};

export const ToastProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const recentKeys = useRef(new Set());

  const dismiss = useCallback(() => {
    setCurrentToast(null);
  }, []);

  const showToast = useCallback((toast) => {
    const key = toast.key || `${toast.type || 'info'}-${toast.title || ''}-${toast.message || ''}`;
    if (recentKeys.current.has(key)) return;

    recentKeys.current.add(key);
    window.setTimeout(() => recentKeys.current.delete(key), 4500);
    setQueue((current) => [...current, { ...toast, key, id: `${key}-${Date.now()}` }]);
  }, []);

  useEffect(() => {
    if (currentToast || queue.length === 0) return;

    const [nextToast, ...rest] = queue;
    setCurrentToast(nextToast);
    setQueue(rest);
  }, [currentToast, queue]);

  useEffect(() => {
    if (!currentToast) return undefined;

    const timeout = window.setTimeout(dismiss, currentToast.duration || 4000);
    return () => window.clearTimeout(timeout);
  }, [currentToast, dismiss]);

  const value = useMemo(
    () => ({
      showToast,
      success: (payload) => showToast({ ...payload, type: 'success' }),
      error: (payload) => showToast({ ...payload, type: 'error' }),
      warning: (payload) => showToast({ ...payload, type: 'warning' }),
      info: (payload) => showToast({ ...payload, type: 'info' }),
      dismiss
    }),
    [dismiss, showToast]
  );

  const style = typeStyles[currentToast?.type || 'info'] || typeStyles.info;
  const Icon = style.icon;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {currentToast && (
        <div className="fixed right-4 top-20 z-[80] w-[calc(100%-2rem)] max-w-sm sm:right-5 sm:top-20">
          <div className={`animate-[toastIn_180ms_ease-out] rounded-2xl border p-3.5 shadow-xl ${style.className}`}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">{currentToast.title}</p>
                {currentToast.message && <p className="mt-1 text-xs font-medium opacity-90">{currentToast.message}</p>}
                {currentToast.actionLabel && currentToast.onAction && (
                  <button
                    type="button"
                    className="mt-2 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/25"
                    onClick={() => {
                      currentToast.onAction();
                      dismiss();
                    }}
                  >
                    {currentToast.actionLabel}
                  </button>
                )}
              </div>
              <button type="button" className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white" onClick={dismiss}>
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
