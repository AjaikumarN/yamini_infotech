import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ServiceHistory = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, cancelled

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await apiRequest('/api/service-requests/my-services');
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch service history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    if (filter === 'completed') return service.status === 'COMPLETED';
    if (filter === 'cancelled') return service.status === 'CANCELLED';
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: '#10b981',
      CANCELLED: '#6b7280',
      IN_PROGRESS: '#f59e0b',
      ASSIGNED: '#3b82f6'
    };
    return colors[status] || '#6b7280';
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Service History Report', 14, 20);
    
    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Filter: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`, 14, 33);
    doc.text(`Total Records: ${filteredServices.length}`, 14, 38);
    
    // Prepare table data
    const tableData = filteredServices.map(service => {
      const created = new Date(service.created_at);
      const completed = service.completed_at ? new Date(service.completed_at) : null;
      
      // Calculate duration
      let durationText = '-';
      if (completed) {
        const diffMs = completed - created;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        } else if (minutes > 0) {
          durationText = `${minutes}m`;
        } else {
          durationText = '< 1m';
        }
      }
      
      return [
        service.ticket_no || '-',
        service.customer_name || '-',
        (service.fault_description || service.issue_description || service.description || '-').substring(0, 30) + '...',
        service.status || '-',
        service.priority || 'NORMAL',
        created.toLocaleDateString(),
        completed ? completed.toLocaleDateString() : '-',
        durationText
      ];
    });
    
    // Add table using autoTable function
    autoTable(doc, {
      startY: 45,
      head: [['Ticket', 'Customer', 'Issue', 'Status', 'Priority', 'Created', 'Completed', 'Duration']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 18 },
        5: { cellWidth: 22 },
        6: { cellWidth: 22 },
        7: { cellWidth: 18 }
      },
      margin: { top: 45, left: 14, right: 14 }
    });
    
    // Save PDF
    const filename = `service-history-${filter}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Loading service history...</p>
      </div>
    );
  }

  return (
    <div className="service-history">
      <div className="history-header">
        <div className="header-left">
          <h1>🔁 Service History</h1>
          <p>Complete record of all your service requests</p>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={exportToPDF}>
            📥 Export
          </button>
        </div>
      </div>

      <div className="history-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({services.length})
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          ✅ Completed ({services.filter(s => s.status === 'COMPLETED').length})
        </button>
        <button
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          ❌ Cancelled ({services.filter(s => s.status === 'CANCELLED').length})
        </button>
      </div>

      {filteredServices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No History Found</h2>
          <p>No services match the selected filter</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Completed</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(service => {
                const created = new Date(service.created_at);
                const completed = service.completed_at ? new Date(service.completed_at) : null;
                
                // Calculate duration with hours and minutes
                let durationText = '-';
                if (completed) {
                  const diffMs = completed - created;
                  const hours = Math.floor(diffMs / (1000 * 60 * 60));
                  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  
                  if (hours > 0) {
                    durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                  } else if (minutes > 0) {
                    durationText = `${minutes}m`;
                  } else {
                    durationText = '< 1m';
                  }
                }

                return (
                  <tr key={service.id}>
                    <td className="td-ticket">
                      <strong>{service.ticket_no}</strong>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-name">{service.customer_name}</div>
                        <div className="customer-phone">{service.customer_phone}</div>
                      </div>
                    </td>
                    <td className="td-issue">
                      {service.fault_description || service.issue_description || service.description || 'N/A'}
                    </td>
                    <td>
                      <span 
                        className="status-pill"
                        style={{ 
                          background: getStatusColor(service.status),
                          color: 'white'
                        }}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${service.priority?.toLowerCase()}`}>
                        {service.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td>{created.toLocaleDateString()}</td>
                    <td>{completed ? completed.toLocaleDateString() : '-'}</td>
                    <td>{durationText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .service-history {
          padding: 24px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .history-header h1 {
          margin: 0;
          color: #1f2937;
        }

        .history-header p {
          margin: 4px 0 0 0;
          color: #6b7280;
        }

        .btn-export {
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-export:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .history-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
          flex-wrap: nowrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.3s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          min-width: fit-content;
        }

        .filter-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
        }

        .history-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .empty-icon {
          font-size: 72px;
          margin-bottom: 16px;
        }

        .empty-state h2 {
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0;
        }

        .history-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
        }

        .history-table thead {
          background: #f9fafb;
        }

        .history-table th {
          padding: 16px;
          text-align: left;
          font-weight: 700;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
        }

        .history-table td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
        }

        .history-table tbody tr:hover {
          background: #f9fafb;
        }

        .td-ticket strong {
          color: #1f2937;
        }

        .customer-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .customer-name {
          color: #1f2937;
          font-weight: 600;
        }

        .customer-phone {
          font-size: 12px;
          color: #9ca3af;
        }

        .td-issue {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-pill {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }

        .priority-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }

        .priority-critical {
          background: #fee2e2;
          color: #991b1b;
        }

        .priority-urgent {
          background: #fef3c7;
          color: #92400e;
        }

        .priority-normal {
          background: #d1fae5;
          color: #065f46;
        }

        @media (max-width: 1200px) {
          .history-table-container {
            overflow-x: auto;
          }

          .history-table {
            min-width: 1000px;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceHistory;
