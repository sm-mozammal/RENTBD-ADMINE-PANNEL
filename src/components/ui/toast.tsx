'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
    custom: (item: Omit<ToastItem, 'id'>) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duration = item.duration ?? 4500;

      setToasts((prev) => [...prev, { ...item, id }]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toastMethods = {
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    custom: addToast,
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods, dismiss }}>
      {children}
      {/* Toast Render Viewport */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
              t.type === 'success'
                ? 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50'
                : t.type === 'error'
                ? 'bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/50'
                : t.type === 'warning'
                ? 'bg-amber-950/90 dark:bg-amber-950/95 border-amber-500/40 text-amber-100 shadow-amber-950/50'
                : 'bg-slate-900/90 dark:bg-slate-950/95 border-cyan-500/40 text-cyan-100 shadow-slate-950/50'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
              {t.type === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              {t.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h5 className="text-xs font-semibold tracking-tight">{t.title}</h5>
              {t.description && (
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed break-words">
                  {t.description}
                </p>
              )}
            </div>

            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
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
