import React from 'react';
import { colors, spacing, shadows, zIndex } from '../styles/tokens';

/**
 * ConfirmModal - Confirmation dialog with reason field
 * Implements "Every change needs a reason" principle
 */
export default function ConfirmModal({ 
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info', // 'danger', 'warning', 'info', 'success'
  requireReason = false,
  reasonPlaceholder = 'Please provide a reason...'
}) {
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const getTypeColor = () => {
    const typeColors = {
      danger: colors.danger,
      warning: colors.warning,
      info: colors.primary,
      success: colors.success
    };
    return typeColors[type] || colors.primary;
  };

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      return; // Don't proceed without reason
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.modal,
    backdropFilter: 'blur(4px)'
  };

  const modalStyles = {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: spacing.xl,
    boxShadow: shadows.modal,
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  };

  const headerStyles = {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md
  };

  const messageStyles = {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: '1.6',
    marginBottom: spacing.lg
  };

  const reasonInputStyles = {
    width: '100%',
    padding: spacing.md,
    fontSize: '14px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    marginBottom: spacing.lg,
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px'
  };

  const buttonContainerStyles = {
    display: 'flex',
    gap: spacing.md,
    justifyContent: 'flex-end'
  };

  const buttonBaseStyles = {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s'
  };

  const cancelButtonStyles = {
    ...buttonBaseStyles,
    backgroundColor: colors.bgSecondary,
    color: colors.textPrimary
  };

  const confirmButtonStyles = {
    ...buttonBaseStyles,
    backgroundColor: getTypeColor(),
    color: colors.white,
    opacity: (requireReason && !reason.trim()) || isSubmitting ? 0.5 : 1,
    cursor: (requireReason && !reason.trim()) || isSubmitting ? 'not-allowed' : 'pointer'
  };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyles}>{title}</div>
        <div style={messageStyles}>{message}</div>

        {requireReason && (
          <textarea
            style={reasonInputStyles}
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
          />
        )}

        <div style={buttonContainerStyles}>
          <button 
            style={cancelButtonStyles}
            onClick={onClose}
            disabled={isSubmitting}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            {cancelText}
          </button>
          <button 
            style={confirmButtonStyles}
            onClick={handleConfirm}
            disabled={(requireReason && !reason.trim()) || isSubmitting}
            onMouseEnter={(e) => {
              if (!((requireReason && !reason.trim()) || isSubmitting)) {
                e.target.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!((requireReason && !reason.trim()) || isSubmitting)) {
                e.target.style.opacity = '1';
              }
            }}
          >
            {isSubmitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
