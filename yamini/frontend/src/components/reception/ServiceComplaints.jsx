import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import AdminModeBanner from '../../admin/components/AdminModeBanner';

const ServiceComplaints = ({ mode = 'staff' }) => {
  const { user } = useContext(AuthContext);
  const isAdminMode = mode === 'admin';
  const [complaints, setComplaints] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'ALL',
    priority: 'ALL',
    search: '',
    engineer: 'ALL',
    slaStatus: 'ALL'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    machine_model: '',
    fault_description: '',
    priority: 'NORMAL',
    assigned_to: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsData, engineersData, customersData] = await Promise.all([
        apiRequest('/api/service-requests/'),
        apiRequest('/api/users?role=SERVICE_ENGINEER'),
        apiRequest('/api/customers/')
      ]);
      setComplaints(complaintsData || []);
      setEngineers(engineersData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createComplaint = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          ...serviceForm,
          assigned_to: serviceForm.assigned_to ? parseInt(serviceForm.assigned_to) : null
        })
      });
      setShowCreateForm(false);
      setServiceForm({
        customer_name: '',
        phone: '',
        email: '',
        company: '',
        address: '',
        machine_model: '',
        fault_description: '',
        priority: 'NORMAL',
        assigned_to: ''
      });
      fetchData();
      alert('✅ Service complaint created successfully!');
    } catch (error) {
      alert('❌ Failed to create complaint: ' + (error.message || ''));
    }
  };

  const assignEngineer = async (complaintId, engineerId) => {
    try {
      await apiRequest(`/api/service-requests/${complaintId}/assign?engineer_id=${engineerId}`, {
        method: 'PUT'
      });
      fetchData();
      alert('✅ Engineer assigned successfully!');
    } catch (error) {
      console.error('Assign error:', error);
      alert('❌ Failed to assign engineer: ' + (error.message || ''));
    }
  };

  const getSLAStatus = (complaint) => {
    if (complaint.status === 'COMPLETED' || complaint.status === 'CLOSED') {
      return { status: 'completed', text: 'Completed', class: 'completed' };
    }
    
    const slaHours = complaint.priority === 'CRITICAL' ? 2 : complaint.priority === 'URGENT' ? 6 : 24;
    const createdAt = new Date(complaint.created_at);
    const dueAt = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
    const now = new Date();
    const hoursLeft = Math.round((dueAt - now) / (1000 * 60 * 60));
    
    if (hoursLeft < 0) {
      return { status: 'overdue', text: `${Math.abs(hoursLeft)}h overdue`, class: 'overdue' };
    } else if (hoursLeft < 2) {
      return { status: 'warning', text: `${hoursLeft}h left`, class: 'warning' };
    } else {
      return { status: 'ok', text: `${hoursLeft}h left`, class: 'ok' };
    }
  };

  const filteredComplaints = complaints.filter(comp => {
    if (filters.status !== 'ALL' && comp.status !== filters.status) return false;
    if (filters.priority !== 'ALL' && comp.priority !== filters.priority) return false;
    if (filters.engineer !== 'ALL' && comp.assigned_to !== parseInt(filters.engineer)) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        (comp.customer_name || '').toLowerCase().includes(search) ||
        (comp.phone || '').includes(search) ||
        (comp.machine_model || '').toLowerCase().includes(search) ||
        (comp.ticket_no || '').toLowerCase().includes(search)
      );
    }
    if (filters.slaStatus !== 'ALL') {
      const sla = getSLAStatus(comp);
      if (filters.slaStatus !== sla.status) return false;
    }
    return true;
  });

  if (loading) {
    return <div className="loading">⏳ Loading service complaints...</div>;
  }

  return (
    <div className="reception-page">
      <div className="page-header">
        <h1>🔧 Service Complaints - Full Data</h1>
        {!isAdminMode && (
          <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
            ➕ Create Complaint
          </button>
        )}
      </div>
      <p className="page-subtitle">Replacement of Complaint notebook</p>

      {/* STATISTICS */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-value">{complaints.length}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-value">
            {complaints.filter(c => c.status !== 'COMPLETED' && c.status !== 'CLOSED').length}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card overdue">
          <div className="stat-value">
            {complaints.filter(c => getSLAStatus(c).status === 'overdue').length}
          </div>
          <div className="stat-label">SLA Overdue</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-value">
            {complaints.filter(c => c.status === 'COMPLETED').length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Ticket, customer, phone, machine..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="ALL">All</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_THE_WAY">On The Way</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Priority:</label>
          <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})}>
            <option value="ALL">All</option>
            <option value="NORMAL">Normal (24h)</option>
            <option value="URGENT">Urgent (6h)</option>
            <option value="CRITICAL">Critical (2h)</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Engineer:</label>
          <select value={filters.engineer} onChange={(e) => setFilters({...filters, engineer: e.target.value})}>
            <option value="ALL">All</option>
            {engineers.map(eng => (
              <option key={eng.id} value={eng.id}>{eng.full_name || eng.username}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>SLA Status:</label>
          <select value={filters.slaStatus} onChange={(e) => setFilters({...filters, slaStatus: e.target.value})}>
            <option value="ALL">All</option>
            <option value="overdue">Overdue</option>
            <option value="warning">Warning (&lt;2h)</option>
            <option value="ok">On Time</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-info">
          Showing {filteredComplaints.length} of {complaints.length} complaints
        </div>
      </div>

      {/* COMPLAINTS TABLE */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Machine Model</th>
              <th>Fault</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned Engineer</th>
              <th>SLA Due Time</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length === 0 ? (
              <tr><td colSpan="11" className="empty-state">No complaints found</td></tr>
            ) : (
              filteredComplaints.map(comp => {
                const sla = getSLAStatus(comp);
                return (
                  <tr key={comp.id} className={sla.class === 'overdue' ? 'row-overdue' : ''}>
                    <td><span className="ticket-badge">{comp.ticket_no || `TKT-${comp.id}`}</span></td>
                    <td><strong>{comp.customer_name}</strong></td>
                    <td>{comp.phone}</td>
                    <td>{comp.machine_model}</td>
                    <td className="fault-text">{comp.fault_description}</td>
                    <td>
                      <span className={`priority-badge ${comp.priority.toLowerCase()}`}>
                        {comp.priority === 'CRITICAL' ? '🔴' : comp.priority === 'URGENT' ? '🟠' : '🟢'} 
                        {comp.priority}
                      </span>
                    </td>
                    <td><span className={`status-badge ${comp.status}`}>{comp.status}</span></td>
                    <td>
                      {comp.assigned_to ? (
                        <span className="assigned-engineer">
                          {engineers.find(e => e.id === comp.assigned_to)?.full_name || 'Unknown'}
                        </span>
                      ) : (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              assignEngineer(comp.id, parseInt(e.target.value));
                              e.target.value = ''; // Reset dropdown
                            }
                          }}
                          defaultValue=""
                          className="assign-select"
                        >
                          <option value="">Assign Engineer...</option>
                          {engineers.map(e => (
                            <option key={e.id} value={e.id}>{e.full_name || e.username}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <span className={`sla-badge ${sla.class}`}>
                        {sla.class === 'overdue' && '⚠️ '}
                        {sla.text}
                      </span>
                    </td>
                    <td>{new Date(comp.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn-view" 
                        title="View details"
                        onClick={() => setSelectedComplaint(comp)}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* COMPLAINT DETAILS MODAL */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>🔧 Service Request Details</h3>
            <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
              <div className="detail-row">
                <strong>Ticket ID:</strong>
                <span>{selectedComplaint.ticket_no}</span>
              </div>
              <div className="detail-row">
                <strong>Customer:</strong>
                <span>{selectedComplaint.customer_name}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{selectedComplaint.phone}</span>
              </div>
              {selectedComplaint.email && (
                <div className="detail-row">
                  <strong>Email:</strong>
                  <span>{selectedComplaint.email}</span>
                </div>
              )}
              {selectedComplaint.company && (
                <div className="detail-row">
                  <strong>Company:</strong>
                  <span>{selectedComplaint.company}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>Machine Model:</strong>
                <span>{selectedComplaint.machine_model}</span>
              </div>
              <div className="detail-row">
                <strong>Fault Description:</strong>
                <span>{selectedComplaint.fault_description}</span>
              </div>
              {selectedComplaint.address && (
                <div className="detail-row">
                  <strong>Address:</strong>
                  <span>{selectedComplaint.address}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>Priority:</strong>
                <span className={`priority-badge ${selectedComplaint.priority.toLowerCase()}`}>
                  {selectedComplaint.priority}
                </span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${selectedComplaint.status}`}>
                  {selectedComplaint.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Assigned Engineer:</strong>
                <span>
                  {selectedComplaint.assigned_to 
                    ? engineers.find(e => e.id === selectedComplaint.assigned_to)?.full_name || 'Unknown'
                    : 'Not Assigned'}
                </span>
              </div>
              <div className="detail-row">
                <strong>Created:</strong>
                <span>{new Date(selectedComplaint.created_at).toLocaleString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}</span>
              </div>
              {selectedComplaint.completed_at && (
                <div className="detail-row">
                  <strong>Completed:</strong>
                  <span>{new Date(selectedComplaint.completed_at).toLocaleString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}</span>
                </div>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedComplaint(null)}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COMPLAINT MODAL */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🔧 Create Service Complaint</h3>
            <form onSubmit={createComplaint}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  required
                  value={serviceForm.customer_name}
                  onChange={(e) => setServiceForm({...serviceForm, customer_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  required
                  type="tel"
                  value={serviceForm.phone}
                  onChange={(e) => setServiceForm({...serviceForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={serviceForm.email}
                  onChange={(e) => setServiceForm({...serviceForm, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  placeholder="Company name (optional)"
                  value={serviceForm.company}
                  onChange={(e) => setServiceForm({...serviceForm, company: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  rows="2"
                  value={serviceForm.address}
                  onChange={(e) => setServiceForm({...serviceForm, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Machine Model *</label>
                <input
                  required
                  value={serviceForm.machine_model}
                  onChange={(e) => setServiceForm({...serviceForm, machine_model: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Fault Description *</label>
                <textarea
                  required
                  rows="3"
                  value={serviceForm.fault_description}
                  onChange={(e) => setServiceForm({...serviceForm, fault_description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Priority *</label>
                <select
                  required
                  value={serviceForm.priority}
                  onChange={(e) => setServiceForm({...serviceForm, priority: e.target.value})}
                >
                  <option value="NORMAL">🟢 Normal (24h SLA)</option>
                  <option value="URGENT">🟠 Urgent (6h SLA)</option>
                  <option value="CRITICAL">🔴 Critical (2h SLA)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assign Engineer (Optional)</label>
                <select
                  value={serviceForm.assigned_to}
                  onChange={(e) => setServiceForm({...serviceForm, assigned_to: e.target.value})}
                >
                  <option value="">-- Select Engineer --</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>
                      {eng.full_name || eng.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .reception-page {
          padding: 20px;
          max-width: 1800px;
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
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          text-align: center;
          border-left: 4px solid;
        }

        .stat-card.total { border-color: #3498db; }
        .stat-card.pending { border-color: #f39c12; }
        .stat-card.overdue { border-color: #e74c3c; }
        .stat-card.completed { border-color: #27ae60; }

        .stat-value {
          font-size: 36px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
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
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .data-table tbody tr:hover {
          background: #f8f9fa;
        }

        .row-overdue {
          background: #fff5f5 !important;
        }

        .ticket-badge {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .fault-text {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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

        .priority-badge.urgent {
          background: #f39c12;
          color: white;
        }

        .priority-badge.critical {
          background: #e74c3c;
          color: white;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.ASSIGNED { background: #3498db; color: white; }
        .status-badge.ON_THE_WAY { background: #9b59b6; color: white; }
        .status-badge.IN_PROGRESS { background: #f39c12; color: white; }
        .status-badge.ON_HOLD { background: #95a5a6; color: white; }
        .status-badge.COMPLETED { background: #27ae60; color: white; }

        .assigned-engineer {
          color: #2c3e50;
          font-weight: 500;
        }

        .assign-select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
        }

        .sla-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .sla-badge.overdue {
          background: #e74c3c;
          color: white;
        }

        .sla-badge.warning {
          background: #f39c12;
          color: white;
        }

        .sla-badge.ok {
          background: #27ae60;
          color: white;
        }

        .sla-badge.completed {
          background: #95a5a6;
          color: white;
        }

        .btn-view {
          padding: 6px 10px;
          background: #ecf0f1;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .btn-view:hover {
          background: #bdc3c7;
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
          max-width: 600px;
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
      `}</style>
    </div>
  );
};

export default ServiceComplaints;
