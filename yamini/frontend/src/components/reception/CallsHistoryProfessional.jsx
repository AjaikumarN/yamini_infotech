import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';

/**
 * Professional CRM Call Management
 * 
 * DESIGN PHILOSOPHY:
 * - All Calls: ONE row per customer (latest state only) - NO DUPLICATES
 * - Follow-ups: Pending tasks only
 * - Call History: Complete timeline per customer
 * 
 * Tabs:
 * 1. Log New Call
 * 2. All Calls (Leads - unique customers)
 * 3. Follow-Ups (Pending only)
 * 4. Today's Activity (Call logs)
 */
const CallsHistoryProfessional = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);  // All unique customers
  const [followups, setFollowups] = useState([]);  // Pending follow-ups
  const [todayLogs, setTodayLogs] = useState([]);  // Today's call logs
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('all-calls');  // all-calls, follow-ups, today-activity, new-call
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  
  const [callForm, setCallForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    product_name: '',
    call_type: 'New Lead',
    notes: '',
    call_outcome: 'NOT_INTERESTED'
  });

  const [followupForm, setFollowupForm] = useState({
    product_condition: '',
    call_outcome: '',
    notes: ''
  });

  const DAILY_TARGET = 40;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, leadsData, followupsData, todayLogsData] = await Promise.all([
        apiRequest('/api/reception/stats'),
        apiRequest('/api/reception/leads'),
        apiRequest('/api/reception/follow-ups'),
        apiRequest('/api/reception/calls/today')
      ]);
      
      setStats(statsData);
      setLeads(leadsData || []);
      setFollowups(followupsData || []);
      setTodayLogs(todayLogsData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logCall = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/reception/calls/log', {
        method: 'POST',
        body: JSON.stringify(callForm)
      });
      // Also sync to old call system for dashboard consistency
      try {
        await apiRequest('/api/calls/', {
          method: 'POST',
          body: JSON.stringify(callForm)
        });
      } catch (syncErr) {
        console.warn('Old call system sync skipped:', syncErr);
      }
      
      setCallForm({
        customer_name: '',
        phone: '',
        email: '',
        address: '',
        product_name: '',
        call_type: 'New Lead',
        notes: '',
        call_outcome: 'NOT_INTERESTED'
      });
      fetchData();
      setActiveTab('all-calls');  // Redirect to All Calls after logging
      alert('✅ Call logged successfully!');
    } catch (error) {
      console.error('Failed to log call:', error);
      alert('❌ Failed to log call');
    }
  };

  const openFollowupModal = (lead) => {
    setSelectedLead(lead);
    setFollowupForm({
      product_condition: lead.current_outcome === 'PURCHASED' ? 'WORKING_FINE' : '',
      call_outcome: lead.current_outcome === 'INTERESTED_BUY_LATER' ? 'INTERESTED_BUY_LATER' : '',
      notes: ''
    });
    setShowFollowupModal(true);
  };

  const completeFollowup = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        lead_id: selectedLead.id,
        notes: followupForm.notes
      };

      if (selectedLead.current_outcome === 'PURCHASED') {
        payload.product_condition = followupForm.product_condition;
      } else if (selectedLead.current_outcome === 'INTERESTED_BUY_LATER') {
        payload.call_outcome = followupForm.call_outcome;
      }

      await apiRequest('/api/reception/calls/followup', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setShowFollowupModal(false);
      setSelectedLead(null);
      fetchData();
      setActiveTab('follow-ups');  // Redirect to Follow-ups page
      
      if (followupForm.product_condition === 'SERVICE_NEEDED') {
        alert('✅ Follow-up logged and service complaint created!');
      } else {
        alert('✅ Follow-up logged successfully!');
      }
    } catch (error) {
      console.error('Failed to complete follow-up:', error);
      alert('❌ Failed to complete follow-up');
    }
  };

  const viewCallHistory = async (lead) => {
    try {
      const history = await apiRequest(`/api/reception/calls/history/${lead.id}`);
      setCallHistory(history || []);
      setSelectedLead(lead);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Failed to fetch call history:', error);
      alert('❌ Failed to load call history');
    }
  };

  const getDaysOverdue = (nextFollowupDate) => {
    const today = new Date();
    const followupDate = new Date(nextFollowupDate);
    const diffTime = today - followupDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getOutcomeBadgeClass = (outcome) => {
    switch (outcome) {
      case 'PURCHASED':
        return 'outcome-purchased';
      case 'INTERESTED_BUY_LATER':
        return 'outcome-interested';
      case 'NOT_INTERESTED':
        return 'outcome-not-interested';
      default:
        return '';
    }
  };

  const getOutcomeLabel = (outcome) => {
    switch (outcome) {
      case 'PURCHASED':
        return 'Purchased';
      case 'INTERESTED_BUY_LATER':
        return 'Interested (Buy Later)';
      case 'NOT_INTERESTED':
        return 'Not Interested';
      default:
        return outcome;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'NEW':
        return '🆕 New';
      case 'FOLLOW_UP':
        return 'Follow-up';
      case 'CONVERTED':
        return '✅ Converted';
      case 'CLOSED':
        return '❌ Closed';
      default:
        return status;
    }
  };

  // Filter follow-ups by outcome
  const purchasedFollowups = followups.filter(f => f.current_outcome === 'PURCHASED');
  const interestedFollowups = followups.filter(f => f.current_outcome === 'INTERESTED_BUY_LATER');

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="reception-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>📞 Professional CRM - Call Management</h2>
          <p style={{ color: '#666', marginTop: '8px' }}>
            One customer, one record. Follow-ups are tasks, not duplicates.
          </p>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            📊
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.today_calls || 0} / {DAILY_TARGET}</div>
            <div className="stat-label">Today's Calls</div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(stats?.completion_percentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            👥
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.total_leads || 0}</div>
            <div className="stat-label">Total Leads</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            🛒
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.purchased_count || 0}</div>
            <div className="stat-label">Purchased Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            📅
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.due_today_followups || 0}</div>
            <div className="stat-label">Due Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}>
            🔔
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.pending_followups || 0}</div>
            <div className="stat-label">Pending Follow-ups</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'new-call' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-call')}
          >
            📞 Log New Call
          </button>
          <button 
            className={`tab ${activeTab === 'all-calls' ? 'active' : ''}`}
            onClick={() => setActiveTab('all-calls')}
          >
            👥 All Calls ({leads.length})
          </button>
          <button 
            className={`tab ${activeTab === 'follow-ups' ? 'active' : ''}`}
            onClick={() => setActiveTab('follow-ups')}
          >
            📅 Follow-Ups ({followups.length})
          </button>
          <button 
            className={`tab ${activeTab === 'today-activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('today-activity')}
          >
            📋 Today's Activity ({todayLogs.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'new-call' && (
          <div className="form-container">
            <h3>📞 Log New Call</h3>
            <form onSubmit={logCall} className="call-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    required
                    value={callForm.customer_name}
                    onChange={(e) => setCallForm({...callForm, customer_name: e.target.value})}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    required
                    type="tel"
                    value={callForm.phone}
                    onChange={(e) => setCallForm({...callForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={callForm.email}
                    onChange={(e) => setCallForm({...callForm, email: e.target.value})}
                    placeholder="Enter email (optional)"
                  />
                </div>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    required
                    value={callForm.product_name}
                    onChange={(e) => setCallForm({...callForm, product_name: e.target.value})}
                    placeholder="Enter product name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  rows="2"
                  value={callForm.address}
                  onChange={(e) => setCallForm({...callForm, address: e.target.value})}
                  placeholder="Enter customer address (optional)"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Call Type *</label>
                  <select
                    required
                    value={callForm.call_type}
                    onChange={(e) => setCallForm({...callForm, call_type: e.target.value})}
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Call Outcome *</label>
                  <select
                    required
                    value={callForm.call_outcome}
                    onChange={(e) => setCallForm({...callForm, call_outcome: e.target.value})}
                  >
                    <option value="NOT_INTERESTED">Not Interested</option>
                    <option value="INTERESTED_BUY_LATER">Interested (Buy Later)</option>
                    <option value="PURCHASED">Purchased</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows="3"
                  value={callForm.notes}
                  onChange={(e) => setCallForm({...callForm, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="info-box">
                {callForm.call_outcome === 'PURCHASED' && (
                  <p>✅ Monthly follow-ups will be automatically scheduled.</p>
                )}
                {callForm.call_outcome === 'INTERESTED_BUY_LATER' && (
                  <p>💡 Customer will be added to follow-up list.</p>
                )}
                {callForm.call_outcome === 'NOT_INTERESTED' && (
                  <p>⚠️ No follow-up will be scheduled.</p>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Log Call
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'all-calls' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>👥 All Calls - One Row Per Customer</h3>
              <div className="info-badge">
                ✨ Professional CRM: No duplicate rows
              </div>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Outcome</th>
                    <th>Calls Made</th>
                    <th>Last Call</th>
                    <th>Next Follow-up</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td colSpan="9" className="empty-state">No calls logged yet</td></tr>
                  ) : (
                    leads.map(lead => {
                      const isDue = lead.next_followup_date && getDaysOverdue(lead.next_followup_date) >= 0;
                      return (
                        <tr key={lead.id} className={isDue ? 'highlight-row' : ''}>
                          <td><strong>{lead.customer_name}</strong></td>
                          <td>{lead.phone}</td>
                          <td>{lead.product_name}</td>
                          <td><span className="badge-info">{getStatusLabel(lead.current_status)}</span></td>
                          <td>
                            <span className={`outcome-badge ${getOutcomeBadgeClass(lead.current_outcome)}`}>
                              {getOutcomeLabel(lead.current_outcome)}
                            </span>
                          </td>
                          <td>{lead.call_count}</td>
                          <td>{lead.last_call_date ? formatDate(lead.last_call_date) : '-'}</td>
                          <td>
                            {lead.next_followup_date ? (
                              <>
                                {formatDate(lead.next_followup_date)}
                                {isDue && <span className="badge-danger" style={{ marginLeft: '8px' }}>Due!</span>}
                              </>
                            ) : '-'}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-action btn-small btn-history"
                                onClick={() => viewCallHistory(lead)}
                                title="View complete call history"
                              >
                                📋 History
                              </button>
                              {lead.requires_followup && (
                                <button 
                                  className="btn-action btn-small btn-call"
                                  onClick={() => openFollowupModal(lead)}
                                  title="Make follow-up call"
                                >
                                  📞 Call
                                </button>
                              )}
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
        )}

        {activeTab === 'follow-ups' && (
          <div>
            <h3>📅 Pending Follow-Ups ({followups.length})</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Customers requiring follow-up calls - sorted by next follow-up date.
            </p>
            
            {purchasedFollowups.length > 0 && (
              <>
                <h4 style={{ marginTop: '30px' }}>🛒 Purchased Customers ({purchasedFollowups.length})</h4>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Phone</th>
                        <th>Product</th>
                        <th>Next Follow-up</th>
                        <th>Calls Made</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchasedFollowups.map(lead => {
                        const daysOverdue = getDaysOverdue(lead.next_followup_date);
                        const isDue = daysOverdue >= 0;
                        return (
                          <tr key={lead.id} className={isDue ? 'highlight-row' : ''}>
                            <td>{lead.customer_name}</td>
                            <td>{lead.phone}</td>
                            <td>{lead.product_name}</td>
                            <td>
                              {formatDate(lead.next_followup_date)}
                              {isDue && <span className="badge-danger" style={{ marginLeft: '8px' }}>Due!</span>}
                            </td>
                            <td>{lead.call_count}</td>
                            <td>
                              {lead.product_condition && (
                                <span className={lead.product_condition === 'WORKING_FINE' ? 'badge-success' : 'badge-warning'}>
                                  {lead.product_condition === 'WORKING_FINE' ? '✅ Working Fine' : '⚠️ Service Needed'}
                                </span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn-action"
                                onClick={() => openFollowupModal(lead)}
                              >
                                📞 Call Now
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {interestedFollowups.length > 0 && (
              <>
                <h4 style={{ marginTop: '30px' }}>💡 Interested Customers ({interestedFollowups.length})</h4>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer Name</th>
                        <th>Phone</th>
                        <th>Product</th>
                        <th>Next Follow-up</th>
                        <th>Calls Made</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interestedFollowups.map(lead => {
                        const daysOverdue = getDaysOverdue(lead.next_followup_date);
                        const isDue = daysOverdue >= 0;
                        return (
                          <tr key={lead.id} className={isDue ? 'highlight-row' : ''}>
                            <td>{lead.customer_name}</td>
                            <td>{lead.phone}</td>
                            <td>{lead.product_name}</td>
                            <td>
                              {formatDate(lead.next_followup_date)}
                              {isDue && <span className="badge-danger" style={{ marginLeft: '8px' }}>Due!</span>}
                            </td>
                            <td>{lead.call_count}</td>
                            <td>
                              <button 
                                className="btn-action"
                                onClick={() => openFollowupModal(lead)}
                              >
                                📞 Call Now
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {followups.length === 0 && (
              <div className="empty-state">No pending follow-ups</div>
            )}
          </div>
        )}

        {activeTab === 'today-activity' && (
          <div>
            <h3>📋 Today's Call Activity ({todayLogs.length})</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              All calls logged today - for activity tracking.
            </p>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Call Type</th>
                    <th>Outcome</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {todayLogs.length === 0 ? (
                    <tr><td colSpan="4" className="empty-state">No calls logged today</td></tr>
                  ) : (
                    todayLogs.map(log => (
                      <tr key={log.id}>
                        <td>{formatTime(log.call_time)}</td>
                        <td><span className="badge-info">{log.call_type}</span></td>
                        <td>
                          <span className={`outcome-badge ${getOutcomeBadgeClass(log.call_outcome)}`}>
                            {getOutcomeLabel(log.call_outcome)}
                          </span>
                        </td>
                        <td>{log.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Modal */}
      {showFollowupModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowFollowupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📞 Complete Follow-up Call</h3>
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <p><strong>Customer:</strong> {selectedLead.customer_name}</p>
              <p><strong>Phone:</strong> {selectedLead.phone}</p>
              <p><strong>Product:</strong> {selectedLead.product_name}</p>
              <p><strong>Calls Made:</strong> {selectedLead.call_count}</p>
            </div>

            <form onSubmit={completeFollowup}>
              {selectedLead.current_outcome === 'PURCHASED' && (
                <div className="form-group">
                  <label>Product Status *</label>
                  <select
                    required
                    value={followupForm.product_condition}
                    onChange={(e) => setFollowupForm({...followupForm, product_condition: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="WORKING_FINE">✅ Working Fine</option>
                    <option value="SERVICE_NEEDED">⚠️ Service Needed</option>
                  </select>
                  {followupForm.product_condition === 'SERVICE_NEEDED' && (
                    <div className="alert-warning" style={{ marginTop: '10px' }}>
                      ⚠️ A service complaint will be automatically created
                    </div>
                  )}
                </div>
              )}

              {selectedLead.current_outcome === 'INTERESTED_BUY_LATER' && (
                <div className="form-group">
                  <label>Call Outcome *</label>
                  <select
                    required
                    value={followupForm.call_outcome}
                    onChange={(e) => setFollowupForm({...followupForm, call_outcome: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="PURCHASED">🛒 Purchased Now</option>
                    <option value="INTERESTED_BUY_LATER">💡 Still Interested (Buy Later)</option>
                    <option value="NOT_INTERESTED">❌ Not Interested Anymore</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Follow-up Notes</label>
                <textarea
                  rows="3"
                  value={followupForm.notes}
                  onChange={(e) => setFollowupForm({...followupForm, notes: e.target.value})}
                  placeholder="Enter notes from this follow-up call..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowFollowupModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Complete Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call History Modal */}
      {showHistoryModal && selectedLead && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>📋 Call History - {selectedLead.customer_name}</h3>
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <p><strong>Phone:</strong> {selectedLead.phone}</p>
              <p><strong>Product:</strong> {selectedLead.product_name}</p>
              <p><strong>Total Calls:</strong> {selectedLead.call_count}</p>
              <p><strong>Current Status:</strong> {getStatusLabel(selectedLead.current_status)}</p>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Call Type</th>
                    <th>Outcome</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {callHistory.length === 0 ? (
                    <tr><td colSpan="5" className="empty-state">No call history</td></tr>
                  ) : (
                    callHistory.map(log => (
                      <tr key={log.id}>
                        <td>{formatDate(log.call_date)}</td>
                        <td>{formatTime(log.call_time)}</td>
                        <td><span className="badge-info">{log.call_type}</span></td>
                        <td>
                          <span className={`outcome-badge ${getOutcomeBadgeClass(log.call_outcome)}`}>
                            {getOutcomeLabel(log.call_outcome)}
                          </span>
                        </td>
                        <td>{log.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Close
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
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .page-header h2 {
          font-size: 28px;
          color: #2c3e50;
          margin: 0;
        }

        .info-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          margin-top: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .tabs-container {
          margin-bottom: 20px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid #e0e0e0;
          overflow-x: auto;
        }

        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .tab:hover {
          color: #667eea;
          background: #f5f5f5;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          min-height: 400px;
        }

        .form-container h3 {
          margin: 0 0 20px 0;
          color: #2c3e50;
        }

        .call-form {
          max-width: 800px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .info-box {
          background: #f0f4ff;
          border-left: 4px solid #667eea;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .info-box p {
          margin: 0;
          color: #2c3e50;
        }

        .alert-warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          border-radius: 6px;
          color: #856404;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #2c3e50;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }

        .btn-action {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-action:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-history {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
        }

        .btn-history:hover {
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
        }

        .btn-call {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          box-shadow: 0 2px 8px rgba(67, 233, 123, 0.3);
        }

        .btn-call:hover {
          box-shadow: 0 4px 12px rgba(67, 233, 123, 0.4);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .data-table-container {
          overflow-x: auto;
          margin-top: 20px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #e0e0e0;
        }

        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }

        .data-table tr:hover {
          background: #f8f9fa;
        }

        .highlight-row {
          background: #fff3cd !important;
        }

        .highlight-row:hover {
          background: #ffe69c !important;
        }

        .empty-state {
          text-align: center;
          padding: 40px !important;
          color: #999;
        }

        .outcome-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        }

        .outcome-purchased {
          background: #d4edda;
          color: #155724;
        }

        .outcome-interested {
          background: #d1ecf1;
          color: #0c5460;
        }

        .outcome-not-interested {
          background: #f8d7da;
          color: #721c24;
        }

        .badge-info {
          background: #e7f3ff;
          color: #004085;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 12px;
        }

        .badge-success {
          background: #d4edda;
          color: #155724;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 12px;
        }

        .badge-warning {
          background: #fff3cd;
          color: #856404;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 12px;
        }

        .badge-danger {
          background: #f8d7da;
          color: #721c24;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 12px;
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
          padding: 30px;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-large {
          max-width: 900px;
        }

        .modal-content h3 {
          margin: 0 0 20px 0;
          color: #2c3e50;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default CallsHistoryProfessional;
