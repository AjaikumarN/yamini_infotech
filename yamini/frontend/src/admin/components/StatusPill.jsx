import React from 'react';
import { colors, spacing, transitions } from '../styles/tokens';

/**
 * StatusPill - Animated status indicator with color coding
 */
export default function StatusPill({ 
  status, 
  label,
  pulse = false,
  size = 'md' // 'sm', 'md', 'lg'
}) {
  const getStatusColor = (status) => {
    const statusMap = {
      // Generic
      active: colors.success,
      inactive: colors.neutral,
      pending: colors.warning,
      completed: colors.success,
      cancelled: colors.danger,
      
      // Orders
      draft: colors.neutral,
      confirmed: colors.primary,
      delivered: colors.success,
      
      // Service
      open: colors.warning,
      'in-progress': colors.primary,
      closed: colors.success,
      
      // Attendance
      present: colors.success,
      absent: colors.danger,
      'half-day': colors.warning,
      
      // SLA
      'on-time': colors.success,
      'at-risk': colors.warning,
      breached: colors.danger
    };
    
    return statusMap[status?.toLowerCase()] || colors.neutral;
  };

  const sizeMap = {
    sm: { fontSize: '11px', padding: `${spacing.xs} ${spacing.sm}` },
    md: { fontSize: '12px', padding: `${spacing.xs} ${spacing.md}` },
    lg: { fontSize: '13px', padding: `${spacing.sm} ${spacing.lg}` }
  };

  const statusColor = getStatusColor(status);
  const { fontSize, padding } = sizeMap[size];

  const pillStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding,
    borderRadius: '6px',
    fontSize,
    fontWeight: '600',
    backgroundColor: `${statusColor}15`,
    color: statusColor,
    transition: `all ${transitions.fast}`,
    whiteSpace: 'nowrap'
  };

  const dotStyles = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: statusColor,
    animation: pulse ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
  };

  return (
    <div style={pillStyles}>
      <div style={dotStyles} />
      {label || status}
    </div>
  );
}
