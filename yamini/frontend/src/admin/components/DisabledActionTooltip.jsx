import React, { useState } from 'react';
import { theme } from '../styles/designSystem';

/**
 * DisabledActionTooltip - Shows why an action is disabled
 * Professional, helpful, unobtrusive
 */
export default function DisabledActionTooltip({ 
  children, 
  reason,
  position = 'top' // top, bottom, left, right
}) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: theme.spacing.sm
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: theme.spacing.sm
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: theme.spacing.sm
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: theme.spacing.sm
    }
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-flex' 
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && reason && (
        <div style={{
          position: 'absolute',
          ...positionStyles[position],
          backgroundColor: theme.colors.neutral.darker,
          color: theme.colors.neutral.white,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          borderRadius: theme.borderRadius.md,
          fontSize: theme.typography.fontSize.sm,
          whiteSpace: 'nowrap',
          boxShadow: theme.shadows.lg,
          zIndex: theme.zIndex.tooltip,
          animation: 'fadeIn 0.15s ease-out',
          maxWidth: '250px',
          textAlign: 'center',
          lineHeight: theme.typography.lineHeight.normal
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs
          }}>
            <span>🔒</span>
            <span>{reason}</span>
          </div>
          
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            width: 0,
            height: 0,
            borderStyle: 'solid',
            ...(position === 'top' && {
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '6px 6px 0 6px',
              borderColor: `${theme.colors.neutral.darker} transparent transparent transparent`
            }),
            ...(position === 'bottom' && {
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '0 6px 6px 6px',
              borderColor: `transparent transparent ${theme.colors.neutral.darker} transparent`
            }),
            ...(position === 'left' && {
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '6px 0 6px 6px',
              borderColor: `transparent transparent transparent ${theme.colors.neutral.darker}`
            }),
            ...(position === 'right' && {
              left: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '6px 6px 6px 0',
              borderColor: `transparent ${theme.colors.neutral.darker} transparent transparent`
            })
          }} />
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
