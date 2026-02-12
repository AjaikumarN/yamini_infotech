import React from 'react';
import { theme } from '../styles/designSystem';

/**
 * StatusBadge - Consistent status indicator
 * Variants match status types across the system
 */
export default function StatusBadge({ 
  status, 
  variant = 'default',
  size = 'md',
  icon
}) {
  const variantStyles = {
    success: {
      bg: theme.colors.success.bg,
      text: theme.colors.success.dark,
      border: theme.colors.success.main
    },
    warning: {
      bg: theme.colors.warning.bg,
      text: theme.colors.warning.dark,
      border: theme.colors.warning.main
    },
    danger: {
      bg: theme.colors.danger.bg,
      text: theme.colors.danger.dark,
      border: theme.colors.danger.main
    },
    info: {
      bg: theme.colors.info.bg,
      text: theme.colors.info.dark,
      border: theme.colors.info.main
    },
    default: {
      bg: theme.colors.neutral.bg,
      text: theme.colors.text.secondary,
      border: theme.colors.neutral.border
    }
  };

  const sizeStyles = {
    sm: {
      padding: `2px ${theme.spacing.xs}`,
      fontSize: theme.typography.fontSize.xs
    },
    md: {
      padding: `4px ${theme.spacing.sm}`,
      fontSize: theme.typography.fontSize.sm
    },
    lg: {
      padding: `6px ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.base
    }
  };

  // Auto-detect variant from common status values
  let detectedVariant = variant;
  const statusLower = String(status || '').toLowerCase();
  
  if (statusLower.includes('success') || statusLower.includes('complete') || 
      statusLower.includes('approved') || statusLower.includes('active') ||
      statusLower.includes('paid')) {
    detectedVariant = 'success';
  } else if (statusLower.includes('pending') || statusLower.includes('review') ||
             statusLower.includes('waiting') || statusLower.includes('partial')) {
    detectedVariant = 'warning';
  } else if (statusLower.includes('error') || statusLower.includes('failed') || 
             statusLower.includes('rejected') || statusLower.includes('breach') ||
             statusLower.includes('overdue')) {
    detectedVariant = 'danger';
  } else if (statusLower.includes('new') || statusLower.includes('info') ||
             statusLower.includes('processing')) {
    detectedVariant = 'info';
  }

  const colors = variantStyles[detectedVariant];
  const sizes = sizeStyles[size];

  const badgeStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: theme.borderRadius.full,
    fontWeight: theme.typography.fontWeight.medium,
    whiteSpace: 'nowrap',
    ...sizes
  };

  return (
    <span style={badgeStyles}>
      {icon && <span>{icon}</span>}
      <span>{status}</span>
    </span>
  );
}
