import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import AdminModeBanner from '../../admin/components/AdminModeBanner';

const EnquiryBoard = ({ mode = 'staff' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdminMode = mode === 'admin' || user?.role === 'ADMIN';
  
  const [enquiries, setEnquiries] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priority: 'ALL',
    status: 'ALL',
    source: 'ALL',
    search: ''
  });
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedEnquiryForFollowUp, setSelectedEnquiryForFollowUp] = useState(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [newEnquiry, setNewEnquiry] = useState({
    customer_name: '',
    phone: '',
    email: '',
    product_interest: '',
    source: 'website',
    priority: 'WARM',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enquiriesData, salesmenData] = await Promise.all([
        apiRequest('/api/enquiries/'),
        apiRequest('/api/users/salesmen/')
      ]);
      setEnquiries(enquiriesData || []);
      setSalesmen(salesmenData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEnquiry = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/enquiries/', {
        method: 'POST',
        body: JSON.stringify(newEnquiry)
      });
      setShowCreateForm(false);
      setNewEnquiry({
        customer_name: '',
        phone: '',
        email: '',
        product_interest: '',
        source: 'website',
        priority: 'WARM',
        notes: ''
      });
      fetchData();
      alert('✅ Enquiry created successfully!');
    } catch (error) {
      alert('❌ Failed to create enquiry: ' + (error.message || ''));
    }
  };

  const assignSalesman = async (enquiryId, salesmanId) => {
    try {
      await apiRequest(`/api/enquiries/${enquiryId}`, {
        method: 'PUT',
        body: JSON.stringify({ assigned_to: salesmanId, status: 'ASSIGNED' })
      });
      fetchData();
      alert('✅ Salesman assigned successfully!');
    } catch (error) {
      alert('❌ Failed to assign salesman');
    }
  };

  const updatePriority = async (enquiryId, priority) => {
    try {
      await apiRequest(`/api/enquiries/${enquiryId}`, {
        method: 'PUT',
        body: JSON.stringify({ priority })
      });
      fetchData();
    } catch (error) {
      alert('❌ Failed to update priority');
    }
  };

  const addFollowUpNote = async (enquiryId) => {
    setSelectedEnquiryForFollowUp(enquiryId);
    setFollowUpDate('');
    setShowFollowUpModal(true);
  };

  const deleteEnquiry = async (enquiryId) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await apiRequest(`/api/enquiries/${enquiryId}`, { method: 'DELETE' });
      fetchData();
      alert('✅ Enquiry deleted successfully!');
    } catch (error) {
      alert('❌ Failed to delete enquiry: ' + (error.message || ''));
    }
  };

  const submitFollowUp = async () => {
    if (!followUpDate) {
      alert('❌ Please select a date');
      return;
    }

    try {
      // Convert date string to datetime (add 09:00 AM as default time)
      const followUpDateTime = `${followUpDate}T09:00:00`;
      
      await apiRequest('/api/enquiries/followups', {
        method: 'POST',
        body: JSON.stringify({
          enquiry_id: selectedEnquiryForFollowUp,
          note: `Follow-up scheduled for ${followUpDate}`,
          followup_date: followUpDateTime,
          note_type: 'follow_up'
        })
      });
      alert('✅ Follow-up scheduled');
      setShowFollowUpModal(false);
      setFollowUpDate('');
      setSelectedEnquiryForFollowUp(null);
      fetchData();
    } catch (error) {
      alert('❌ Failed to add note');
    }
  };

  const filteredEnquiries = enquiries.filter(enq => {
    if (filters.priority !== 'ALL' && enq.priority !== filters.priority) return false;
    if (filters.status !== 'ALL' && enq.status !== filters.status) return false;
    if (filters.source !== 'ALL' && enq.source !== filters.source) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        enq.customer_name.toLowerCase().includes(search) ||
        enq.phone.includes(search) ||
        (enq.product_interest || '').toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return <div className="loading">⏳ Loading enquiry data...</div>;
  }

  return (
    <div className="reception-page">
      
      <div className="page-header">
        <h1>📋 Enquiry Board - Full Data</h1>
        {!isAdminMode && (
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            ➕ Create Enquiry
          </button>
        )}
      </div>
      <p className="page-subtitle">Digital replacement of Enquiry Register notebook</p>

      {/* FILTERS */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Customer name, phone, product..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Priority:</label>
          <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})}>
            <option value="ALL">All</option>
            <option value="HOT">🔥 HOT</option>
            <option value="WARM">☀️ WARM</option>
            <option value="COLD">❄️ COLD</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="ALL">All</option>
            <option value="NEW">NEW</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="FOLLOW_UP">FOLLOW UP</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="LOST">LOST</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Source:</label>
          <select value={filters.source} onChange={(e) => setFilters({...filters, source: e.target.value})}>
            <option value="ALL">All</option>
            <option value="website">Website</option>
            <option value="call">Call</option>
            <option value="walk-in">Walk-in</option>
          </select>
        </div>

        <div className="filter-info">
          Showing {filteredEnquiries.length} of {enquiries.length} enquiries
        </div>
      </div>

      {/* ENQUIRY TABLE */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Enquiry ID</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Product</th>
              <th>Source</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned Salesman</th>
              <th>Last Follow-up</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnquiries.length === 0 ? (
              <tr><td colSpan="11" className="empty-state">No enquiries found</td></tr>
            ) : (
              filteredEnquiries.map(enq => (
                <tr key={enq.id}>
                  <td><span className="id-badge">{enq.enquiry_id || `ENQ-${enq.id}`}</span></td>
                  <td><strong>{enq.customer_name}</strong></td>
                  <td>{enq.phone}</td>
                  <td>{enq.product_interest || 'Not specified'}</td>
                  <td>
                    <span className={`source-badge ${enq.source}`}>
                      {enq.source === 'website' ? '🌐' : enq.source === 'call' ? '📞' : '🚶'} 
                      {enq.source}
                    </span>
                  </td>
                  <td>
                    <select
                      value={enq.priority}
                      onChange={(e) => updatePriority(enq.id, e.target.value)}
                      className={`priority-select ${enq.priority.toLowerCase()}`}
                    >
                      <option value="HOT">🔥 HOT</option>
                      <option value="WARM">☀️ WARM</option>
                      <option value="COLD">❄️ COLD</option>
                    </select>
                  </td>
                  <td><span className={`status-badge ${enq.status}`}>{enq.status}</span></td>
                  <td>
                    {enq.assigned_to ? (
                      <span className="assigned-to">
                        {salesmen.find(s => s.id === enq.assigned_to)?.full_name || 'Unknown'}
                      </span>
                    ) : (
                      <select
                        onChange={(e) => assignSalesman(enq.id, parseInt(e.target.value))}
                        defaultValue=""
                        className="assign-select"
                      >
                        <option value="">Assign...</option>
                        {salesmen.map(s => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>{enq.last_follow_up ? new Date(enq.last_follow_up).toLocaleDateString() : '-'}</td>
                  <td>{new Date(enq.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-action" 
                      onClick={() => addFollowUpNote(enq.id)}
                      title="Add follow-up note"
                    >
                      📝
                    </button>
                    <button 
                      className="btn-action btn-delete" 
                      onClick={() => deleteEnquiry(enq.id)}
                      title="Delete enquiry"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE ENQUIRY MODAL */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>➕ Create New Enquiry</h3>
            <form onSubmit={createEnquiry}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    required
                    value={newEnquiry.customer_name}
                    onChange={(e) => setNewEnquiry({...newEnquiry, customer_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    required
                    type="tel"
                    value={newEnquiry.phone}
                    onChange={(e) => setNewEnquiry({...newEnquiry, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newEnquiry.email}
                    onChange={(e) => setNewEnquiry({...newEnquiry, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Product Interest *</label>
                  <input
                    required
                    value={newEnquiry.product_interest}
                    onChange={(e) => setNewEnquiry({...newEnquiry, product_interest: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Source *</label>
                  <select
                    value={newEnquiry.source}
                    onChange={(e) => setNewEnquiry({...newEnquiry, source: e.target.value})}
                  >
                    <option value="website">🌐 Website</option>
                    <option value="call">📞 Call</option>
                    <option value="walk-in">🚶 Walk-in</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority *</label>
                  <select
                    value={newEnquiry.priority}
                    onChange={(e) => setNewEnquiry({...newEnquiry, priority: e.target.value})}
                  >
                    <option value="HOT">🔥 HOT</option>
                    <option value="WARM">☀️ WARM</option>
                    <option value="COLD">❄️ COLD</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows="3"
                  value={newEnquiry.notes}
                  onChange={(e) => setNewEnquiry({...newEnquiry, notes: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFollowUpModal && (
        <div className="modal-overlay" onClick={() => setShowFollowUpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Schedule Follow-up</h2>
            <div className="form-group">
              <label>Select Follow-up Date *</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  width: '100%'
                }}
              />
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowFollowUpModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={submitFollowUp}
              >
                Schedule Follow-up
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .reception-page {
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
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
          margin: 5px 0 20px 0;
          color: #7f8c8d;
          font-size: 14px;
        }

        .subtitle {
          margin: 5px 0 0 0;
          color: #7f8c8d;
          font-size: 14px;
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
          flex-shrink: 0;
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
          min-width: 150px;
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
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          flex: 1;
          overflow: auto;
          min-height: 0;
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
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .data-table tbody tr:hover {
          background: #f8f9fa;
        }

        .id-badge {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .source-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .source-badge.website {
          background: #3498db;
          color: white;
        }

        .source-badge.call {
          background: #27ae60;
          color: white;
        }

        .source-badge.walk-in {
          background: #9b59b6;
          color: white;
        }

        .priority-select {
          padding: 4px 8px;
          border: 2px solid;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
        }

        .priority-select.hot {
          border-color: #e74c3c;
          background: #fff5f5;
          color: #e74c3c;
        }

        .priority-select.warm {
          border-color: #f39c12;
          background: #fff9e6;
          color: #f39c12;
        }

        .priority-select.cold {
          border-color: #3498db;
          background: #f0f8ff;
          color: #3498db;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.NEW {
          background: #3498db;
          color: white;
        }

        .status-badge.ASSIGNED {
          background: #f39c12;
          color: white;
        }

        .status-badge.FOLLOW_UP {
          background: #9b59b6;
          color: white;
        }

        .status-badge.CONVERTED {
          background: #27ae60;
          color: white;
        }

        .status-badge.LOST {
          background: #95a5a6;
          color: white;
        }

        .assigned-to {
          color: #2c3e50;
          font-weight: 500;
        }

        .assign-select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
        }

        .btn-action {
          padding: 6px 10px;
          background: #ecf0f1;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .btn-action:hover {
          background: #bdc3c7;
          transform: scale(1.1);
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
          white-space: nowrap;
          display: inline-block;
          width: auto;
          flex-shrink: 0;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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
          max-width: 700px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h3 {
          margin: 0 0 25px 0;
          color: #2c3e50;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
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

        @media (max-width: 1200px) {
          .data-table-container {
            overflow-x: auto;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EnquiryBoard;
