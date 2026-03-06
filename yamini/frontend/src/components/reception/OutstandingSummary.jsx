import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const OutstandingSummary = ({ mode = 'staff' }) => {
  const [outstandingData, setOutstandingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_no: '',
    total_amount: 0,
    paid_amount: 0,
    due_date: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    search: '',
    minAmount: '',
    daysOverdue: 'ALL'
  });

  useEffect(() => {
    fetchOutstandingData();
  }, []);

  const fetchOutstandingData = async () => {
    try {
      setLoading(true);
      const invoices = await apiRequest('/api/outstanding/');
      
      const outstanding = (invoices || []).map(invoice => {
        const today = new Date();
        const dueDate = new Date(invoice.due_date);
        const daysPastDue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
        
        return {
          id: invoice.id,
          customer_name: invoice.customer_name,
          invoice_no: invoice.invoice_no,
          total_amount: invoice.total_amount,
          paid_amount: invoice.paid_amount,
          balance: invoice.balance,
          due_date: dueDate,
          days_overdue: daysPastDue,
          status: invoice.status,
          customer_phone: invoice.customer_phone,
          customer_email: invoice.customer_email,
          notes: invoice.notes
        };
      }).sort((a, b) => b.days_overdue - a.days_overdue);
      
      setOutstandingData(outstanding);
    } catch (error) {
      console.error('Failed to fetch outstanding data:', error);
      setOutstandingData([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteOutstanding = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this outstanding record?')) return;
    try {
      await apiRequest(`/api/outstanding/${invoiceId}`, { method: 'DELETE' });
      fetchOutstandingData();
      alert('Outstanding record deleted successfully!');
    } catch (error) {
      alert('Failed to delete record: ' + (error.message || ''));
    }
  };

  const filteredData = outstandingData.filter(item => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!(item.customer_name.toLowerCase().includes(search) || 
            item.invoice_no.toLowerCase().includes(search))) {
        return false;
      }
    }
    if (filters.minAmount) {
      if (item.balance < parseFloat(filters.minAmount)) return false;
    }
    if (filters.daysOverdue !== 'ALL') {
      const days = parseInt(filters.daysOverdue);
      if (days === 0 && item.days_overdue > 0) return false;
      if (days === 30 && item.days_overdue < 30) return false;
      if (days === 60 && item.days_overdue < 60) return false;
      if (days === 90 && item.days_overdue < 90) return false;
    }
    return true;
  });

  const totalOutstanding = outstandingData.reduce((sum, item) => sum + item.balance, 0);
  const totalBilled = outstandingData.reduce((sum, item) => sum + item.total_amount, 0);
  const totalPaid = outstandingData.reduce((sum, item) => sum + item.paid_amount, 0);
  const criticalCount = outstandingData.filter(item => item.days_overdue > 60).length;
  const warningCount = outstandingData.filter(item => item.days_overdue > 30 && item.days_overdue <= 60).length;
  const onTimeCount = outstandingData.filter(item => item.days_overdue <= 30).length;
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : 0;

  // Format Indian currency properly (₹5,01,000 format)
  const formatINR = (amount) => {
    if (amount == null || isNaN(amount)) return '\u20B90';
    return '\u20B9' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTop: '4px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '16px', color: '#6B7280' }}>Loading outstanding data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1F2937', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-icons" style={{ fontSize: '32px', color: '#3B82F6' }}>receipt_long</span>
            Outstanding Summary
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Track pending payments &amp; outstanding invoices
          </p>
        </div>
        <button 
          onClick={() => {
            setFormData({ customer_name: '', invoice_no: '', total_amount: 0, paid_amount: 0, due_date: new Date().toISOString().split('T')[0] });
            setShowCreateModal(true);
          }}
          style={{
            padding: '12px 24px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white',
            border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'; }}
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>add_circle</span>
          Create Outstanding
        </button>
      </div>

      {/* SUMMARY CARDS - Row 1: Financial Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Total Outstanding */}
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', borderRadius: '16px', padding: '20px',
          border: '1px solid #FCD34D', boxShadow: '0 2px 12px rgba(251, 191, 36, 0.15)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(146, 64, 14, 0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(146, 64, 14, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-icons" style={{ fontSize: '22px', color: '#92400E' }}>account_balance_wallet</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Outstanding
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#92400E', lineHeight: 1.1 }}>
            {formatINR(totalOutstanding)}
          </div>
          <div style={{ fontSize: '12px', color: '#B45309', marginTop: '6px' }}>
            Across {outstandingData.length} invoice{outstandingData.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Total Billed */}
        <div style={{
          background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', borderRadius: '16px', padding: '20px',
          border: '1px solid #C4B5FD', boxShadow: '0 2px 12px rgba(139, 92, 246, 0.1)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(91, 33, 182, 0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(91, 33, 182, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-icons" style={{ fontSize: '22px', color: '#5B21B6' }}>description</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#5B21B6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Billed
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#5B21B6', lineHeight: 1.1 }}>
            {formatINR(totalBilled)}
          </div>
          <div style={{ fontSize: '12px', color: '#6D28D9', marginTop: '6px' }}>
            Invoice value
          </div>
        </div>

        {/* Total Collected */}
        <div style={{
          background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', borderRadius: '16px', padding: '20px',
          border: '1px solid #6EE7B7', boxShadow: '0 2px 12px rgba(16, 185, 129, 0.1)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(6, 95, 70, 0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 95, 70, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-icons" style={{ fontSize: '22px', color: '#065F46' }}>payments</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Collected
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#065F46', lineHeight: 1.1 }}>
            {formatINR(totalPaid)}
          </div>
          <div style={{ fontSize: '12px', color: '#047857', marginTop: '6px' }}>
            {collectionRate}% collected
          </div>
        </div>

        {/* Collection Rate */}
        <div style={{
          background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', borderRadius: '16px', padding: '20px',
          border: '1px solid #93C5FD', boxShadow: '0 2px 12px rgba(59, 130, 246, 0.1)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(30, 64, 175, 0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(30, 64, 175, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-icons" style={{ fontSize: '22px', color: '#1E40AF' }}>pie_chart</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Collection Rate
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1E40AF', lineHeight: 1.1 }}>
            {collectionRate}%
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(30, 64, 175, 0.15)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(collectionRate, 100)}%`, height: '100%', background: '#1E40AF', borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS - Row 2: Status Counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #3B82F6' }}>
          <span className="material-icons" style={{ fontSize: '28px', color: '#3B82F6' }}>receipt</span>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1F2937' }}>{outstandingData.length}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Pending Invoices</div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #10B981' }}>
          <span className="material-icons" style={{ fontSize: '28px', color: '#10B981' }}>check_circle</span>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1F2937' }}>{onTimeCount}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>On Time (&lt;30 days)</div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #F59E0B' }}>
          <span className="material-icons" style={{ fontSize: '28px', color: '#F59E0B' }}>warning</span>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1F2937' }}>{warningCount}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Warning (30-60 days)</div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #EF4444' }}>
          <span className="material-icons" style={{ fontSize: '28px', color: '#EF4444' }}>error</span>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1F2937' }}>{criticalCount}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Critical (60+ days)</div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search</label>
          <input type="text" placeholder="Customer name or invoice..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
            style={{ padding: '9px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', minWidth: '200px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Min Balance</label>
          <input type="number" placeholder="Min amount..." value={filters.minAmount} onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
            style={{ padding: '9px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', minWidth: '160px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overdue Status</label>
          <select value={filters.daysOverdue} onChange={(e) => setFilters({...filters, daysOverdue: e.target.value})}
            style={{ padding: '9px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', minWidth: '160px', outline: 'none', background: 'white' }}>
            <option value="ALL">All Invoices</option>
            <option value="0">On Time</option>
            <option value="30">30+ days overdue</option>
            <option value="60">60+ days (Critical)</option>
            <option value="90">90+ days (Very Critical)</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', padding: '9px 16px', background: '#F3F4F6', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
          {filteredData.length} of {outstandingData.length} records
        </div>
      </div>

      {/* OUTSTANDING TABLE */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <th style={_thStyle}>Customer</th>
              <th style={_thStyle}>Invoice</th>
              <th style={_thStyle}>Total Amount</th>
              <th style={_thStyle}>Paid</th>
              <th style={_thStyle}>Balance Due</th>
              <th style={{..._thStyle, minWidth: '120px'}}>Payment Progress</th>
              <th style={_thStyle}>Due Date</th>
              <th style={_thStyle}>Overdue</th>
              <th style={_thStyle}>Status</th>
              <th style={_thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                  <span className="material-icons" style={{ fontSize: '48px', display: 'block', marginBottom: '10px', color: '#D1D5DB' }}>inbox</span>
                  {outstandingData.length === 0 ? 'No outstanding invoices found' : 'No records match your filters'}
                </td>
              </tr>
            ) : (
              filteredData.map(item => {
                const statusClass = item.days_overdue > 60 ? 'critical' : item.days_overdue > 30 ? 'warning' : 'normal';
                const paidPercent = item.total_amount > 0 ? Math.min(100, ((item.paid_amount / item.total_amount) * 100)) : 0;
                const progressColor = paidPercent >= 80 ? '#10B981' : paidPercent >= 50 ? '#F59E0B' : paidPercent > 0 ? '#EF4444' : '#D1D5DB';
                return (
                  <tr key={item.id} style={{
                    borderBottom: '1px solid #F3F4F6',
                    background: statusClass === 'critical' ? '#FEF2F2' : statusClass === 'warning' ? '#FFFBEB' : 'white',
                    transition: 'background 0.15s'
                  }}>
                    <td style={_tdStyle}><div style={{ fontWeight: '700', color: '#1F2937', fontSize: '14px' }}>{item.customer_name}</div></td>
                    <td style={_tdStyle}>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px' }}>{item.invoice_no}</span>
                    </td>
                    <td style={_tdStyle}><div style={{ fontWeight: '700', color: '#1F2937', fontSize: '15px' }}>{formatINR(item.total_amount)}</div></td>
                    <td style={_tdStyle}><div style={{ fontWeight: '600', color: '#059669', fontSize: '14px' }}>{formatINR(item.paid_amount)}</div></td>
                    <td style={_tdStyle}><div style={{ fontWeight: '800', color: '#DC2626', fontSize: '15px' }}>{formatINR(item.balance)}</div></td>
                    <td style={_tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280' }}>{paidPercent.toFixed(0)}% paid</span>
                        <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${paidPercent}%`, height: '100%', background: progressColor, borderRadius: '3px', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </td>
                    <td style={_tdStyle}>
                      <div style={{ fontSize: '13px', color: '#374151' }}>{item.due_date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </td>
                    <td style={_tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                        background: statusClass === 'critical' ? '#FEE2E2' : statusClass === 'warning' ? '#FEF3C7' : '#D1FAE5',
                        color: statusClass === 'critical' ? '#DC2626' : statusClass === 'warning' ? '#D97706' : '#059669'
                      }}>
                        <span className="material-icons" style={{ fontSize: '14px' }}>
                          {item.days_overdue === 0 ? 'schedule' : statusClass === 'critical' ? 'error' : statusClass === 'warning' ? 'warning' : 'info'}
                        </span>
                        {item.days_overdue === 0 ? 'On Time' : `${item.days_overdue}d`}
                      </span>
                    </td>
                    <td style={_tdStyle}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', color: 'white',
                        background: statusClass === 'critical' ? '#EF4444' : statusClass === 'warning' ? '#F59E0B' : '#10B981'
                      }}>
                        {statusClass === 'critical' ? 'Critical' : statusClass === 'warning' ? 'Warning' : 'Normal'}
                      </span>
                    </td>
                    <td style={_tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setSelectedRecord(item); setFormData({ customer_name: item.customer_name, invoice_no: item.invoice_no, total_amount: item.total_amount, paid_amount: item.paid_amount, due_date: item.due_date.toISOString().split('T')[0] }); setShowUpdateModal(true); }}
                          style={{ padding: '6px 14px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Update payment">
                          <span className="material-icons" style={{ fontSize: '14px' }}>edit</span> Update
                        </button>
                        <button onClick={() => deleteOutstanding(item.id)}
                          style={{ padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Delete record">
                          <span className="material-icons" style={{ fontSize: '14px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      {filteredData.length > 0 && (
        <div style={{ background: 'white', borderRadius: '0 0 12px 12px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderTop: '2px solid #E5E7EB', marginTop: '-1px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Filtered Total: </span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#1F2937' }}>{formatINR(filteredData.reduce((s, i) => s + i.total_amount, 0))}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Filtered Paid: </span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#059669' }}>{formatINR(filteredData.reduce((s, i) => s + i.paid_amount, 0))}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Filtered Balance: </span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#DC2626' }}>{formatINR(filteredData.reduce((s, i) => s + i.balance, 0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Outstanding Modal */}
      {showCreateModal && (
        <div style={_overlayStyle}>
          <div style={_modalStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons" style={{ color: '#3B82F6', fontSize: '22px' }}>add_circle</span>
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', margin: 0 }}>Create Outstanding</h2>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Add a new pending invoice</p>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiRequest('/api/outstanding/', {
                  method: 'POST',
                  body: JSON.stringify({
                    customer_name: formData.customer_name,
                    invoice_no: formData.invoice_no,
                    total_amount: parseFloat(formData.total_amount),
                    paid_amount: parseFloat(formData.paid_amount),
                    due_date: formData.due_date
                  })
                });
                setShowCreateModal(false);
                setFormData({ customer_name: '', invoice_no: '', total_amount: 0, paid_amount: 0, due_date: new Date().toISOString().split('T')[0] });
                fetchOutstandingData();
                alert('Outstanding record created successfully');
              } catch (error) {
                alert('Failed to create outstanding: ' + error.message);
              }
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={_labelStyle}>Customer Name *</label>
                  <input type="text" required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} style={_inputStyle} placeholder="Enter customer name" />
                </div>
                <div>
                  <label style={_labelStyle}>Invoice Number *</label>
                  <input type="text" required value={formData.invoice_no} onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })} style={_inputStyle} placeholder="e.g. INV-001" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={_labelStyle}>Total Amount (\u20B9) *</label>
                    <input type="number" required min="0" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} style={_inputStyle} />
                    {formData.total_amount > 0 && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>= {formatINR(formData.total_amount)}</div>}
                  </div>
                  <div>
                    <label style={_labelStyle}>Paid Amount (\u20B9) *</label>
                    <input type="number" required min="0" step="0.01" value={formData.paid_amount} onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })} style={_inputStyle} />
                    {formData.paid_amount > 0 && <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>= {formatINR(formData.paid_amount)}</div>}
                  </div>
                </div>
                {(formData.total_amount > 0 || formData.paid_amount > 0) && (
                  <div style={{ background: '#FEF2F2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#991B1B' }}>Balance Due:</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#DC2626' }}>
                      {formatINR(Math.max(0, (parseFloat(formData.total_amount) || 0) - (parseFloat(formData.paid_amount) || 0)))}
                    </span>
                  </div>
                )}
                <div>
                  <label style={_labelStyle}>Due Date *</label>
                  <input type="date" required value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} style={_inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-icons" style={{ fontSize: '18px' }}>add</span> Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Outstanding Modal */}
      {showUpdateModal && (
        <div style={_overlayStyle}>
          <div style={_modalStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons" style={{ color: '#D97706', fontSize: '22px' }}>edit</span>
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', margin: 0 }}>Update Payment</h2>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{selectedRecord?.customer_name} - {selectedRecord?.invoice_no}</p>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiRequest(`/api/outstanding/${selectedRecord.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    customer_name: formData.customer_name,
                    invoice_no: formData.invoice_no,
                    total_amount: parseFloat(formData.total_amount),
                    paid_amount: parseFloat(formData.paid_amount),
                    due_date: formData.due_date
                  })
                });
                setShowUpdateModal(false);
                setSelectedRecord(null);
                fetchOutstandingData();
                alert('Outstanding record updated successfully');
              } catch (error) {
                alert('Failed to update outstanding: ' + error.message);
              }
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={_labelStyle}>Customer Name *</label>
                  <input type="text" required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} style={_inputStyle} />
                </div>
                <div>
                  <label style={_labelStyle}>Invoice Number *</label>
                  <input type="text" required value={formData.invoice_no} onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })} style={_inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={_labelStyle}>Total Amount (\u20B9) *</label>
                    <input type="number" required min="0" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} style={_inputStyle} />
                    {formData.total_amount > 0 && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>= {formatINR(formData.total_amount)}</div>}
                  </div>
                  <div>
                    <label style={_labelStyle}>Paid Amount (\u20B9) *</label>
                    <input type="number" required min="0" step="0.01" value={formData.paid_amount} onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })} style={_inputStyle} />
                    {formData.paid_amount > 0 && <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>= {formatINR(formData.paid_amount)}</div>}
                  </div>
                </div>
                {(formData.total_amount > 0 || formData.paid_amount > 0) && (
                  <div style={{ background: '#FEF2F2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#991B1B' }}>Balance Due:</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#DC2626' }}>
                      {formatINR(Math.max(0, (parseFloat(formData.total_amount) || 0) - (parseFloat(formData.paid_amount) || 0)))}
                    </span>
                  </div>
                )}
                <div>
                  <label style={_labelStyle}>Due Date *</label>
                  <input type="date" required value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} style={_inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowUpdateModal(false); setSelectedRecord(null); }} style={{ padding: '10px 20px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-icons" style={{ fontSize: '18px' }}>save</span> Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Style constants
const _thStyle = { padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #E5E7EB' };
const _tdStyle = { padding: '12px 14px', fontSize: '13px', color: '#374151', verticalAlign: 'middle' };
const _overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const _modalStyle = { background: 'white', borderRadius: '16px', padding: '28px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' };
const _labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' };
const _inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

export default OutstandingSummary;
