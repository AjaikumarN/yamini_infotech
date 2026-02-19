import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';
import { logCall, invalidateCache } from '../services/callService';
import ServiceRequestsTable from './reception/ServiceRequestsTable';
import CallTrackerWidget from './reception/CallTrackerWidget';
import ReceptionSettings from './reception/ReceptionSettings';

const ReceptionDashboardNew = ({ userId = null, isAdminView = false }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    hotEnquiries: 0,
    callsMade: 0,
    callsTarget: 40,
    pendingService: 0,
    outstanding: 0
  });
  
  const [enquiries, setEnquiries] = useState({ HOT: [], WARM: [], COLD: [] });
  const [todaysCalls, setTodaysCalls] = useState([]);
  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [repeatComplaints, setRepeatComplaints] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [missingReports, setMissingReports] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  
  // Modal states
  const [showCallForm, setShowCallForm] = useState(false);
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Form states
  const [callForm, setCallForm] = useState({
    customer_name: '',
    phone: '',
    product_name: '',
    call_type: 'Cold',
    call_outcome: '',
    notes: ''
  });
  
  const [visitorForm, setVisitorForm] = useState({
    name: '',
    phone: '',
    purpose: '',
    whom_to_meet: '',
    in_time: new Date().toTimeString().slice(0, 5)
  });
  
  const [deliveryForm, setDeliveryForm] = useState({
    movement_type: 'IN',
    item_name: '',
    quantity: 1,
    reference: ''
  });

  const [serviceForm, setServiceForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    machine_model: '',
    fault_description: '',
    priority: 'NORMAL',
    assigned_to: ''
  });

  const [customers, setCustomers] = useState([]);
  const [engineers, setEngineers] = useState([]);

  // Check if navigating to settings route and open modal
  useEffect(() => {
    if (location.pathname === '/reception/settings') {
      setShowSettings(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      if (!isAdminView) {
        fetchBackendNotifications(); // Only fetch for staff, not admin view
        const interval = setInterval(() => {
          fetchDashboardData();
          fetchBackendNotifications();
        }, 60000);
        return () => clearInterval(interval);
      }
    }
  }, [user, userId]);

  const fetchBackendNotifications = async () => {
    try {
      const notifs = await apiRequest('/api/notifications/my-notifications?unread_only=true');
      setBackendNotifications(notifs || []);
      setUnreadCount((notifs || []).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [
        enquiriesData,
        complaintsData,
        salesmenData,
        callsData,
        callStatsData,
        visitorsData,
        deliveriesData,
        customersData,
        engineersData,
        outstandingData,
        missingReportsData
      ] = await Promise.all([
        apiRequest('/api/enquiries/').catch(() => []),
        apiRequest('/api/complaints/').catch(() => []),
        apiRequest('/api/users/salesmen/').catch(() => []),
        apiRequest('/api/calls/today').catch(() => []),
        apiRequest('/api/calls/stats').catch(() => null),
        apiRequest('/api/visitors/?today=true').catch(() => []),
        apiRequest('/api/stock-movements/').catch(() => []),
        apiRequest('/api/customers/').catch(() => []),
        apiRequest('/api/users?role=SERVICE_ENGINEER').catch(() => []),
        apiRequest('/api/outstanding/').catch(() => []),
        apiRequest('/api/reports/daily/missing').catch(() => [])
      ]);

      // Group enquiries by priority - ONLY UNASSIGNED (for Reception)
      const grouped = { HOT: [], WARM: [], COLD: [] };
      (enquiriesData || []).forEach(enq => {
        // Only show unassigned enquiries in Reception dashboard
        if (enq.assigned_to || enq.salesman_id || enq.status === 'ASSIGNED' || enq.status === 'CONVERTED') {
          return; // Skip assigned or converted enquiries
        }
        const priority = enq.priority || 'WARM';
        if (grouped[priority]) grouped[priority].push(enq);
      });
      setEnquiries(grouped);

      // Set salesmen directly (already filtered by backend)
      setSalesmen(salesmenData || []);

      // Pending complaints
      setPendingComplaints(
        (complaintsData || []).filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED')
      );

      // Calculate repeat complaints
      const complaintsByCustomer = {};
      (complaintsData || []).forEach(c => {
        const key = `${c.customer_name}_${c.machine_model}`;
        if (!complaintsByCustomer[key]) {
          complaintsByCustomer[key] = [];
        }
        complaintsByCustomer[key].push(c);
      });
      
      const repeats = Object.entries(complaintsByCustomer)
        .filter(([_, complaints]) => complaints.length >= 2)
        .map(([key, complaints]) => ({
          customer_name: complaints[0].customer_name,
          machine_model: complaints[0].machine_model,
          count: complaints.length,
          last_complaint: complaints[complaints.length - 1].created_at
        }));
      setRepeatComplaints(repeats);

      setTodaysCalls(callsData || []);
      setVisitors(visitorsData || []);
      setDeliveries(deliveriesData || []);
      setSalesmen(salesmenData || []);
      setCustomers(customersData || []);
      setEngineers(engineersData || []);
      
      // Set outstanding invoices with calculated due_days
      const outstanding = (outstandingData || []).map(inv => {
        const today = new Date();
        const dueDate = new Date(inv.due_date);
        const due_days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        return { ...inv, due_days };
      });
      setOutstanding(outstanding);

      // Set missing reports - extract from response object
      const missingReportsArray = missingReportsData?.missing_reports || [];
      setMissingReports(missingReportsArray);

      // Calculate total outstanding amount
      const totalOutstanding = outstanding.reduce((sum, inv) => sum + (inv.balance || 0), 0);

      // Update KPIs - use stats API for consistent call counts
      setKpis({
        hotEnquiries: grouped.HOT.length,
        callsMade: callStatsData?.today_calls ?? (callsData || []).length,
        callsTarget: callStatsData?.daily_target ?? 40,
        pendingService: (complaintsData || []).filter(c => c.status !== 'RESOLVED').length,
        outstanding: totalOutstanding
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignEnquiry = async (enquiryId, salesmanId) => {
    try {
      await apiRequest(`/api/enquiries/${enquiryId}`, {
        method: 'PUT',
        body: JSON.stringify({ assigned_to: salesmanId, status: 'ASSIGNED' })
      });
      fetchDashboardData();
    } catch (error) {
      alert('Failed to assign enquiry');
    }
  };

  const changePriority = async (enquiryId, newPriority, currentPriority) => {
    try {
      await apiRequest(`/api/enquiries/${enquiryId}`, {
        method: 'PUT',
        body: JSON.stringify({ priority: newPriority })
      });
      
      // Update local state
      const enquiry = enquiries[currentPriority].find(e => e.id === enquiryId);
      setEnquiries(prev => ({
        ...prev,
        [currentPriority]: prev[currentPriority].filter(e => e.id !== enquiryId),
        [newPriority]: [...prev[newPriority], { ...enquiry, priority: newPriority }]
      }));
    } catch (error) {
      alert('Failed to update priority');
    }
  };

  const handleLogCall = async (e) => {
    e.preventDefault();
    try {
      // Log to BOTH old call system AND new CRM leads system
      await logCall(callForm);
      // Also create/update lead in new CRM so it shows in Calls & Target page
      try {
        await apiRequest('/api/reception/calls/log', {
          method: 'POST',
          body: JSON.stringify(callForm)
        });
      } catch (crmErr) {
        console.warn('CRM lead sync skipped:', crmErr);
      }
      setShowCallForm(false);
      setCallForm({
        customer_name: '',
        phone: '',
        product_name: '',
        call_type: 'Cold',
        call_outcome: '',
        notes: ''
      });
      // Invalidate cache and refresh data
      invalidateCache();
      fetchDashboardData();
    } catch (error) {
      alert('Failed to log call: ' + (error.message || ''));
    }
  };

  const addVisitor = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/visitors', {
        method: 'POST',
        body: JSON.stringify(visitorForm)
      });
      setShowVisitorForm(false);
      setVisitorForm({
        name: '',
        phone: '',
        purpose: '',
        whom_to_meet: '',
        in_time: new Date().toTimeString().slice(0, 5)
      });
      fetchDashboardData();
    } catch (error) {
      alert('Failed to add visitor');
    }
  };

  const logDelivery = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/stock-movements/', {
        method: 'POST',
        body: JSON.stringify({
          ...deliveryForm,
          engineer_id: deliveryForm.engineer_id || null,
          service_request_id: deliveryForm.service_request_id || null,
        })
      });
      setShowDeliveryForm(false);
      setDeliveryForm({
        movement_type: 'IN',
        item_name: '',
        quantity: 1,
        reference: ''
      });
      fetchDashboardData();
    } catch (error) {
      alert('Failed to log delivery');
    }
  };

  const openServiceForm = () => {
    // Auto-select first engineer if available
    const autoEngineer = engineers.length > 0 ? engineers[0].id.toString() : '';
    setServiceForm(prev => ({ ...prev, assigned_to: autoEngineer }));
    setShowServiceForm(true);
  };

  const createServiceRequest = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          ...serviceForm,
          assigned_to: serviceForm.assigned_to ? parseInt(serviceForm.assigned_to) : null
        })
      });
      setShowServiceForm(false);
      setServiceForm({
        customer_name: '',
        phone: '',
        address: '',
        machine_model: '',
        fault_description: '',
        priority: 'NORMAL',
        assigned_to: ''
      });
      alert('✅ Service request created successfully!');
      fetchDashboardData();
    } catch (error) {
      alert('❌ Failed to create service request: ' + (error.message || ''));
    }
  };

  const markVisitorOut = async (visitorId) => {
    try {
      await apiRequest(`/api/visitors/${visitorId}/checkout`, {
        method: 'PUT',
        body: JSON.stringify({ out_time: new Date().toTimeString().slice(0, 5) })
      });
      fetchDashboardData();
    } catch (error) {
      alert('Failed to mark visitor out');
    }
  };

  if (loading) {
    return <div className="loading">⏳ Loading Reception Dashboard...</div>;
  }

  return (
    <div className="reception-dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>📞 Reception Dashboard</h1>
        <div className="header-actions">
          <div className="user-info">
            Welcome, {user?.full_name || user?.username}
          </div>
          <button
            onClick={() => navigate('/reception/call-management')}
            style={{
              marginLeft: '16px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            📞 Call Management
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              marginLeft: '8px',
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="kpi-strip">
        <div className="kpi-card hot">
          <span className="kpi-icon">🔥</span>
          <div className="kpi-content">
            <div className="kpi-label">HOT</div>
            <div className="kpi-value">{kpis.hotEnquiries}</div>
          </div>
        </div>
        
        <div className="kpi-card service">
          <span className="kpi-icon">🔧</span>
          <div className="kpi-content">
            <div className="kpi-label">Pending Service</div>
            <div className="kpi-value">{kpis.pendingService}</div>
          </div>
        </div>
        
        <div className="kpi-card outstanding">
          <span className="kpi-icon">₹</span>
          <div className="kpi-content">
            <div className="kpi-label">Outstanding</div>
            <div className="kpi-value">₹{(kpis.outstanding / 100000).toFixed(1)}L</div>
          </div>
        </div>
      </div>

      {/* CALL TRACKER WIDGET */}
      <div style={{ marginBottom: '24px' }}>
        <CallTrackerWidget targetCalls={40} />
      </div>

      {/* SECTION 1: ENQUIRY BOARD (KANBAN) */}
      <div className="dashboard-section">
        <h2>1️⃣ Enquiry Board</h2>
        <div className="enquiry-kanban">
          {['HOT', 'WARM', 'COLD'].map(priority => (
            <div key={priority} className={`kanban-column ${priority.toLowerCase()}`}>
              <div className="column-header">
                <h3>{priority} {priority === 'HOT' ? '🔥' : priority === 'WARM' ? '☀️' : '❄️'}</h3>
                <span className="count">{enquiries[priority].length}</span>
              </div>
              <div className="column-content">
                {enquiries[priority].map(enq => (
                  <div key={enq.id} className="enquiry-card">
                    <div className="card-header">
                      <strong>{enq.customer_name}</strong>
                      <span className="source-badge">{enq.source}</span>
                    </div>
                    <div className="card-body">
                      <div className="label">Phone:</div>
                      <div>{enq.phone}</div>
                      <div className="label">Product:</div>
                      <div>{enq.product_interest || 'Not specified'}</div>
                      <div className="label">Status:</div>
                      <div><span className={`status-badge ${enq.status}`}>{enq.status}</span></div>
                      {enq.assigned_to && (
                        <>
                          <div className="label">Assigned:</div>
                          <div>{salesmen.find(s => s.id === enq.assigned_to)?.full_name || 'Unknown'}</div>
                        </>
                      )}
                      {enq.last_follow_up && (
                        <>
                          <div className="label">Last Follow-up:</div>
                          <div>{new Date(enq.last_follow_up).toLocaleDateString()}</div>
                        </>
                      )}
                    </div>
                    <div className="card-actions">
                      {!enq.assigned_to ? (
                        <select 
                          onChange={(e) => assignEnquiry(enq.id, parseInt(e.target.value))}
                          defaultValue=""
                        >
                          <option value="">Assign to...</option>
                          {salesmen.map(s => (
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                          ))}
                        </select>
                      ) : (
                        <button 
                          className="btn-sm"
                          onClick={() => navigate(`/enquiries/${enq.id}`)}
                        >
                          View Details
                        </button>
                      )}
                      <select
                        value={priority}
                        onChange={(e) => changePriority(enq.id, e.target.value, priority)}
                        className="priority-select"
                      >
                        <option value="HOT">HOT 🔥</option>
                        <option value="WARM">WARM ☀️</option>
                        <option value="COLD">COLD ❄️</option>
                      </select>
                    </div>
                  </div>
                ))}
                {enquiries[priority].length === 0 && (
                  <div className="empty-column">No {priority.toLowerCase()} enquiries</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: TODAY'S CALLS */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>2️⃣ Today's Calls & Target ({kpis.callsMade}/{kpis.callsTarget})</h2>
          {!isAdminView && (
            <button className="btn-primary btn-sm-action" onClick={() => setShowCallForm(true)}>
              + Log Call
            </button>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Product</th>
                <th>Call Type</th>
                <th>Outcome</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {todaysCalls.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No calls logged today</td></tr>
              ) : (
                todaysCalls.map(call => (
                  <tr key={call.id}>
                    <td>{call.call_time ? new Date(call.call_time).toLocaleTimeString() : '-'}</td>
                    <td>{call.customer_name}</td>
                    <td>{call.phone}</td>
                    <td>{call.product_name || '-'}</td>
                    <td>{call.call_type}</td>
                    <td>
                      <span className={`outcome-badge ${(call.call_outcome || '').toLowerCase().replace(/_/g, '-')}`}>
                        {call.call_outcome === 'PURCHASED' ? '✅ Purchased' :
                         call.call_outcome === 'INTERESTED_BUY_LATER' ? '📅 Buy Later' :
                         call.call_outcome === 'NOT_INTERESTED' ? '❌ Not Interested' :
                         call.call_outcome || call.outcome || '-'}
                      </span>
                    </td>
                    <td>{call.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: SERVICE REQUESTS (UNIFIED SYSTEM) */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>3️⃣ Service Requests (Unified System)</h2>
        </div>
        <ServiceRequestsTable />
      </div>

      {/* SECTION 3B: LEGACY PENDING SERVICE COMPLAINTS (if still needed) */}
      <div className="dashboard-section" style={{ display: 'none' }}>
        <div className="section-header">
          <h2>📦 Legacy Service Complaints ({pendingComplaints.length})</h2>
          <button className="add-btn" onClick={openServiceForm}>
            ➕ Add Service Request
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer Name</th>
                <th>Machine Model</th>
                <th>Complaint Type</th>
                <th>Assigned Engineer</th>
                <th>Status</th>
                <th>SLA Due</th>
              </tr>
            </thead>
            <tbody>
              {pendingComplaints.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No pending complaints</td></tr>
              ) : (
                pendingComplaints.slice(0, 10).map(complaint => {
                  const slaHours = complaint.sla_hours || 24;
                  const createdAt = new Date(complaint.created_at);
                  const dueAt = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
                  const hoursLeft = Math.round((dueAt - new Date()) / (1000 * 60 * 60));
                  const isOverdue = hoursLeft < 0;
                  
                  return (
                    <tr key={complaint.id} className={isOverdue ? 'overdue' : ''}>
                      <td>{complaint.ticket_id}</td>
                      <td>{complaint.customer_name}</td>
                      <td>{complaint.machine_model}</td>
                      <td>{complaint.complaint_type}</td>
                      <td>{complaint.assigned_engineer_name || 'Unassigned'}</td>
                      <td><span className={`status-badge ${complaint.status}`}>{complaint.status}</span></td>
                      <td className={isOverdue ? 'sla-overdue' : hoursLeft < 2 ? 'sla-warning' : ''}>
                        {isOverdue ? `⚠️ ${Math.abs(hoursLeft)}h overdue` : `${hoursLeft}h left`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: REPEAT COMPLAINT ALERT */}
      <div className="dashboard-section alert-section">
        <div className="section-header">
          <h2>4️⃣ Repeat Complaint Alert ({repeatComplaints.length})</h2>
          <button className="btn-primary btn-sm-action" onClick={openServiceForm}>
            + Add Service Request
          </button>
        </div>
        {repeatComplaints.length === 0 ? (
          <div className="alert-empty">✅ No repeat complaints detected</div>
        ) : (
          <div className="alert-list">
            {repeatComplaints.map((item, idx) => (
              <div key={idx} className="alert-card">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <strong>{item.customer_name}</strong>
                  <div>Machine: {item.machine_model}</div>
                  <div className="repeat-count">{item.count}x complaints</div>
                  <div className="last-date">Last: {new Date(item.last_complaint).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: DELIVERY IN/OUT LOG */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>5️⃣ Delivery IN / OUT Log</h2>
          <button className="btn-primary btn-sm-action" onClick={() => setShowDeliveryForm(true)}>
            + Log Delivery
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">No deliveries logged</td></tr>
              ) : (
                deliveries.map(del => (
                  <tr key={del.id}>
                    <td>{new Date(del.created_at || del.date).toLocaleDateString()}</td>
                    <td><span className={`type-badge ${del.movement_type || del.type}`}>{del.movement_type || del.type}</span></td>
                    <td>{del.item_name}</td>
                    <td>{del.quantity}</td>
                    <td>{del.reference_id || del.reference || 'N/A'}</td>
                    <td><span className={`status-badge ${del.approval_status || del.delivery_status || del.status || ''}`}>{del.approval_status || del.delivery_status || del.status || '—'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 6: OUTSTANDING SUMMARY (READ-ONLY) */}
      <div className="dashboard-section">
        <h2>6️⃣ Outstanding Summary (Read-Only)</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Invoice No</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Balance</th>
                <th>Due Days</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">No outstanding invoices</td></tr>
              ) : (
                outstanding.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.customer_name}</td>
                    <td>{inv.invoice_no}</td>
                    <td>₹{inv.total_amount.toLocaleString()}</td>
                    <td>₹{inv.paid_amount.toLocaleString()}</td>
                    <td className="balance">₹{(inv.total_amount - inv.paid_amount).toLocaleString()}</td>
                    <td>{inv.due_days}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 7: MISSING REPORTS */}
      <div className="dashboard-section">
        <h2>7️⃣ Missing Reports</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Role</th>
                <th>Missing Item</th>
                <th>Days Pending</th>
              </tr>
            </thead>
            <tbody>
              {missingReports.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">✅ All reports submitted</td></tr>
              ) : (
                missingReports.map((report, idx) => (
                  <tr key={idx}>
                    <td>{report.salesman_name || report.username}</td>
                    <td><span style={{background: '#3498db', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px'}}>👤 Salesman</span></td>
                    <td>Daily Report</td>
                    <td className="warning" style={{color: '#f39c12', fontWeight: 'bold'}}>Today</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 8: VISITOR LOG */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>8️⃣ Visitor Log</h2>
          {!isAdminView && (
            <button className="btn-primary btn-sm-action" onClick={() => setShowVisitorForm(true)}>
              + Add Visitor
            </button>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Visitor Name</th>
                <th>Phone</th>
                <th>Purpose</th>
                <th>Whom to Meet</th>
                <th>IN Time</th>
                <th>OUT Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No visitors today</td></tr>
              ) : (
                visitors.map(visitor => (
                  <tr key={visitor.id}>
                    <td>{visitor.name}</td>
                    <td>{visitor.phone}</td>
                    <td>{visitor.purpose}</td>
                    <td>{visitor.whom_to_meet}</td>
                    <td>{visitor.in_time}</td>
                    <td>{visitor.out_time || '-'}</td>
                    <td>
                      {!visitor.out_time && (
                        <button 
                          className="btn-sm"
                          onClick={() => markVisitorOut(visitor.id)}
                        >
                          Mark OUT
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CALL FORM MODAL */}
      {showCallForm && (
        <div className="modal-overlay" onClick={() => setShowCallForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📞 Log New Call</h3>
            <form onSubmit={handleLogCall}>
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
                  value={callForm.phone}
                  onChange={(e) => setCallForm({...callForm, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Product Interest *</label>
                <input
                  required
                  value={callForm.product_name}
                  onChange={(e) => setCallForm({...callForm, product_name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div className="form-group">
                <label>Call Type *</label>
                <select
                  required
                  value={callForm.call_type}
                  onChange={(e) => setCallForm({...callForm, call_type: e.target.value})}
                >
                  <option value="Cold">Cold Call</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Hot">Hot Lead</option>
                </select>
              </div>
              <div className="form-group">
                <label>Call Outcome *</label>
                <select
                  required
                  value={callForm.call_outcome}
                  onChange={(e) => setCallForm({...callForm, call_outcome: e.target.value})}
                >
                  <option value="">Select outcome...</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="INTERESTED_BUY_LATER">Interested - Will Buy Later</option>
                  <option value="PURCHASED">Purchased</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={callForm.notes}
                  onChange={(e) => setCallForm({...callForm, notes: e.target.value})}
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCallForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISITOR FORM MODAL - Hidden in Admin View */}
      {!isAdminView && showVisitorForm && (
        <div className="modal-overlay" onClick={() => setShowVisitorForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Visitor</h3>
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
                  value={visitorForm.phone}
                  onChange={(e) => setVisitorForm({...visitorForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Purpose *</label>
                <input
                  required
                  value={visitorForm.purpose}
                  onChange={(e) => setVisitorForm({...visitorForm, purpose: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Whom to Meet *</label>
                <input
                  required
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
                <button type="button" className="btn-secondary" onClick={() => setShowVisitorForm(false)}>
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

      {/* DELIVERY FORM MODAL */}
      {showDeliveryForm && (
        <div className="modal-overlay" onClick={() => setShowDeliveryForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Log Delivery IN/OUT</h3>
            <form onSubmit={logDelivery}>
              <div className="form-group">
                <label>Type *</label>
                <select
                  required
                  value={deliveryForm.movement_type}
                  onChange={(e) => setDeliveryForm({...deliveryForm, movement_type: e.target.value})}
                >
                  <option value="IN">Delivery IN</option>
                  <option value="OUT">Delivery OUT</option>
                </select>
              </div>
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  required
                  placeholder="e.g., Printer Toner, Paper Box, etc."
                  value={deliveryForm.item_name}
                  onChange={(e) => setDeliveryForm({...deliveryForm, item_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={deliveryForm.quantity}
                  onChange={(e) => setDeliveryForm({...deliveryForm, quantity: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Reference (Invoice/PO/DO Number)</label>
                <input
                  placeholder="e.g., INV-2024-001"
                  value={deliveryForm.reference}
                  onChange={(e) => setDeliveryForm({...deliveryForm, reference: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDeliveryForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Log Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE REQUEST FORM MODAL */}
      {showServiceForm && (
        <div className="modal-overlay" onClick={() => setShowServiceForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🔧 Create Service Request</h3>
            <form onSubmit={createServiceRequest}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  required
                  placeholder="Customer name"
                  value={serviceForm.customer_name}
                  onChange={(e) => setServiceForm({...serviceForm, customer_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  required
                  type="tel"
                  placeholder="Contact number"
                  value={serviceForm.phone}
                  onChange={(e) => setServiceForm({...serviceForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  rows="2"
                  placeholder="Service location"
                  value={serviceForm.address}
                  onChange={(e) => setServiceForm({...serviceForm, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Machine Model *</label>
                <input
                  required
                  placeholder="e.g., HP LaserJet Pro"
                  value={serviceForm.machine_model}
                  onChange={(e) => setServiceForm({...serviceForm, machine_model: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Fault Description *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe the issue..."
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
                  <option value="NORMAL">Normal (24h SLA)</option>
                  <option value="URGENT">Urgent (6h SLA)</option>
                  <option value="CRITICAL">Critical (2h SLA)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assign Engineer *</label>
                <select
                  required
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
                <button type="button" className="btn-secondary" onClick={() => setShowServiceForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        .reception-dashboard {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          background: #ffffff !important;
          min-height: calc(100vh - 70px);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }

        .dashboard-header h1 {
          margin: 0;
          color: #2c3e50;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #ecf0f1;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .action-btn {
          padding: 10px 20px;
          background: white;
          border: 2px solid #3498db;
          color: #3498db;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .action-btn:hover {
          background: #3498db;
          color: white;
          transform: translateY(-2px);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }

        .action-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        .notification-bell {
          position: relative;
          background: white;
          border: 2px solid #3498db;
          border-radius: 50%;
          width: 45px;
          height: 45px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .notification-bell:hover {
          background: #3498db;
          transform: scale(1.1);
        }

        .notification-bell .badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #e74c3c;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .user-info {
          color: #7f8c8d;
          font-size: 14px;
        }

        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: white;
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          border: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .kpi-card.hot {
          border-left: 3px solid #e74c3c;
        }

        .kpi-card.calls {
          border-left: 3px solid #3498db;
        }

        .kpi-card.service {
          border-left: 3px solid #f39c12;
        }

        .kpi-card.outstanding {
          border-left: 3px solid #9b59b6;
        }

        .kpi-icon {
          font-size: 28px;
        }

        .kpi-label {
          font-size: 11px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .kpi-value {
          font-size: 22px;
          font-weight: bold;
          color: #2c3e50;
        }

        .dashboard-section {
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          border: 1px solid #f0f0f0;
        }

        .dashboard-section h2 {
          margin: 0 0 16px 0;
          color: #2c3e50;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 16px;
          gap: 20px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 16px;
          flex: 0 0 auto;
        }

        .section-header .btn-primary,
        .section-header .btn-sm-action {
          flex-shrink: 0;
          margin-left: auto;
        }

        .add-btn {
          padding: 6px 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          white-space: nowrap;
        }

        .add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .enquiry-kanban {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .kanban-column {
          background: #ffffff;
          border-radius: 8px;
          padding: 15px;
          border: 1px solid #e0e0e0;
        }

        .kanban-column.hot {
          border-top: 3px solid #e74c3c;
        }

        .kanban-column.warm {
          border-top: 3px solid #f39c12;
        }

        .kanban-column.cold {
          border-top: 3px solid #3498db;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .column-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .count {
          background: #34495e;
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: bold;
        }

        .column-content {
          max-height: 500px;
          overflow-y: auto;
        }

        .enquiry-card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .source-badge {
          font-size: 10px;
          padding: 3px 8px;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          color: #7f8c8d;
        }

        .card-body {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 5px 10px;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .label {
          color: #7f8c8d;
          font-weight: 500;
        }

        .status-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
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

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .card-actions select,
        .priority-select {
          flex: 1;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
        }

        .empty-column {
          text-align: center;
          padding: 30px;
          color: #95a5a6;
          font-style: italic;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #ecf0f1;
        }

        th {
          background: #ffffff;
          font-weight: 600;
          font-size: 13px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e0e0e0;
        }

        td {
          font-size: 14px;
        }

        tbody tr:hover {
          background: #ffffff;
        }

        .empty-state {
          text-align: center;
          color: #95a5a6;
          padding: 40px !important;
          font-style: italic;
        }

        .overdue {
          background: #fff5f5 !important;
        }

        .sla-overdue {
          color: #e74c3c;
          font-weight: bold;
        }

        .sla-warning {
          color: #f39c12;
          font-weight: bold;
        }

        .alert-section {
          background: #fff9e6;
          border-left: 4px solid #f39c12;
        }

        .alert-empty {
          text-align: center;
          padding: 20px;
          color: #27ae60;
          font-weight: 500;
        }

        .alert-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
        }

        .alert-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border-left: 3px solid #e74c3c;
          display: flex;
          gap: 12px;
        }

        .alert-icon {
          font-size: 24px;
        }

        .alert-content {
          flex: 1;
        }

        .repeat-count {
          color: #e74c3c;
          font-weight: bold;
          font-size: 16px;
        }

        .last-date {
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 5px;
        }

        .type-badge {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 4px;
          font-weight: 600;
        }

        .type-badge.IN {
          background: #27ae60;
          color: white;
        }

        .type-badge.OUT {
          background: #e74c3c;
          color: white;
        }

        .balance {
          color: #e74c3c;
          font-weight: bold;
        }

        .warning {
          color: #f39c12;
          font-weight: bold;
        }

        .btn-primary,
        .btn-secondary,
        .btn-sm {
          padding: 6px 14px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background: #2980b9;
        }

        /* Smaller action buttons for section headers */
        .btn-sm-action {
          padding: 8px 16px !important;
          font-size: 13px !important;
          display: inline-block;
          width: auto;
          flex-shrink: 0;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-sm {
          padding: 4px 10px;
          font-size: 12px;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          color: #2c3e50;
        }

        .btn-sm:hover {
          background: #e8f4fd;
        }

        /* Outcome badges */
        .outcome-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .outcome-badge.purchased {
          background: #d1fae5;
          color: #059669;
        }

        .outcome-badge.interested-buy-later {
          background: #fef3c7;
          color: #d97706;
        }

        .outcome-badge.not-interested {
          background: #fee2e2;
          color: #dc2626;
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
          margin: 0 0 20px 0;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          font-size: 14px;
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
          min-height: 80px;
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

        @media (max-width: 968px) {
          .enquiry-kanban {
            grid-template-columns: 1fr;
          }

          .kpi-strip {
            grid-template-columns: repeat(2, 1fr);
          }

          .alert-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <ReceptionSettings 
          onClose={() => {
            setShowSettings(false);
            // Navigate back to dashboard if coming from settings route
            if (location.pathname === '/reception/settings') {
              navigate('/reception/dashboard');
            }
          }} 
        />
      )}
    </div>
  );
};

export default ReceptionDashboardNew;
