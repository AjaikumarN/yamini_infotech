import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const VisitorLog = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    status: 'ALL'
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [visitorForm, setVisitorForm] = useState({
    name: '',
    phone: '',
    purpose: '',
    whom_to_meet: '',
    in_time: new Date().toTimeString().slice(0, 5)
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const data = await apiRequest('/api/visitors/');
      setVisitors(data || []);
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVisitor = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/visitors', {
        method: 'POST',
        body: JSON.stringify(visitorForm)
      });
      setShowAddForm(false);
      setVisitorForm({
        name: '',
        phone: '',
        purpose: '',
        whom_to_meet: '',
        in_time: new Date().toTimeString().slice(0, 5)
      });
      fetchVisitors();
      alert('✅ Visitor added successfully!');
    } catch (error) {
      alert('❌ Failed to add visitor: ' + (error.message || ''));
    }
  };

  const markVisitorOut = async (visitorId) => {
    try {
      const outTime = new Date().toTimeString().slice(0, 5);
      await apiRequest(`/api/visitors/${visitorId}/checkout`, {
        method: 'PUT',
        body: JSON.stringify({ out_time: outTime })
      });
      fetchVisitors();
      alert('✅ Visitor marked out successfully!');
    } catch (error) {
      alert('❌ Failed to mark visitor out');
    }
  };

  const deleteVisitor = async (visitorId) => {
    if (!window.confirm('Are you sure you want to delete this visitor record?')) return;
    try {
      await apiRequest(`/api/visitors/${visitorId}`, { method: 'DELETE' });
      fetchVisitors();
      alert('✅ Visitor deleted successfully!');
    } catch (error) {
      alert('❌ Failed to delete visitor: ' + (error.message || ''));
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!(visitor.name.toLowerCase().includes(search) || 
            visitor.phone.includes(search) ||
            visitor.whom_to_meet.toLowerCase().includes(search))) {
        return false;
      }
    }
    if (filters.status !== 'ALL') {
      const hasOutTime = !!visitor.out_time;
      if (filters.status === 'IN' && hasOutTime) return false;
      if (filters.status === 'OUT' && !hasOutTime) return false;
    }
    if (filters.dateFrom) {
      const visitorDate = new Date(visitor.created_at || visitor.date);
      const fromDate = new Date(filters.dateFrom);
      if (visitorDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const visitorDate = new Date(visitor.created_at || visitor.date);
      const toDate = new Date(filters.dateTo);
      if (visitorDate > toDate) return false;
    }
    return true;
  });

  const todayVisitors = visitors.filter(v => {
    const visitorDate = new Date(v.created_at || v.date).toDateString();
    const today = new Date().toDateString();
    return visitorDate === today;
  });

  const currentlyIn = todayVisitors.filter(v => !v.out_time).length;

  if (loading) {
    return <div className="loading">⏳ Loading visitor log...</div>;
  }

  return (
    <div className="reception-page">
      <div className="page-header">
        <h1>🚶 Visitor Log</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          ➕ Add Visitor
        </button>
      </div>
      <p className="page-subtitle">Replacement of Visitor Entry Register</p>

      {/* STATISTICS */}
      <div className="stats-grid">
        <div className="stat-card today">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{todayVisitors.length}</div>
            <div className="stat-label">Today's Visitors</div>
          </div>
        </div>
        <div className="stat-card in">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-value">{currentlyIn}</div>
            <div className="stat-label">Currently IN</div>
          </div>
        </div>
        <div className="stat-card out">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-value">{todayVisitors.length - currentlyIn}</div>
            <div className="stat-label">Checked OUT</div>
          </div>
        </div>
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{visitors.length}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Name, phone, whom to meet..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="ALL">All</option>
            <option value="IN">Currently IN 🟢</option>
            <option value="OUT">Checked OUT 🔴</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date From:</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Date To:</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
          />
        </div>

        <div className="filter-info">
          Showing {filteredVisitors.length} of {visitors.length} records
        </div>
      </div>

      {/* VISITOR TABLE */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Visitor Name</th>
              <th>Phone</th>
              <th>Purpose</th>
              <th>Whom to Meet</th>
              <th>IN Time</th>
              <th>OUT Time</th>
              <th>Duration</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisitors.length === 0 ? (
              <tr><td colSpan="9" className="empty-state">No visitor records found</td></tr>
            ) : (
              filteredVisitors.map(visitor => {
                const inTime = visitor.in_time;
                const outTime = visitor.out_time;
                let duration = '-';
                if (inTime && outTime) {
                  const inMinutes = parseInt(inTime.split(':')[0]) * 60 + parseInt(inTime.split(':')[1]);
                  const outMinutes = parseInt(outTime.split(':')[0]) * 60 + parseInt(outTime.split(':')[1]);
                  const diff = outMinutes - inMinutes;
                  const hours = Math.floor(diff / 60);
                  const mins = diff % 60;
                  duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                }
                
                return (
                  <tr key={visitor.id}>
                    <td>{new Date(visitor.created_at || visitor.date).toLocaleDateString()}</td>
                    <td><strong>{visitor.name}</strong></td>
                    <td>{visitor.phone}</td>
                    <td>{visitor.purpose}</td>
                    <td>{visitor.whom_to_meet}</td>
                    <td className="time-badge in">{visitor.in_time}</td>
                    <td>
                      {visitor.out_time ? (
                        <span className="time-badge out">{visitor.out_time}</span>
                      ) : (
                        <span className="status-in">IN 🟢</span>
                      )}
                    </td>
                    <td>{duration}</td>
                    <td>
                      {!visitor.out_time && (
                        <button 
                          className="btn-out"
                          onClick={() => markVisitorOut(visitor.id)}
                        >
                          Mark OUT
                        </button>
                      )}
                      <button 
                        className="btn-delete"
                        onClick={() => deleteVisitor(visitor.id)}
                        title="Delete visitor"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD VISITOR MODAL */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🚶 Add Visitor</h3>
            <form onSubmit={addVisitor}>
              <div className="form-group">
                <label>Visitor Name *</label>
                <input
                  required
                  value={visitorForm.name}
                  onChange={(e) => setVisitorForm({...visitorForm, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  required
                  type="tel"
                  value={visitorForm.phone}
                  onChange={(e) => setVisitorForm({...visitorForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Purpose *</label>
                <input
                  required
                  placeholder="e.g., Business meeting, Enquiry, Service follow-up"
                  value={visitorForm.purpose}
                  onChange={(e) => setVisitorForm({...visitorForm, purpose: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Whom to Meet *</label>
                <input
                  required
                  placeholder="e.g., Sales Manager, Service Engineer"
                  value={visitorForm.whom_to_meet}
                  onChange={(e) => setVisitorForm({...visitorForm, whom_to_meet: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>IN Time</label>
                <input
                  type="time"
                  value={visitorForm.in_time}
                  onChange={(e) => setVisitorForm({...visitorForm, in_time: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .reception-page {
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 0;
          border-bottom: none;
          flex-shrink: 0;
          gap: 20px;
        }

        .page-header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 28px;
          flex: 0 0 auto;
        }

        .page-header .btn-primary {
          flex-shrink: 0;
          margin-left: auto;
        }

        .page-subtitle {
          margin: 5px 0 25px 0;
          color: #7f8c8d;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 15px;
          border-left: 4px solid;
        }

        .stat-card.today { border-color: #3498db; }
        .stat-card.in { border-color: #27ae60; }
        .stat-card.out { border-color: #e74c3c; }
        .stat-card.total { border-color: #9b59b6; }

        .stat-icon {
          font-size: 36px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50;
        }

        .stat-label {
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

        .time-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .time-badge.in {
          background: #d4edda;
          color: #155724;
        }

        .time-badge.out {
          background: #f8d7da;
          color: #721c24;
        }

        .status-in {
          color: #27ae60;
          font-weight: bold;
          font-size: 13px;
        }

        .btn-out {
          padding: 6px 12px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-out:hover {
          background: #c0392b;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px !important;
          color: #95a5a6;
          font-style: italic;
          font-size: 16px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          display: inline-block;
          width: auto;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin: 0 0 25px 0;
          color: #2c3e50;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          font-size: 13px;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
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

export default VisitorLog;
