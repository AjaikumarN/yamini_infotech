import React from 'react';

/**
 * Simple Table Component - Able Pro Style
 * Clean, professional data table
 */
export default function SimpleTable({ 
  columns, 
  data, 
  onRowClick,
  emptyText = 'No data available',
  loading = false 
}) {
  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={styles.empty}>
        <span className="material-icons" style={styles.emptyIcon}>inbox</span>
        <p style={styles.emptyText}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{
                ...styles.th,
                textAlign: col.align || 'left',
                width: col.width
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr 
              key={rowIdx} 
              style={styles.tr}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{
                  ...styles.td,
                  textAlign: col.align || 'left'
                }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableWrapper: {
    overflowX: 'auto',
    width: '100%'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    padding: '12px 16px',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap'
  },
  tr: {
    cursor: 'pointer',
    transition: 'background 0.2s',
    ':hover': {
      background: '#f9fafb'
    }
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
    verticalAlign: 'middle'
  },
  empty: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#9ca3af'
  },
  emptyIcon: {
    fontSize: '48px',
    color: '#d1d5db',
    marginBottom: '12px'
  },
  emptyText: {
    fontSize: '14px',
    margin: 0
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  }
};
