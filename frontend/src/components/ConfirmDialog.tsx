import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: isDanger ? 'var(--status-absent-bg)' : 'var(--primary-subtle)',
              color: isDanger ? 'var(--status-absent-accent)' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            <AlertTriangle size={24} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {title}
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center', gap: '1rem', padding: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
