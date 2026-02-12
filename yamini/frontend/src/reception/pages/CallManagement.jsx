import React, { useState, useEffect } from 'react';
import { 
  getCallStats, 
  getTodaysCalls, 
  getAllCallHistory,
  getMonthlyFollowups, 
  getTodaysFollowups,
  logCall,
  submitFollowup,
  invalidateCache 
} from '../../services/callService';

export default function CallManagement() {
  const [stats, setStats] = useState(null);
  const [todayCalls, setTodayCalls] = useState([]);
  const [allCalls, setAllCalls] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [todayFollowups, setTodayFollowups] = useState([]);
  const [activeTab, setActiveTab] = useState('all-calls'); // Default to showing ALL calls
  const [loading, setLoading] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // Form states
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    product_name: '',
    call_type: 'New Lead',
    notes: '',
    interest_status: 'NOT_INTERESTED',
    follow_up_date: ''
  });

  const [followupForm, setFollowupForm] = useState({
    product_condition: 'WORKING_FINE',
    follow_up_notes: '',
    call_outcome: 'INTERESTED_BUY_LATER'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use centralized call service for consistent data
      const [statsData, todayData, allData, followupsData, todayFollowupsData] = await Promise.all([
        getCallStats(),
        getTodaysCalls(),
        getAllCallHistory(100),
        getMonthlyFollowups(),
        getTodaysFollowups()
      ]);
      
      // Map stats from service format
      setStats(statsData ? {
        today_calls: statsData.todayCalls,
        daily_target: statsData.dailyTarget,
        completion_percentage: statsData.completionPercentage,
        not_interested_count: statsData.notInterestedCount,
        interested_buy_later_count: statsData.interestedBuyLaterCount,
        purchased_count: statsData.purchasedCount,
        pending_monthly_followups: statsData.pendingMonthlyFollowups,
        todays_followups: statsData.todaysFollowups
      } : null);
      setTodayCalls(todayData);
      setAllCalls(allData);
      setFollowups(followupsData);
      setTodayFollowups(todayFollowupsData);
      
      console.log('Loaded data:', { statsData, todayData, allData, followupsData });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Map interest_status to call_outcome for backend
      const callOutcomeMap = {
        'NOT_INTERESTED': 'NOT_INTERESTED',
        'INTERESTED': 'INTERESTED_BUY_LATER',
        'INTERESTED_BUY_LATER': 'INTERESTED_BUY_LATER',
        'PURCHASED': 'PURCHASED'
      };
      
      // Use centralized call service
      await logCall({
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        product_name: formData.product_name,
        call_type: formData.call_type,
        notes: formData.notes || null,
        call_outcome: callOutcomeMap[formData.interest_status] || 'NOT_INTERESTED'
      });
      
      // Reset form
      setFormData({
        customer_name: '',
        phone: '',
        email: '',
        address: '',
        product_name: '',
        call_type: 'New Lead',
        notes: '',
        interest_status: 'NOT_INTERESTED',
        follow_up_date: ''
      });
      
      // Reload data
      await loadData();
      
      alert('Call recorded successfully!');
    } catch (error) {
      console.error('Failed to create call:', error);
      alert('Failed to record call: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFollowupSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Use centralized call service
      await submitFollowup({
        parent_call_id: selectedCall.id,
        notes: followupForm.follow_up_notes || null,
        product_condition: followupForm.product_condition,
        call_outcome: followupForm.call_outcome || null
      });
      
      setShowFollowupModal(false);
      setSelectedCall(null);
      setFollowupForm({
        product_condition: 'WORKING_FINE',
        follow_up_notes: '',
        call_outcome: 'INTERESTED_BUY_LATER'
      });
      
      await loadData();
      
      alert('Follow-up completed successfully!');
    } catch (error) {
      console.error('Failed to complete follow-up:', error);
      alert('Failed to complete follow-up: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const openFollowupModal = (call) => {
    setSelectedCall(call);
    setShowFollowupModal(true);
  };

  const getFilteredCalls = (callList = allCalls) => {
    let filtered = callList;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(call => 
        call.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.phone?.includes(searchTerm) ||
        call.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Outcome filter
    if (filterOutcome !== 'ALL') {
      filtered = filtered.filter(call => call.call_outcome === filterOutcome);
    }
    
    // Type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter(call => call.call_type === filterType);
    }
    
    return filtered;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const isOverdue = (followUpDate) => {
    if (!followUpDate) return false;
    const today = new Date();
    const fDate = new Date(followUpDate);
    return fDate < today;
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
          📞 Call Management
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Track daily calls and follow-ups
        </p>
      </div>

      {/* Statistics Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: '0.9', marginBottom: '8px' }}>Today's Calls</div>
          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
            {stats?.today_calls || 0}/{stats?.daily_target || 40}
          </div>
          <div style={{ fontSize: '13px', opacity: '0.9' }}>
            {stats?.completion_percentage || 0}% Complete
          </div>
          <div style={{
            marginTop: '12px',
            height: '6px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(stats?.completion_percentage || 0, 100)}%`,
              background: 'white',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: '0.9', marginBottom: '8px' }}>Purchased</div>
          <div style={{ fontSize: '36px', fontWeight: '800' }}>
            {stats?.purchased_count || 0}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: '0.9', marginBottom: '8px' }}>Interested</div>
          <div style={{ fontSize: '36px', fontWeight: '800' }}>
            {stats?.interested_buy_later_count || 0}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: '0.9', marginBottom: '8px' }}>Not Interested</div>
          <div style={{ fontSize: '36px', fontWeight: '800' }}>
            {stats?.not_interested_count || 0}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: '0.9', marginBottom: '8px' }}>Pending Follow-ups</div>
          <div style={{ fontSize: '36px', fontWeight: '800' }}>
            {stats?.pending_monthly_followups || 0}
          </div>
        </div>
      </div>

      {/* Follow-ups Due Today Alert */}
      {todayFollowups.length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>⏰</span>
          <div>
            <div style={{ fontWeight: '700', color: '#92400e', fontSize: '16px' }}>
              {todayFollowups.length} Follow-up{todayFollowups.length > 1 ? 's' : ''} Due Today!
            </div>
            <div style={{ fontSize: '14px', color: '#b45309' }}>
              Click on "Follow-ups" tab to view and complete them
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'all-calls', label: `📊 All Calls (${allCalls.length})`, color: '#3b82f6' },
          { id: 'history', label: `📋 Today (${todayCalls.length})`, color: '#10b981' },
          { id: 'new-call', label: '➕ Log New Call', color: '#667eea' },
          { id: 'followups', label: `📅 Follow-ups (${followups.length})`, color: '#f59e0b' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab.id ? tab.color : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* New Call Form */}
      {activeTab === 'new-call' && (
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '800px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
            Record New Call
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Call Type *
                </label>
                <select
                  required
                  value={formData.call_type}
                  onChange={(e) => setFormData({...formData, call_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option>New Lead</option>
                  <option>Follow-up</option>
                  <option>Service Call</option>
                  <option>Product Inquiry</option>
                  <option>Complaint</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Interest Status *
                </label>
                <select
                  required
                  value={formData.interest_status}
                  onChange={(e) => setFormData({...formData, interest_status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="INTERESTED">Interested</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  placeholder="Add any important details about the call..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {formData.interest_status === 'INTERESTED' && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#dcfce7',
                borderRadius: '8px',
                border: '2px solid #86efac'
              }}>
                <div style={{ fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
                  ✓ Follow-up will be scheduled
                </div>
                <div style={{ fontSize: '13px', color: '#15803d' }}>
                  System will automatically set follow-up date to 1 week from today
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 32px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                {loading ? 'Saving...' : '📞 Record Call'}
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  customer_name: '',
                  phone: '',
                  email: '',
                  address: '',
                  product_name: '',
                  call_type: 'New Lead',
                  notes: '',
                  interest_status: 'NOT_INTERESTED',
                  follow_up_date: ''
                })}
                style={{
                  padding: '14px 32px',
                  background: 'white',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ALL CALLS - Complete History */}
      {activeTab === 'all-calls' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Header with Search and Filters */}
          <div style={{ padding: '20px', borderBottom: '2px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                📊 All Call Records
              </h2>
              <div style={{
                background: '#dbeafe',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#1e40af'
              }}>
                Showing {getFilteredCalls(allCalls).length} of {allCalls.length} total calls
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <input
                  type="text"
                  placeholder="🔍 Search by customer, phone, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <select
                  value={filterOutcome}
                  onChange={(e) => setFilterOutcome(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="PURCHASED">✓ Purchased</option>
                  <option value="INTERESTED_BUY_LATER">⏳ Interested</option>
                  <option value="NOT_INTERESTED">✗ Not Interested</option>
                </select>
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="New Lead">New Lead</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Service Call">Service Call</option>
                  <option value="Product Inquiry">Product Inquiry</option>
                  <option value="Complaint">Complaint</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Comprehensive Data Table */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '600px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>ID</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Date</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Customer</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Phone</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Email</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Product</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Type</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Outcome</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Follow-up</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredCalls(allCalls).length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No calls found</div>
                      <div style={{ fontSize: '14px' }}>
                        {searchTerm || filterOutcome !== 'ALL' || filterType !== 'ALL' 
                          ? 'Try adjusting your search or filters'
                          : 'No calls have been logged yet. Click "Log New Call" to get started!'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  getFilteredCalls(allCalls).map((call, index) => (
                    <tr 
                      key={call.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: index % 2 === 0 ? 'white' : '#fafbfc',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafbfc'}
                    >
                      <td style={{ padding: '14px 12px', color: '#3b82f6', fontWeight: '700', fontSize: '12px' }}>
                        #{call.id}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>
                        <div style={{ fontWeight: '600' }}>{formatDate(call.call_date)}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatTime(call.call_time)}</div>
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '14px', color: '#1e293b', fontWeight: '700' }}>
                        {call.customer_name}
                        {call.is_followup_call && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>
                            Follow-up
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>
                        <a href={`tel:${call.phone}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>
                          📞 {call.phone}
                        </a>
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>
                        {call.email ? (
                          <a href={`mailto:${call.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            ✉️ {call.email}
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                        {call.product_name || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#e0e7ff',
                          color: '#4338ca',
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}>
                          {call.call_type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: call.call_outcome === 'PURCHASED' ? '#dcfce7' 
                            : call.call_outcome === 'INTERESTED_BUY_LATER' ? '#fef3c7'
                            : '#fee2e2',
                          color: call.call_outcome === 'PURCHASED' ? '#166534' 
                            : call.call_outcome === 'INTERESTED_BUY_LATER' ? '#92400e'
                            : '#991b1b'
                        }}>
                          {call.call_outcome === 'PURCHASED' ? '✅ Purchased' 
                            : call.call_outcome === 'INTERESTED_BUY_LATER' ? '📅 Buy Later'
                            : '❌ Not Interested'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>
                        {call.requires_monthly_followup ? (
                          <span style={{ color: '#f59e0b', fontWeight: '700' }}>
                            📅 {call.next_followup_date ? formatDate(call.next_followup_date) : 'Scheduled'}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '12px', color: '#64748b', maxWidth: '200px' }}>
                        {call.notes ? (
                          <div style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            cursor: 'help'
                          }} title={call.notes}>
                            {call.notes}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Today's Calls History */}
      {activeTab === 'history' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Header with Search and Filters */}
          <div style={{ padding: '20px', borderBottom: '2px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
                📋 Today's Call History
              </h2>
              <div style={{
                background: '#f1f5f9',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#475569'
              }}>
                Showing {getFilteredCalls(todayCalls).length} of {todayCalls.length} calls
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <input
                  type="text"
                  placeholder="🔍 Search by customer, phone, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <select
                  value={filterOutcome}
                  onChange={(e) => setFilterOutcome(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="PURCHASED">✓ Purchased</option>
                  <option value="INTERESTED_BUY_LATER">⏳ Interested</option>
                  <option value="NOT_INTERESTED">✗ Not Interested</option>
                </select>
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="New Lead">New Lead</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Service Call">Service Call</option>
                  <option value="Product Inquiry">Product Inquiry</option>
                  <option value="Complaint">Complaint</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Comprehensive Data Table */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '600px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>ID</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Time</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Customer</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Phone</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Email</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Product</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Call Type</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Outcome</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Follow-up</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1e293b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredCalls(todayCalls).length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No calls found</div>
                      <div style={{ fontSize: '14px' }}>
                        {searchTerm || filterOutcome !== 'ALL' || filterType !== 'ALL' 
                          ? 'Try adjusting your search or filters'
                          : 'No calls have been logged today yet'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  getFilteredCalls(todayCalls).map((call, index) => (
                    <tr 
                      key={call.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: index % 2 === 0 ? 'white' : '#fafbfc',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#fafbfc'}
                    >
                      <td style={{ padding: '14px 12px', color: '#3b82f6', fontWeight: '700', fontSize: '12px' }}>
                        #{call.id}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                        {formatTime(call.call_time)}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '14px', color: '#1e293b', fontWeight: '700' }}>
                        {call.customer_name}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>
                        <a href={`tel:${call.phone}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>
                          📞 {call.phone}
                        </a>
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>
                        {call.email ? (
                          <a href={`mailto:${call.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            ✉️ {call.email}
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#334155', fontWeight: '600' }}>
                        {call.product_name || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#e0e7ff',
                          color: '#4338ca',
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}>
                          {call.call_type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: call.call_outcome === 'PURCHASED' ? '#dcfce7' 
                            : call.call_outcome === 'INTERESTED_BUY_LATER' ? '#fef3c7'
                            : '#fee2e2',
                          color: call.call_outcome === 'PURCHASED' ? '#166534' 
                            : call.call_outcome === 'INTERESTED_BUY_LATER' ? '#92400e'
                            : '#991b1b'
                        }}>
                          {call.call_outcome === 'PURCHASED' ? '✅ Purchased' 
                            : call.call_outcome === 'INTERESTED_BUY_LATER' ? '📅 Buy Later'
                            : '❌ Not Interested'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
                        {call.requires_monthly_followup ? (
                          <span style={{ color: '#f59e0b', fontWeight: '700' }}>
                            📅 {call.next_followup_date ? formatDate(call.next_followup_date) : 'Scheduled'}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '12px', color: '#64748b', maxWidth: '200px' }}>
                        {call.notes ? (
                          <div style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            cursor: 'help'
                          }} title={call.notes}>
                            {call.notes}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {todayCalls.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📞</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>No calls recorded today</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>Start recording calls to track your progress</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-ups List */}
      {activeTab === 'followups' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1e293b' }}>
              Follow-up Customers ({followups.length})
            </h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Follow-up Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Original Call</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {followups.map((call) => {
                  const overdue = isOverdue(call.next_followup_date);
                  return (
                    <tr key={call.id} style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      background: overdue ? '#fef2f2' : 'white'
                    }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#334155', fontWeight: '600' }}>
                        {call.customer_name}
                        {overdue && <span style={{ marginLeft: '8px', color: '#dc2626', fontSize: '12px' }}>⚠️ OVERDUE</span>}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#334155' }}>
                        {call.phone}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#334155' }}>
                        {call.product_name}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: overdue ? '#dc2626' : '#334155', fontWeight: overdue ? '600' : '400' }}>
                        {formatDate(call.next_followup_date)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#64748b' }}>
                        {formatDate(call.call_date)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => openFollowupModal(call)}
                          style={{
                            padding: '8px 16px',
                            background: overdue ? '#dc2626' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          📞 Complete Follow-up
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {followups.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>No pending follow-ups</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>Follow-ups appear here when customers show interest</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowupModal && selectedCall && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
              Complete Follow-up Call
            </h2>
            
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Customer:</strong> {selectedCall.customer_name}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Phone:</strong> {selectedCall.phone}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Product:</strong> {selectedCall.product_name}
              </div>
              <div>
                <strong>Original Notes:</strong> {selectedCall.notes || 'None'}
              </div>
            </div>

            <form onSubmit={handleFollowupSubmit}>
              {/* Show different fields based on parent call outcome */}
              {selectedCall.call_outcome === 'PURCHASED' ? (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                    Product Condition *
                  </label>
                  <select
                    required
                    value={followupForm.product_condition}
                    onChange={(e) => setFollowupForm({...followupForm, product_condition: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="WORKING_FINE">✓ Working Fine</option>
                    <option value="SERVICE_NEEDED">⚠️ Service Needed</option>
                  </select>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                    Call Outcome *
                  </label>
                  <select
                    required
                    value={followupForm.call_outcome}
                    onChange={(e) => setFollowupForm({...followupForm, call_outcome: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="PURCHASED">✅ Purchased</option>
                    <option value="INTERESTED_BUY_LATER">📅 Still Interested - Buy Later</option>
                    <option value="NOT_INTERESTED">❌ Not Interested</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
                  Follow-up Notes
                </label>
                <textarea
                  value={followupForm.follow_up_notes}
                  onChange={(e) => setFollowupForm({...followupForm, follow_up_notes: e.target.value})}
                  rows={4}
                  placeholder="Add any details from the follow-up call..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: loading ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : '✓ Complete Follow-up'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFollowupModal(false);
                    setSelectedCall(null);
                    setFollowupForm({ product_condition: 'WORKING_FINE', follow_up_notes: '', call_outcome: 'INTERESTED_BUY_LATER' });
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'white',
                    color: '#64748b',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
