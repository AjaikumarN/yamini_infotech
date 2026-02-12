import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AdminSalesPerformance = () => {
  const [performance, setPerformance] = useState([]);
  const [funnel, setFunnel] = useState(null);
  const [missingReports, setMissingReports] = useState([]);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    product_id: null,
    priority: ''
  });
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [filters]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.product_id) queryParams.append('product_id', filters.product_id);
      if (filters.priority) queryParams.append('priority', filters.priority);

      const [performanceData, funnelData, missing] = await Promise.all([
        apiRequest(`/api/admin/sales-performance/?${queryParams}`),
        apiRequest(`/api/admin/sales-performance/funnel?${queryParams}`),
        apiRequest('/api/admin/sales-performance/missing-reports')
      ]);

      setPerformance(performanceData);
      setFunnel(funnelData);
      setMissingReports(missing);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewSalesmanDetails = async (salesmanId) => {
    try {
      const details = await apiRequest(`/api/admin/sales-performance/salesman/${salesmanId}`);
      setSelectedSalesman(details);
    } catch (error) {
      console.error('Failed to fetch salesman details:', error);
    }
  };

  const getTotalRevenue = () => {
    return performance.reduce((sum, s) => sum + s.revenue, 0);
  };

  const getTotalConversions = () => {
    return performance.reduce((sum, s) => sum + s.converted, 0);
  };

  const getAvgConversionRate = () => {
    if (performance.length === 0) return 0;
    const total = performance.reduce((sum, s) => sum + s.conversion_rate, 0);
    return (total / performance.length).toFixed(2);
  };

  if (loading) {
    return <div className="loading">⏳ Loading performance data...</div>;
  }

  return (
    <div className="admin-sales-performance">
      <div className="page-header">
        <h1>📊 Salesman Performance Dashboard</h1>
        <button className="btn-refresh" onClick={fetchPerformanceData}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters-panel">
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All Priorities</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="COLD">COLD</option>
          </select>
        </div>
        <button 
          className="btn-clear-filters"
          onClick={() => setFilters({ start_date: '', end_date: '', product_id: null, priority: '' })}
        >
          Clear Filters
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#667eea' }}>💰</div>
          <div className="card-content">
            <h3>₹{getTotalRevenue().toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#28a745' }}>✅</div>
          <div className="card-content">
            <h3>{getTotalConversions()}</h3>
            <p>Total Conversions</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#ffc107' }}>📈</div>
          <div className="card-content">
            <h3>{getAvgConversionRate()}%</h3>
            <p>Avg Conversion Rate</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#dc3545' }}>⚠️</div>
          <div className="card-content">
            <h3>{missingReports.length}</h3>
            <p>Missing Reports Today</p>
          </div>
        </div>
      </div>

      {/* Sales Funnel */}
      {funnel && (
        <div className="funnel-panel">
          <h2>📊 Sales Funnel Comparison</h2>
          <div className="funnel-stages">
            <div className="funnel-stage" style={{ width: '100%', background: '#667eea20' }}>
              <div className="stage-label">NEW</div>
              <div className="stage-count">{funnel.new}</div>
            </div>
            <div className="funnel-stage" style={{ width: '80%', background: '#17a2b820' }}>
              <div className="stage-label">CONTACTED</div>
              <div className="stage-count">{funnel.contacted}</div>
            </div>
            <div className="funnel-stage" style={{ width: '60%', background: '#ffc10720' }}>
              <div className="stage-label">FOLLOW-UP</div>
              <div className="stage-count">{funnel.followup}</div>
            </div>
            <div className="funnel-stage" style={{ width: '40%', background: '#fd7e1420' }}>
              <div className="stage-label">QUOTED</div>
              <div className="stage-count">{funnel.quoted}</div>
            </div>
            <div className="funnel-stage" style={{ width: '20%', background: '#28a74520' }}>
              <div className="stage-label">CONVERTED</div>
              <div className="stage-count">{funnel.converted}</div>
            </div>
            <div className="funnel-stage lost" style={{ width: '20%', background: '#dc354520' }}>
              <div className="stage-label">LOST</div>
              <div className="stage-count">{funnel.lost}</div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Table */}
      <div className="performance-table-panel">
        <h2>👥 Salesman Performance Metrics</h2>
        <div className="table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Salesman</th>
                <th>Assigned</th>
                <th>Converted</th>
                <th>Conversion %</th>
                <th>Revenue</th>
                <th>Avg Closing Days</th>
                <th>Missed Follow-ups</th>
                <th>Visits</th>
                <th>Lost</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((salesman) => (
                <tr key={salesman.salesman_id}>
                  <td className="salesman-name">{salesman.salesman_name}</td>
                  <td>{salesman.assigned}</td>
                  <td className="converted-count">{salesman.converted}</td>
                  <td>
                    <span className={`conversion-badge ${
                      salesman.conversion_rate >= 25 ? 'high' : 
                      salesman.conversion_rate >= 15 ? 'medium' : 'low'
                    }`}>
                      {salesman.conversion_rate}%
                    </span>
                  </td>
                  <td className="revenue">₹{salesman.revenue.toLocaleString()}</td>
                  <td>{salesman.avg_closing_days.toFixed(1)} days</td>
                  <td>
                    <span className={`missed-badge ${salesman.missed_followups > 0 ? 'has-missed' : ''}`}>
                      {salesman.missed_followups}
                    </span>
                  </td>
                  <td>{salesman.visit_count}</td>
                  <td className="lost-count">{salesman.lost_count}</td>
                  <td>
                    <button 
                      className="btn-view-details"
                      onClick={() => viewSalesmanDetails(salesman.salesman_id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Missing Reports Alert */}
      {missingReports.length > 0 && (
        <div className="missing-reports-panel">
          <h2>⚠️ Missing Daily Reports Today</h2>
          <div className="missing-list">
            {missingReports.map((salesman) => (
              <div key={salesman.id} className="missing-item">
                <span className="salesman-icon">👤</span>
                <span className="salesman-name">{salesman.name}</span>
                <span className="username">@{salesman.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salesman Details Modal */}
      {selectedSalesman && (
        <div className="modal-overlay" onClick={() => setSelectedSalesman(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 {selectedSalesman.salesman_name} - Detailed Performance</h2>
              <button className="close-btn" onClick={() => setSelectedSalesman(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Assigned Enquiries</label>
                  <span>{selectedSalesman.assigned}</span>
                </div>
                <div className="detail-item">
                  <label>Converted</label>
                  <span className="success">{selectedSalesman.converted}</span>
                </div>
                <div className="detail-item">
                  <label>Lost</label>
                  <span className="danger">{selectedSalesman.lost_count}</span>
                </div>
                <div className="detail-item">
                  <label>Conversion Rate</label>
                  <span className="highlight">{selectedSalesman.conversion_rate}%</span>
                </div>
                <div className="detail-item">
                  <label>Total Revenue</label>
                  <span className="revenue">₹{selectedSalesman.revenue.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Avg Closing Time</label>
                  <span>{selectedSalesman.avg_closing_days.toFixed(1)} days</span>
                </div>
                <div className="detail-item">
                  <label>Missed Follow-ups</label>
                  <span className="warning">{selectedSalesman.missed_followups}</span>
                </div>
                <div className="detail-item">
                  <label>Total Visits</label>
                  <span>{selectedSalesman.visit_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-sales-performance {
          padding: 30px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .page-header h1 {
          margin: 0;
          color: #1a1a1a;
          font-size: 32px;
        }

        .btn-refresh {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-refresh:hover {
          background: #5568d3;
        }

        .filters-panel {
          background: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 30px;
          display: flex;
          gap: 20px;
          align-items: end;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .filter-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .filter-group label {
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .filter-group input,
        .filter-group select {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
        }

        .btn-clear-filters {
          padding: 12px 24px;
          background: #f0f0f0;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .card-icon {
          width: 70px;
          height: 70px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }

        .card-content h3 {
          margin: 0;
          font-size: 28px;
          color: #1a1a1a;
        }

        .card-content p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 14px;
        }

        .funnel-panel {
          background: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .funnel-panel h2 {
          margin: 0 0 25px 0;
          color: #1a1a1a;
        }

        .funnel-stages {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .funnel-stage {
          padding: 20px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 2px solid rgba(0,0,0,0.1);
          transition: all 0.3s;
        }

        .funnel-stage:hover {
          transform: translateX(10px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .funnel-stage.lost {
          margin-left: auto;
        }

        .stage-label {
          font-weight: 700;
          color: #1a1a1a;
          font-size: 16px;
        }

        .stage-count {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
        }

        .performance-table-panel {
          background: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .performance-table-panel h2 {
          margin: 0 0 25px 0;
          color: #1a1a1a;
        }

        .table-container {
          overflow-x: auto;
        }

        .performance-table {
          width: 100%;
          border-collapse: collapse;
        }

        .performance-table thead {
          background: #f8f9fa;
        }

        .performance-table th {
          padding: 15px;
          text-align: left;
          font-weight: 700;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }

        .performance-table td {
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
        }

        .performance-table tbody tr:hover {
          background: #f8f9fa;
        }

        .salesman-name {
          font-weight: 600;
          color: #1a1a1a;
        }

        .converted-count {
          color: #28a745;
          font-weight: 600;
        }

        .conversion-badge {
          padding: 6px 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
        }

        .conversion-badge.high {
          background: #28a745;
          color: white;
        }

        .conversion-badge.medium {
          background: #ffc107;
          color: #1a1a1a;
        }

        .conversion-badge.low {
          background: #dc3545;
          color: white;
        }

        .revenue {
          font-weight: 700;
          color: #667eea;
        }

        .missed-badge {
          padding: 4px 10px;
          border-radius: 12px;
          background: #f0f0f0;
          font-weight: 600;
        }

        .missed-badge.has-missed {
          background: #dc3545;
          color: white;
        }

        .lost-count {
          color: #dc3545;
        }

        .btn-view-details {
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
        }

        .btn-view-details:hover {
          background: #5568d3;
        }

        .missing-reports-panel {
          background: white;
          padding: 30px;
          border-radius: 12px;
          border: 2px solid #dc3545;
          box-shadow: 0 2px 8px rgba(220, 53, 69, 0.2);
        }

        .missing-reports-panel h2 {
          margin: 0 0 20px 0;
          color: #dc3545;
        }

        .missing-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
        }

        .missing-item {
          padding: 15px;
          background: #fff5f5;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .salesman-icon {
          font-size: 24px;
        }

        .missing-item .salesman-name {
          font-weight: 600;
          color: #1a1a1a;
        }

        .username {
          color: #666;
          font-size: 13px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px;
          border-bottom: 2px solid #f0f0f0;
        }

        .modal-header h2 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: #999;
        }

        .modal-body {
          padding: 30px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 25px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-item label {
          font-weight: 600;
          color: #666;
          font-size: 13px;
          text-transform: uppercase;
        }

        .detail-item span {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .detail-item .success {
          color: #28a745;
        }

        .detail-item .danger {
          color: #dc3545;
        }

        .detail-item .warning {
          color: #ffc107;
        }

        .detail-item .highlight {
          color: #667eea;
        }

        .loading {
          text-align: center;
          padding: 100px 20px;
          font-size: 24px;
          color: #666;
        }

        @media (max-width: 1200px) {
          .summary-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .summary-cards,
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .filters-panel {
            flex-direction: column;
            align-items: stretch;
          }

          .table-container {
            overflow-x: scroll;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSalesPerformance;
