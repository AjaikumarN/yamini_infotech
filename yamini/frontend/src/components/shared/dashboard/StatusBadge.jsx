import React from 'react';

/**
 * Status Badge Component - Able Pro Style
 * Color-coded status indicators
 */
export default function StatusBadge({ 
  status, 
  variant = 'default',
  size = 'md',
  dot = false 
}) {
  const variants = {
    success: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    warning: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    danger: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    info: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    hot: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    warm: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    cold: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    pending: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    shipped: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    canceled: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    default: { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }
  };

  const sizes = {
    sm: { fontSize: '11px', padding: '2px 8px' },
    md: { fontSize: '12px', padding: '4px 10px' },
    lg: { fontSize: '13px', padding: '6px 12px' }
  };

  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size];

  return (
    <span style={{
      ...styles.badge,
      ...sizeStyle,
      background: variantStyle.bg,
      color: variantStyle.color,
      border: `1px solid ${variantStyle.border}`
    }}>
      {dot && (
        <span style={{
          ...styles.dot,
          background: variantStyle.color
        }} />
      )}
      {status}
    </span>
  );
}

const styles = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    borderRadius: '6px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap'
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0
  }
};
