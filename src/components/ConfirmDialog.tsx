'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="modal-header">
          <h2 className="modal-title" id="confirm-dialog-title">
            {title}
          </h2>
          <button
            id="confirm-dialog-close"
            className="icon-btn"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="confirm-icon">
            <AlertTriangle size={28} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button
            id="confirm-dialog-cancel"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            id="confirm-dialog-confirm"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(248,113,113,0.3)',
                    borderTopColor: 'var(--priority-high)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
