import React from 'react';

/**
 * KPI Card Component - Able Pro Style
 * Professional metric display with trend indicators
 */
export default function KpiCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon, 
  color = '#6366f1',
  subtitle,
  trend,
  loading = false,
  onClick 
}) {
  const isPositive = changeType === 'positive';
  const isNeutral = changeType === 'neutral';
  const changeColor = isNeutral ? '#6b7280' : (isPositive ? '#10b981' : '#ef4444');

  return (
    <div 
      style={{
        ...styles.card, 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
        }
      }}
    >
      {loading ? (
        <div style={styles.skeleton}>
          <div style={styles.skeletonLine} />
          <div style={{...styles.skeletonLine, width: '60%'}} />
        </div>
      ) : (
        <>
          <div style={styles.header}>
            <div style={styles.titleSection}>
              <span style={styles.title}>{title}</span>
              {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
            </div>
            {icon && (
              <div style={{...styles.iconBox, background: `${color}15`}}>
                <span className="material-icons" style={{...styles.icon, color}}>
                  {icon}
                </span>
              </div>
            )}
          </div>

          <div style={styles.valueSection}>
            <h2 style={styles.value}>{value}</h2>
            {change !== undefined && (
              <div style={{...styles.change, color: changeColor}}>
                <span className="material-icons" style={styles.changeIcon}>
                  {isPositive ? 'trending_up' : 'trending_down'}
                </span>
                <span style={styles.changeText}>{change}%</span>
                {trend && <span style={styles.trendText}>{trend}</span>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-2px)'
    }
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  title: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: '0.3px'
  },
  subtitle: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '400'
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  icon: {
    fontSize: '24px'
  },
  valueSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    flexWrap: 'wrap'
  },
  value: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    lineHeight: '1.2'
  },
  change: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    fontWeight: '600'
  },
  changeIcon: {
    fontSize: '18px'
  },
  changeText: {
    fontWeight: '600'
  },
  trendText: {
    fontSize: '12px',
    fontWeight: '400',
    color: '#6b7280',
    marginLeft: '4px'
  },
  skeleton: {
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  skeletonLine: {
    height: '12px',
    background: '#e5e7eb',
    borderRadius: '6px',
    marginBottom: '8px'
  }
};
