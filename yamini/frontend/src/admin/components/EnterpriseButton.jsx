import React from 'react';
import { theme } from '../styles/designSystem';

/**
 * EnterpriseButton - Consistent button component
 * Variants: primary, secondary, success, danger, warning
 * Sizes: sm, md, lg
 */
export default function EnterpriseButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  fullWidth = false,
  style = {}
}) {
  const variantColors = {
    primary: {
      bg: theme.colors.primary.main,
      bgHover: theme.colors.primary.dark,
      text: theme.colors.neutral.white
    },
    secondary: {
      bg: theme.colors.neutral.white,
      bgHover: theme.colors.neutral.bg,
      text: theme.colors.text.primary,
      border: theme.colors.neutral.border
    },
    success: {
      bg: theme.colors.success.main,
      bgHover: theme.colors.success.dark,
      text: theme.colors.neutral.white
    },
    danger: {
      bg: theme.colors.danger.main,
      bgHover: theme.colors.danger.dark,
      text: theme.colors.neutral.white
    },
    warning: {
      bg: theme.colors.warning.main,
      bgHover: theme.colors.warning.dark,
      text: theme.colors.neutral.white
    }
  };

  const sizeStyles = {
    sm: {
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.sm,
      height: '32px'
    },
    md: {
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.base,
      height: '40px'
    },
    lg: {
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      fontSize: theme.typography.fontSize.lg,
      height: '48px'
    }
  };

  const colors = variantColors[variant];
  const sizes = sizeStyles[size];

  const buttonStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: colors.bg,
    color: colors.text,
    border: colors.border ? `1px solid ${colors.border}` : 'none',
    borderRadius: theme.borderRadius.md,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: theme.transitions.fast,
    width: fullWidth ? '100%' : 'auto',
    ...sizes,
    ...style
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={buttonStyles}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = colors.bgHover;
          if (variant === 'secondary') {
            e.currentTarget.style.borderColor = theme.colors.primary.main;
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.bg;
        if (variant === 'secondary') {
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
    >
      {loading && (
        <span style={{
          width: '16px',
          height: '16px',
          border: '2px solid transparent',
          borderTopColor: colors.text,
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite'
        }} />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span style={{ fontSize: theme.typography.fontSize.lg }}>{icon}</span>
      )}
      
      <span>{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span style={{ fontSize: theme.typography.fontSize.lg }}>{icon}</span>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
