import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const RepeatComplaints = () => {
  const [repeatComplaints, setRepeatComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    minCount: 2,
    days: 30
  });

  useEffect(() => {
    fetchRepeatComplaints();
  }, [filters.days, filters.minCount]);

  const fetchRepeatComplaints = async () => {
    try {
      const complaints = await apiRequest('/api/service-requests/');
      
      // Group by customer + machine
      const grouped = {};
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.days);
      
      (complaints || []).forEach(c => {
        const complaintDate = new Date(c.created_at);
        if (complaintDate >= cutoffDate) {
          const key = `${c.customer_name}_${c.machine_model}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(c);
        }
      });
      
      // Filter repeats
      const repeats = Object.entries(grouped)
        .filter(([_, complaints]) => complaints.length >= filters.minCount)
        .map(([key, complaints]) => {
          complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          return {
            customer_name: complaints[0].customer_name,
            phone: complaints[0].phone,
            machine_model: complaints[0].machine_model,
            count: complaints.length,
            last_complaint_date: complaints[0].created_at,
            first_complaint_date: complaints[complaints.length - 1].created_at,
            complaints: complaints,
            status: complaints[0].status
          };
        })
        .sort((a, b) => b.count - a.count);
      
      setRepeatComplaints(repeats);
    } catch (error) {
      console.error('Failed to fetch repeat complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRepeats = repeatComplaints.filter(item => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        item.customer_name.toLowerCase().includes(search) ||
        item.machine_model.toLowerCase().includes(search) ||
        (item.phone || '').includes(search)
      );
    }
    return true;
  });

  const getRiskLevel = (count) => {
    if (count >= 5) return { level: 'critical', label: 'Critical', color: '#e74c3c' };
    if (count >= 3) return { level: 'high', label: 'High', color: '#f39c12' };
    return { level: 'medium', label: 'Medium', color: '#3498db' };
  };

  if (loading) {
    return <div className="loading">⏳ Loading repeat complaint data...</div>;
  }

  return (
    <div className="reception-page">
      <div className="page-header">
        <div>
          <h1>⚠️ Repeat Complaint Alert</h1>
          <p className="subtitle">Detect customers with frequent complaints (Read-only)</p>
        </div>
      </div>

      {/* ALERT SUMMARY */}
      <div className="alert-summary">
        <div className="summary-item critical">
          <div className="summary-value">{repeatComplaints.filter(r => r.count >= 5).length}</div>
          <div className="summary-label">Critical (5+)</div>
        </div>
        <div className="summary-item high">
          <div className="summary-value">{repeatComplaints.filter(r => r.count >= 3 && r.count < 5).length}</div>
          <div className="summary-label">High (3-4)</div>
        </div>
        <div className="summary-item medium">
          <div className="summary-value">{repeatComplaints.filter(r => r.count === 2).length}</div>
          <div className="summary-label">Medium (2)</div>
        </div>
        <div className="summary-item total">
          <div className="summary-value">{repeatComplaints.length}</div>
          <div className="summary-label">Total Alerts</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Customer name, machine, phone..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Time Period:</label>
          <select value={filters.days} onChange={(e) => setFilters({...filters, days: parseInt(e.target.value)})}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Minimum Count:</label>
          <select value={filters.minCount} onChange={(e) => setFilters({...filters, minCount: parseInt(e.target.value)})}>
            <option value={2}>2+ complaints</option>
            <option value={3}>3+ complaints</option>
            <option value={4}>4+ complaints</option>
            <option value={5}>5+ complaints</option>
          </select>
        </div>

        <div className="filter-info">
          Showing {filteredRepeats.length} repeat complaint alerts
        </div>
      </div>

      {/* REPEAT COMPLAINTS CARDS */}
      {filteredRepeats.length === 0 ? (
        <div className="empty-message">
          ✅ No repeat complaints detected within the selected period
        </div>
      ) : (
        <div className="repeat-cards-grid">
          {filteredRepeats.map((item, idx) => {
            const risk = getRiskLevel(item.count);
            return (
              <div key={idx} className="repeat-card" style={{ borderLeftColor: risk.color }}>
                <div className="card-header">
                  <div className="customer-info">
                    <h3>{item.customer_name}</h3>
                    {item.phone && <div className="phone">📞 {item.phone}</div>}
                  </div>
                  <div className={`risk-badge ${risk.level}`} style={{ background: risk.color }}>
                    {risk.label}
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Machine Model:</span>
                    <span className="value">{item.machine_model}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">Complaint Count:</span>
                    <span className="value highlight">{item.count} complaints</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">First Complaint:</span>
                    <span className="value">{new Date(item.first_complaint_date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">Last Complaint:</span>
                    <span className="value">{new Date(item.last_complaint_date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">Current Status:</span>
                    <span className={`status-badge ${item.status}`}>{item.status}</span>
                  </div>
                </div>
                
                <div className="card-footer">
                  <details className="complaint-details">
                    <summary>View all {item.count} complaints ▼</summary>
                    <div className="complaints-list">
                      {item.complaints.map(c => (
                        <div key={c.id} className="complaint-item">
                          <div className="complaint-header">
                            <span className="ticket-id">{c.ticket_no || `TKT-${c.id}`}</span>
                            <span className="complaint-date">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="complaint-fault">{c.fault_description}</div>
                          <div className="complaint-status">
                            <span className={`mini-badge ${c.status}`}>{c.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .reception-page {
          padding: 20px;
          max-width: 1600px;
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

        .alert-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .summary-item {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          text-align: center;
          border-left: 4px solid;
        }

        .summary-item.critical { border-color: #e74c3c; }
        .summary-item.high { border-color: #f39c12; }
        .summary-item.medium { border-color: #3498db; }
        .summary-item.total { border-color: #2c3e50; }

        .summary-value {
          font-size: 36px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .summary-label {
          font-size: 13px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filters-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
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

        .empty-message {
          background: white;
          padding: 60px;
          border-radius: 12px;
          text-align: center;
          font-size: 18px;
          color: #27ae60;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .repeat-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .repeat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border-left: 4px solid;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .repeat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px solid #ecf0f1;
        }

        .customer-info h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 18px;
        }

        .phone {
          font-size: 13px;
          color: #7f8c8d;
        }

        .risk-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          color: white;
        }

        .card-body {
          margin-bottom: 15px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #ecf0f1;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row .label {
          font-size: 13px;
          color: #7f8c8d;
          font-weight: 500;
        }

        .info-row .value {
          font-size: 13px;
          color: #2c3e50;
          font-weight: 600;
        }

        .info-row .value.highlight {
          color: #e74c3c;
          font-size: 15px;
        }

        .status-badge {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          color: white;
        }

        .status-badge.ASSIGNED { background: #3498db; }
        .status-badge.IN_PROGRESS { background: #f39c12; }
        .status-badge.COMPLETED { background: #27ae60; }
        .status-badge.ON_HOLD { background: #95a5a6; }

        .card-footer {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #ecf0f1;
        }

        .complaint-details summary {
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #3498db;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;
          user-select: none;
        }

        .complaint-details summary:hover {
          background: #ecf0f1;
        }

        .complaints-list {
          margin-top: 10px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .complaint-item {
          padding: 10px;
          background: white;
          border-radius: 4px;
          margin-bottom: 8px;
          border-left: 3px solid #3498db;
        }

        .complaint-item:last-child {
          margin-bottom: 0;
        }

        .complaint-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .ticket-id {
          font-size: 11px;
          font-weight: bold;
          color: #3498db;
        }

        .complaint-date {
          font-size: 11px;
          color: #7f8c8d;
        }

        .complaint-fault {
          font-size: 12px;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .mini-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          color: white;
        }

        .mini-badge.ASSIGNED { background: #3498db; }
        .mini-badge.IN_PROGRESS { background: #f39c12; }
        .mini-badge.COMPLETED { background: #27ae60; }

        .loading {
          text-align: center;
          padding: 100px;
          font-size: 20px;
          color: #7f8c8d;
        }

        @media (max-width: 768px) {
          .repeat-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RepeatComplaints;
