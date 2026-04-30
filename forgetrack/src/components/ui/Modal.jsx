import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  maxWidth = '560px',
}) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(7, 7, 11, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-surface-raised border border-border rounded-2xl animate-scale-in"
        style={{
          boxShadow: 'var(--shadow-raised)',
          padding: '40px',
          maxWidth,
          width: 'calc(100% - 32px)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-h2 font-display text-fg-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-fg-tertiary hover:text-fg-primary hover:bg-surface transition-colors -mt-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-body-lg text-fg-secondary">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center justify-end gap-3 mt-8">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience wrapper for confirmation dialogs
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
