import React, { useEffect, useRef, useState } from 'react';
import { colors, spacing, shadows, transitions } from '../styles/tokens';

/**
 * KPICard - Enterprise KPI Card with animated number counting
 * Features: Hover elevation, smooth number animations, status colors
 */
export default function KPICard({ 
  icon, 
  label, 
  value, 
  trend, 
  trendValue, 
  status = 'neutral', // 'success', 'warning', 'danger', 'neutral'
  onClick,
  loading = false
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const valueRef = useRef(null);

  // Animated number counting on mount/value change
  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      current += increment;
      
      if (frame >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const getStatusColor = () => {
    const statusColors = {
      success: colors.success,
      warning: colors.warning,
      danger: colors.danger,
      neutral: colors.primary
    };
    return statusColors[status] || colors.primary;
  };

  const cardStyles = {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: spacing.lg,
    boxShadow: isHovered ? shadows.cardHover : shadows.card,
    cursor: onClick ? 'pointer' : 'default',
    transition: `all ${transitions.normal}`,
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    border: `1px solid ${colors.border}`,
    position: 'relative',
    overflow: 'hidden'
  };

  const iconContainerStyles = {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: `${getStatusColor()}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginBottom: spacing.md,
    transition: `all ${transitions.normal}`,
    transform: isHovered ? 'scale(1.05)' : 'scale(1)'
  };

  const valueStyles = {
    fontSize: '32px',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontFamily: 'monospace'
  };

  const labelStyles = {
    fontSize: '14px',
    color: colors.textSecondary,
    fontWeight: '500'
  };

  const trendStyles = {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    fontSize: '12px',
    fontWeight: '600',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: '6px',
    backgroundColor: trend === 'up' ? `${colors.success}15` : `${colors.danger}15`,
    color: trend === 'up' ? colors.success : colors.danger
  };

  return (
    <div 
      style={cardStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {trend && (
        <div style={trendStyles}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
      
      <div style={iconContainerStyles}>
        {icon}
      </div>
      
      <div style={valueStyles} ref={valueRef}>
        {loading ? (
          <span style={{ opacity: 0.5 }}>...</span>
        ) : (
          displayValue
        )}
      </div>
      
      <div style={labelStyles}>{label}</div>
    </div>
  );
}
