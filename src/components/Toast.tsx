'use client';

import { useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  // Auto-dismiss after 3s
  useEffect(() => {
    if (toasts.length === 0) return;
    const latestToast = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      onDismiss(latestToast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <CheckCircle size={18} style={{ color: 'var(--priority-low)', flexShrink: 0 }} />
          ) : (
            <XCircle size={18} style={{ color: 'var(--priority-high)', flexShrink: 0 }} />
          )}
          <span style={{ flex: 1, fontSize: '13px' }}>{toast.message}</span>
          <button
            className="icon-btn"
            onClick={() => onDismiss(toast.id)}
            style={{ width: 24, height: 24, border: 'none', background: 'transparent', flexShrink: 0 }}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
