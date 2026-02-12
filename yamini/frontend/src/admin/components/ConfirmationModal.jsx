import React from 'react';
import { theme } from '../styles/designSystem';

/**
 * ConfirmationModal - Enterprise-grade modal for all admin write actions
 * Clear, professional, accessible
 */
export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // primary, danger, warning
  icon,
  loading = false
}) {
  if (!isOpen) return null;

  const variantColors = {
    primary: theme.colors.primary,
    danger: theme.colors.danger,
    warning: theme.colors.warning
  };

  const colors = variantColors[variant] || variantColors.primary;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: theme.zIndex.modal,
      padding: theme.spacing.md
    }}>
      <div style={{
        backgroundColor: theme.colors.neutral.white,
        borderRadius: theme.borderRadius.lg,
        boxShadow: theme.shadows.modal,
        maxWidth: '500px',
        width: '100%',
        animation: 'slideIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors.neutral.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md
        }}>
          {icon && (
            <span style={{ 
              fontSize: theme.typography.fontSize['2xl'],
              color: colors.main
            }}>
              {icon}
            </span>
          )}
          <h2 style={{
            margin: 0,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary
          }}>
            {title}
          </h2>
        </div>

        {/* Body */}
        <div style={{
          padding: theme.spacing.lg
        }}>
          <p style={{
            margin: 0,
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            lineHeight: theme.typography.lineHeight.relaxed
          }}>
            {message}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: theme.spacing.lg,
          borderTop: `1px solid ${theme.colors.neutral.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: theme.spacing.md
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.neutral.border}`,
              backgroundColor: theme.colors.neutral.white,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: theme.transitions.fast
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = theme.colors.neutral.bg;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.neutral.white;
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              borderRadius: theme.borderRadius.md,
              border: 'none',
              backgroundColor: colors.main,
              color: theme.colors.neutral.white,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: theme.transitions.fast,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.dark;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.main;
            }}
          >
            {loading && (
              <span style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTopColor: theme.colors.neutral.white,
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
            )}
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
