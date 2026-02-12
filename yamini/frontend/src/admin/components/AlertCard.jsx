import React from 'react';
import { colors, spacing, shadows } from '../styles/tokens';

/**
 * AlertCard - Status card with color-coded left border
 */
export default function AlertCard({ 
  type = 'info', // 'success', 'warning', 'danger', 'info'
  title,
  message,
  icon,
  action,
  onActionClick
}) {
  const getTypeColor = () => {
    const typeColors = {
      success: colors.success,
      warning: colors.warning,
      danger: colors.danger,
      info: colors.primary
    };
    return typeColors[type] || colors.primary;
  };

  const typeColor = getTypeColor();

  const cardStyles = {
    backgroundColor: colors.white,
    borderRadius: '8px',
    padding: spacing.lg,
    boxShadow: shadows.card,
    borderLeft: `4px solid ${typeColor}`,
    display: 'flex',
    gap: spacing.md
  };

  const iconContainerStyles = {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: `${typeColor}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0
  };

  const contentStyles = {
    flex: 1
  };

  const titleStyles = {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  };

  const messageStyles = {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: '1.5'
  };

  const actionStyles = {
    marginTop: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: typeColor,
    color: colors.white,
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  return (
    <div style={cardStyles}>
      {icon && (
        <div style={iconContainerStyles}>
          {icon}
        </div>
      )}
      
      <div style={contentStyles}>
        {title && <div style={titleStyles}>{title}</div>}
        {message && <div style={messageStyles}>{message}</div>}
        
        {action && (
          <button 
            style={actionStyles}
            onClick={onActionClick}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}
