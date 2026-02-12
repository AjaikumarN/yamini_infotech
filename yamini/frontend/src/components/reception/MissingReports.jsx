import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const MissingReports = () => {
  const [missingReports, setMissingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'ALL',
    reportType: 'ALL',
    search: ''
  });

  useEffect(() => {
    fetchMissingReports();
  }, []);

  const fetchMissingReports = async () => {
    try {
      const [dailyReports, serviceRequests, salesmenData, engineersData] = await Promise.all([
        // Reception/Admin can view all reports via this endpoint
        apiRequest('/api/reports/daily/all').catch(() => []),
        apiRequest('/api/service-requests/').catch(() => []),
        // Reception is allowed to fetch salesmen
        apiRequest('/api/users/salesmen/').catch(() => []),
        // Reception can fetch service engineers with role filter
        apiRequest('/api/users?role=SERVICE_ENGINEER').catch(() => [])
      ]);

      const today = new Date();
      const missing = [];

      // Check salesmen for missing daily reports
      const salesmen = salesmenData || [];
      salesmen.forEach(salesman => {
        const todayReport = (dailyReports || []).find(r => 
          r.salesman_id === salesman.id && 
          new Date(r.report_date).toDateString() === today.toDateString()
        );
        
        if (!todayReport || !todayReport.report_submitted) {
          missing.push({
            employee_name: salesman.full_name || salesman.username,
            employee_id: salesman.id,
            role: 'SALESMAN',
            missing_item: 'Daily Report',
            days_pending: 0, // Today
            type: 'daily_report'
          });
        }
      });

      // Check service engineers for missing service updates (ON_THE_WAY but no update in 24h)
      const engineers = engineersData || [];
      engineers.forEach(engineer => {
        const assignedServices = (serviceRequests || []).filter(s => 
          s.assigned_to === engineer.id && 
          (s.status === 'ASSIGNED' || s.status === 'ON_THE_WAY')
        );
        
        assignedServices.forEach(service => {
          const assignedDate = new Date(service.created_at);
          const hoursPending = Math.floor((today - assignedDate) / (1000 * 60 * 60));
          
          if (hoursPending > 24) {
            missing.push({
              employee_name: engineer.full_name || engineer.username,
              employee_id: engineer.id,
              role: 'SERVICE_ENGINEER',
              missing_item: `Service Update (${service.ticket_no || `TKT-${service.id}`})`,
              days_pending: Math.floor(hoursPending / 24),
              type: 'service_update',
              ticket_no: service.ticket_no
            });
          }
        });
      });

      setMissingReports(missing.sort((a, b) => b.days_pending - a.days_pending));
    } catch (error) {
      console.error('Failed to fetch missing reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = missingReports.filter(item => {
    if (filters.role !== 'ALL' && item.role !== filters.role) return false;
    if (filters.reportType !== 'ALL' && item.type !== filters.reportType) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        item.employee_name.toLowerCase().includes(search) ||
        item.missing_item.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return <div className="loading">⏳ Loading missing reports...</div>;
  }

  return (
    <div className="reception-page">
      <div className="page-header">
        <div>
          <h1>⚠️ Missing Reports</h1>
          <p className="subtitle">Ensure employee discipline (Read-only)</p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="summary-grid">
        <div className="summary-card total">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <div className="card-value">{missingReports.length}</div>
            <div className="card-label">Total Missing</div>
          </div>
        </div>
        <div className="summary-card daily">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <div className="card-value">
              {missingReports.filter(r => r.type === 'daily_report').length}
            </div>
            <div className="card-label">Daily Reports</div>
          </div>
        </div>
        <div className="summary-card service">
          <div className="card-icon">🔧</div>
          <div className="card-content">
            <div className="card-value">
              {missingReports.filter(r => r.type === 'service_update').length}
            </div>
            <div className="card-label">Service Updates</div>
          </div>
        </div>
        <div className="summary-card critical">
          <div className="card-icon">🔴</div>
          <div className="card-content">
            <div className="card-value">
              {missingReports.filter(r => r.days_pending > 2).length}
            </div>
            <div className="card-label">Critical (2+ days)</div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Employee name or item..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Role:</label>
          <select value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}>
            <option value="ALL">All</option>
            <option value="SALESMAN">Salesman</option>
            <option value="SERVICE_ENGINEER">Service Engineer</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Report Type:</label>
          <select value={filters.reportType} onChange={(e) => setFilters({...filters, reportType: e.target.value})}>
            <option value="ALL">All</option>
            <option value="daily_report">Daily Report</option>
            <option value="service_update">Service Update</option>
          </select>
        </div>

        <div className="filter-info">
          Showing {filteredReports.length} of {missingReports.length} missing items
        </div>
      </div>

      {/* MISSING REPORTS TABLE */}
      <div className="data-table-container">
        {filteredReports.length === 0 ? (
          <div className="empty-message">
            ✅ All reports submitted! No missing items found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Role</th>
                <th>Missing Item</th>
                <th>Days Pending</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((item, idx) => {
                const priorityClass = item.days_pending > 2 ? 'critical' : item.days_pending > 0 ? 'warning' : 'normal';
                return (
                  <tr key={idx} className={`row-${priorityClass}`}>
                    <td><strong>{item.employee_name}</strong></td>
                    <td>
                      <span className="role-badge">
                        {item.role === 'SALESMAN' ? '👔 Salesman' : '🔧 Service Engineer'}
                      </span>
                    </td>
                    <td>{item.missing_item}</td>
                    <td>
                      <span className={`days-badge ${priorityClass}`}>
                        {item.days_pending === 0 ? 'Today' : `${item.days_pending} day${item.days_pending > 1 ? 's' : ''}`}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge ${priorityClass}`}>
                        {priorityClass === 'critical' ? '🔴 Critical' : 
                         priorityClass === 'warning' ? '🟠 Warning' : '🟢 Normal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .reception-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #ecf0f1;
        }

        .page-header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 28px;
        }

        .subtitle {
          margin: 5px 0 0 0;
          color: #7f8c8d;
          font-size: 14px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .summary-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 15px;
          border-left: 4px solid;
        }

        .summary-card.total { border-color: #3498db; }
        .summary-card.daily { border-color: #9b59b6; }
        .summary-card.service { border-color: #f39c12; }
        .summary-card.critical { border-color: #e74c3c; }

        .card-icon {
          font-size: 36px;
        }

        .card-value {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50;
        }

        .card-label {
          font-size: 13px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filters-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          align-items: end;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #7f8c8d;
          text-transform: uppercase;
        }

        .filter-group input,
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          min-width: 180px;
        }

        .filter-info {
          margin-left: auto;
          padding: 8px 12px;
          background: #ecf0f1;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #2c3e50;
        }

        .data-table-container {
          background: white;
          border-radius: 12px;
          overflow-x: auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          min-height: 200px;
        }

        .empty-message {
          text-align: center;
          padding: 60px;
          font-size: 18px;
          color: #27ae60;
          font-weight: 600;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 14px;
          text-align: left;
          border-bottom: 1px solid #ecf0f1;
        }

        .data-table th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 12px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table tbody tr:hover {
          background: #f8f9fa;
        }

        .row-critical {
          background: #fff5f5;
        }

        .row-warning {
          background: #fff9e6;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          background: #ecf0f1;
          color: #2c3e50;
        }

        .days-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .days-badge.normal {
          background: #27ae60;
          color: white;
        }

        .days-badge.warning {
          background: #f39c12;
          color: white;
        }

        .days-badge.critical {
          background: #e74c3c;
          color: white;
        }

        .priority-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .priority-badge.normal {
          background: #27ae60;
          color: white;
        }

        .priority-badge.warning {
          background: #f39c12;
          color: white;
        }

        .priority-badge.critical {
          background: #e74c3c;
          color: white;
        }

        .loading {
          text-align: center;
          padding: 100px;
          font-size: 20px;
          color: #7f8c8d;
        }
      `}</style>
    </div>
  );
};

export default MissingReports;
