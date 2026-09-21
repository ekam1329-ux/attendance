import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => {
        let Icon = Info;
        if (t.type === 'success') Icon = CheckCircle2;
        if (t.type === 'error') Icon = AlertCircle;

        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon
              size={18}
              style={{
                flexShrink: 0,
                color:
                  t.type === 'success'
                    ? 'var(--status-present-accent)'
                    : t.type === 'error'
                    ? 'var(--status-absent-accent)'
                    : 'var(--primary)'
              }}
            />
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
