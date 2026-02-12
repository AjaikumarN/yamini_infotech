import React from 'react';
import { theme } from '../admin/styles/designSystem';

/**
 * StatusBadge - Enterprise-grade status indicator
 * 
 * Automatically maps status strings to appropriate colors:
 * - GREEN (success): PAID, APPROVED, COMPLETED, ACTIVE
 * - AMBER (warning): PENDING, IN_PROGRESS, ASSIGNED
 * - RED (danger): FAILED, REJECTED, OVERDUE, CANCELLED
 * - BLUE (info): NEW, OPEN, SCHEDULED
 * 
 * @example
 * <StatusBadge status="PAID" />
 * <StatusBadge status="pending" />
 * <StatusBadge status="In Progress" />
 */
export default function StatusBadge({ status, variant, size = 'default', className = '' }) {
  if (!status && !variant) return null;
  
  // Get colors from design system or use variant override
  const getColors = () => {
    if (variant) {
      const variantMap = {
        success: { bg: '#D1FAE5', color: '#059669' },
        warning: { bg: '#FEF3C7', color: '#D97706' },
        danger: { bg: '#FEE2E2', color: '#DC2626' },
        info: { bg: '#DBEAFE', color: '#2563EB' },
        neutral: { bg: '#F3F4F6', color: '#6B7280' }
      };
      return variantMap[variant] || variantMap.neutral;
    }
    return theme.getStatusColor(status);
  };
  
  const colors = getColors();
  
  const sizeStyles = {
    small: { padding: '2px 8px', fontSize: '10px' },
    default: { padding: '4px 10px', fontSize: '11px' },
    large: { padding: '6px 14px', fontSize: '12px' }
  };
  
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    ...sizeStyles[size],
    borderRadius: '9999px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    backgroundColor: colors.bg,
    color: colors.color
  };
  
  return (
    <span style={styles} className={`erp-status-badge ${className}`}>
      {status || variant}
    </span>
  );
}

/**
 * Pre-defined badge variants for convenience
 */
export const SuccessBadge = ({ children, ...props }) => (
  <StatusBadge variant="success" status={children} {...props} />
);

export const WarningBadge = ({ children, ...props }) => (
  <StatusBadge variant="warning" status={children} {...props} />
);

export const DangerBadge = ({ children, ...props }) => (
  <StatusBadge variant="danger" status={children} {...props} />
);

export const InfoBadge = ({ children, ...props }) => (
  <StatusBadge variant="info" status={children} {...props} />
);
