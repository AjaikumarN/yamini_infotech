import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

export default function ServiceRequestsTable() {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requests, engineersData] = await Promise.all([
        apiRequest('/api/service-requests'),
        apiRequest('/api/users?role=SERVICE_ENGINEER')
      ]);
      
      console.log('Service Requests Data:', requests); // Debug log
      console.log('First request completed_at:', requests[0]?.completed_at); // Debug log
      console.log('Engineers Data:', engineersData); // Check what's being returned
      setServiceRequests(requests || []);
      setEngineers(engineersData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setServiceRequests([]);
      setEngineers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (requestId, engineerId) => {
    if (!engineerId) {
      showToast('Please select an engineer', 'error');
      return;
    }

    try {
      await apiRequest(`/api/service-requests/${requestId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ engineer_id: engineerId })
      });
      showToast('Engineer assigned successfully!', 'success');
      fetchData(); // Refresh
    } catch (error) {
      console.error('Failed to assign engineer:', error);
      showToast('Failed to assign engineer', 'error');
    }
  };

  const handlePriorityChange = async (requestId, newPriority) => {
    try {
      await apiRequest(`/api/service-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ priority: newPriority })
      });
      showToast('Priority updated!', 'success');
      fetchData();
    } catch (error) {
      console.error('Failed to update priority:', error);
      showToast('Failed to update priority', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 99999;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Filter logic
  const filteredRequests = serviceRequests
    .filter(req => {
      const matchesSearch = !searchTerm || 
        req.id?.toString().includes(searchTerm) ||
        req.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.phone?.includes(searchTerm);
      
      const matchesStatus = !filterStatus || req.status === filterStatus;
      const matchesPriority = !filterPriority || req.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    })
    // Sort by updated_at (most recent first), fallback to created_at
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB - dateA; // Descending order (newest first)
    })
    // Limit to last 5 updated records
    .slice(0, 5);

  const getPriorityColor = (priority) => {
    switch(priority?.toUpperCase()) {
      case 'CRITICAL': return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
      case 'URGENT': return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
      case 'NORMAL': return { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc' };
      default: return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'NEW': return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
      case 'ASSIGNED': return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
      case 'IN_PROGRESS': return { bg: '#e9d5ff', color: '#6b21a8', border: '#c084fc' };
      case 'COMPLETED': return { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' };
      case 'ON_HOLD': return { bg: '#fecaca', color: '#991b1b', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  // Check if request is repeat (same customer + machine in last 30 days)
  const isRepeat = (request) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return serviceRequests.filter(req => 
      req.id !== request.id &&
      req.customer_name === request.customer_name &&
      req.machine_model === request.machine_model &&
      new Date(req.created_at) > thirtyDaysAgo
    ).length > 0;
  };

  // Check SLA risk (NEW > 2hrs, ASSIGNED > 4hrs)
  const isSLARisk = (request) => {
    if (request.status === 'COMPLETED') return false;
    
    const createdAt = new Date(request.created_at);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

    if (request.status === 'NEW' && hoursDiff > 2) return true;
    if (request.status === 'ASSIGNED' && hoursDiff > 4) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#64748b' }}>Loading service requests...</div>
      </div>
    );
  }

  return (
    <div>
      {/* FILTERS */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search ticket, customer, phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1 1 300px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '14px'
          }}
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            background: 'white'
          }}
        >
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="ON_HOLD">On Hold</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            background: 'white'
          }}
        >
          <option value="">All Priority</option>
          <option value="NORMAL">Normal</option>
          <option value="URGENT">Urgent</option>
          <option value="CRITICAL">Critical</option>
        </select>

        <button
          onClick={fetchData}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#6366f1',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* TABLE */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '900px'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>Ticket</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Issue</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Completed</th>
                <th style={thStyle}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontWeight: '600'
                  }}>
                    No service requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map(request => {
                  const priorityStyle = getPriorityColor(request.priority);
                  const statusStyle = getStatusColor(request.status);
                  const createdDate = new Date(request.created_at);
                  const completedDate = request.completed_at ? new Date(request.completed_at) : null;
                  
                  // Debug logging for COMPLETED status
                  if (request.status === 'COMPLETED') {
                    console.log(`Ticket ${request.ticket_no}:`, {
                      completed_at: request.completed_at,
                      completedDate,
                      created_at: request.created_at,
                      createdDate
                    });
                  }
                  
                  // Calculate duration in hours
                  let duration = '-';
                  if (completedDate) {
                    const hours = Math.floor((completedDate - createdDate) / (1000 * 60 * 60));
                    const minutes = Math.floor(((completedDate - createdDate) % (1000 * 60 * 60)) / (1000 * 60));
                    duration = `${hours}h ${minutes}m`;
                  }

                  return (
                    <tr key={request.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.2s',
                      cursor: 'pointer'
                    }} onClick={() => setSelectedRequest(request)}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>
                          {request.ticket_no}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: '600' }}>{request.customer_name}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '13px', color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {request.description || 'N/A'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`
                        }}>
                          {request.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: priorityStyle.bg,
                          color: priorityStyle.color,
                          border: `1px solid ${priorityStyle.border}`
                        }}>
                          {request.priority || 'NORMAL'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          {createdDate.toLocaleDateString()}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '13px', color: completedDate ? '#1e293b' : '#cbd5e1' }}>
                          {completedDate ? completedDate.toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '13px', color: duration === '-' ? '#cbd5e1' : '#1e293b', fontWeight: duration === '-' ? '400' : '600' }}>
                          {duration}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f8fafc',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#64748b',
        fontWeight: '600'
      }}>
        Showing {filteredRequests.length} of {serviceRequests.length} requests
      </div>

      {/* DETAILS MODAL */}
      {selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                Ticket #{selectedRequest.id}
              </h2>
              <button 
                onClick={() => setSelectedRequest(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Customer Info */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  {selectedRequest.customer_name}
                </p>
              </div>

              {/* Phone */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Phone</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#1e293b' }}>
                  {selectedRequest.phone || 'N/A'}
                </p>
              </div>

              {/* Machine */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Machine Model</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                  {selectedRequest.machine_model}
                </p>
              </div>

              {/* Description */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Issue Description</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#334155', lineHeight: '1.5' }}>
                  {selectedRequest.description || 'No description provided'}
                </p>
              </div>

              {/* Priority */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Priority</label>
                <div style={{ margin: '8px 0 0 0' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getPriorityColor(selectedRequest.priority).bg,
                    color: getPriorityColor(selectedRequest.priority).color,
                    border: `1px solid ${getPriorityColor(selectedRequest.priority).border}`
                  }}>
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</label>
                <div style={{ margin: '8px 0 0 0' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getStatusColor(selectedRequest.status).bg,
                    color: getStatusColor(selectedRequest.status).color,
                    border: `1px solid ${getStatusColor(selectedRequest.status).border}`
                  }}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {/* Assigned Engineer */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Assigned Engineer</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#1e293b' }}>
                  {selectedRequest.engineer_name || 'Not assigned'}
                </p>
              </div>

              {/* Created Date */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Created</label>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedRequest(null)}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '800',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: '14px',
  color: '#1e293b'
};
