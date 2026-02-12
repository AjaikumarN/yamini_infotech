import React from 'react';

/**
 * Data Card Component - Able Pro Style
 * Versatile card for displaying data tables, charts, and content
 */
export default function DataCard({ 
  title, 
  subtitle,
  action,
  children,
  headerAction,
  noPadding = false,
  className = ''
}) {
  return (
    <div style={styles.card} className={className}>
      {(title || headerAction) && (
        <div style={styles.header}>
          <div style={styles.titleSection}>
            {title && <h3 style={styles.title}>{title}</h3>}
            {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAction && (
            <div style={styles.headerAction}>
              {headerAction}
            </div>
          )}
        </div>
      )}
      
      <div style={noPadding ? {} : styles.content}>
        {children}
      </div>

      {action && (
        <div style={styles.footer}>
          {action}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleSection: {
    flex: 1
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0
  },
  headerAction: {
    marginLeft: '16px'
  },
  content: {
    padding: '20px'
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #f3f4f6',
    background: '#f9fafb'
  }
};
