import React from 'react';
import { theme } from '../styles/designSystem';

/**
 * EnterpriseCard - Reusable card component
 * Clean, professional, responsive
 */
export default function EnterpriseCard({ 
  children, 
  title, 
  subtitle,
  icon,
  action,
  padding = 'lg',
  hover = false,
  onClick,
  className = '',
  style = {}
}) {
  const cardStyles = {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.neutral.border}`,
    boxShadow: theme.shadows.sm,
    transition: theme.transitions.normal,
    cursor: onClick || hover ? 'pointer' : 'default',
    ...style
  };

  const hoverStyles = onClick || hover ? {
    ':hover': {
      boxShadow: theme.shadows.md,
      transform: 'translateY(-2px)'
    }
  } : {};

  const paddingMap = {
    none: '0',
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
    xl: theme.spacing.xl
  };

  return (
    <div 
      style={cardStyles}
      onClick={onClick}
      className={className}
      onMouseEnter={(e) => {
        if (onClick || hover) {
          e.currentTarget.style.boxShadow = theme.shadows.md;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick || hover) {
          e.currentTarget.style.boxShadow = theme.shadows.sm;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {(title || icon || action) && (
        <div style={{
          padding: paddingMap[padding],
          borderBottom: children ? `1px solid ${theme.colors.neutral.border}` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            {icon && <span style={{ fontSize: theme.typography.fontSize.xl }}>{icon}</span>}
            <div>
              {title && (
                <h3 style={{
                  margin: 0,
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary
                }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p style={{
                  margin: 0,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.xs
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      
      {children && (
        <div style={{ padding: paddingMap[padding] }}>
          {children}
        </div>
      )}
    </div>
  );
}
