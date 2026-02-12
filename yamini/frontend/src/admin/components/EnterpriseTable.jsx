import React from 'react';
import { theme } from '../styles/designSystem';

/**
 * EnterpriseTable - Responsive data table
 * Clean, professional, mobile-friendly
 */
export default function EnterpriseTable({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  hoverable = true
}) {
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < theme.layout.breakpoints.tablet;

  const containerStyles = {
    width: '100%',
    overflow: 'auto',
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.neutral.border}`,
    boxShadow: theme.shadows.sm
  };

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: theme.typography.fontSize.sm
  };

  const theadStyles = {
    backgroundColor: theme.colors.neutral.bg,
    borderBottom: `2px solid ${theme.colors.neutral.border}`
  };

  const thStyles = {
    padding: isMobile ? theme.spacing.sm : theme.spacing.md,
    textAlign: 'left',
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap'
  };

  const getTdStyles = (clickable) => ({
    padding: isMobile ? theme.spacing.sm : theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.neutral.border}`,
    color: theme.colors.text.secondary
  });

  const getRowStyles = (clickable) => ({
    cursor: clickable ? 'pointer' : 'default',
    transition: theme.transitions.fast
  });

  if (loading) {
    return (
      <div style={{
        ...containerStyles,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxxl
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `4px solid ${theme.colors.primary.light}`,
            borderTopColor: theme.colors.primary.main,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px'
          }} />
          <p style={{ color: theme.colors.text.secondary }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        ...containerStyles,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xxxl
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>📭</div>
          <p style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary
          }}>
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  // Mobile card view for better UX
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            onClick={() => onRowClick && onRowClick(row)}
            style={{
              backgroundColor: theme.colors.neutral.white,
              border: `1px solid ${theme.colors.neutral.border}`,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.md,
              cursor: onRowClick ? 'pointer' : 'default',
              transition: theme.transitions.fast,
              boxShadow: theme.shadows.sm
            }}
            onMouseEnter={(e) => {
              if (onRowClick) {
                e.currentTarget.style.boxShadow = theme.shadows.md;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = theme.shadows.sm;
            }}
          >
            {columns.map((col, colIndex) => (
              <div
                key={colIndex}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: `${theme.spacing.xs} 0`,
                  borderBottom: colIndex < columns.length - 1 ? `1px solid ${theme.colors.neutral.border}` : 'none'
                }}
              >
                <span style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase'
                }}>
                  {col.header}
                </span>
                <span style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.primary,
                  textAlign: 'right'
                }}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div style={containerStyles}>
      <table style={tableStyles}>
        <thead style={theadStyles}>
          <tr>
            {columns.map((col, index) => (
              <th key={index} style={thStyles}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              style={getRowStyles(onRowClick)}
              onMouseEnter={(e) => {
                if (hoverable) {
                  e.currentTarget.style.backgroundColor = theme.colors.neutral.bg;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} style={getTdStyles(onRowClick)}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
