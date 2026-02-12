import React from 'react';

/**
 * DataTable - Reusable professional data table component
 */
export default function DataTable({ title, columns, data, actions, emptyMessage = 'No data available' }) {
  return (
    <div className="data-table-container">
      {title && (
        <div className="data-table-header">
          <h3 className="data-table-title">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      
      {data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No Data</div>
          <div className="empty-state-message">{emptyMessage}</div>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
