import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import AdminModeBanner from '../../admin/components/AdminModeBanner';

const OutstandingSummary = ({ mode = 'staff' }) => {
  const isAdminMode = mode === 'admin';
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
      // Fetch outstanding invoices from dedicated endpoint
      const invoices = await apiRequest('/api/outstanding/');
      console.log('Outstanding invoices fetched:', invoices);
      
      // Map outstanding data
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
      
      console.log('Outstanding data after mapping:', outstanding);
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
      alert('✅ Outstanding record deleted successfully!');
    } catch (error) {
      alert('❌ Failed to delete record: ' + (error.message || ''));
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
  const criticalCount = outstandingData.filter(item => item.days_overdue > 60).length;
  const warningCount = outstandingData.filter(item => item.days_overdue > 30 && item.days_overdue <= 60).length;

  if (loading) {
    return <div className="loading">⏳ Loading outstanding data...</div>;
  }

  return (
    <div className="reception-page" style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1F2937', marginBottom: '8px' }}>
              💰 Outstanding Summary{isAdminMode ? ' - Admin Management' : ''}
            </h1>
            <p style={{ fontSize: '15px', color: '#6B7280' }}>
              {isAdminMode ? 'Manage and track outstanding payments with detailed insights' : 'Replacement of Outstanding notebook with real-time tracking'}
            </p>
          </div>
          {isAdminMode && (
            <button 
              onClick={() => {
                setFormData({
                  customer_name: '',
                  invoice_no: '',
                  total_amount: 0,
                  paid_amount: 0,
                  due_date: new Date().toISOString().split('T')[0]
                });
                setShowCreateModal(true);
              }}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.3)';
              }}
            >
              ➕ Create Outstanding
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid #FCD34D',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ fontSize: '48px' }}>₹</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#92400E', marginBottom: '4px' }}>
              ₹{(totalOutstanding / 100000).toFixed(2)}L
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Outstanding
            </div>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid #93C5FD',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ fontSize: '48px' }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#1E40AF', marginBottom: '4px' }}>
              {outstandingData.length}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Invoices
            </div>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid #FCA5A5',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ fontSize: '48px' }}>🔴</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#991B1B', marginBottom: '4px' }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Critical (60+ days)
            </div>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #FFEDD5, #FED7AA)',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid #FDBA74',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ fontSize: '48px' }}>🟠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#9A3412', marginBottom: '4px' }}>
              {warningCount}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Warning (30-60 days)
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Customer name or invoice no..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Min Balance:</label>
          <input
            type="number"
            placeholder="Minimum amount..."
            value={filters.minAmount}
            onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>Overdue Status:</label>
          <select value={filters.daysOverdue} onChange={(e) => setFilters({...filters, daysOverdue: e.target.value})}>
            <option value="ALL">All</option>
            <option value="0">Not Overdue</option>
            <option value="30">30+ days</option>
            <option value="60">60+ days (Critical)</option>
            <option value="90">90+ days (Very Critical)</option>
          </select>
        </div>

        <div className="filter-info">
          Showing {filteredData.length} of {outstandingData.length} records
        </div>
      </div>

      {/* OUTSTANDING TABLE */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Invoice No</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Balance</th>
              <th>Due Date</th>
              <th>Days Overdue</th>
              <th>Status</th>
              {isAdminMode && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={isAdminMode ? "9" : "8"} className="empty-state">
                {outstandingData.length === 0 ? '✅ No outstanding invoices' : 'No records match filters'}
              </td></tr>
            ) : (
              filteredData.map(item => {
                const statusClass = item.days_overdue > 60 ? 'critical' : item.days_overdue > 30 ? 'warning' : 'normal';
                return (
                  <tr key={item.id} className={`row-${statusClass}`}>
                    <td><strong>{item.customer_name}</strong></td>
                    <td>{item.invoice_no}</td>
                    <td>₹{item.total_amount.toLocaleString()}</td>
                    <td>₹{item.paid_amount.toLocaleString()}</td>
                    <td className="balance-amount">₹{item.balance.toLocaleString()}</td>
                    <td>{item.due_date.toLocaleDateString()}</td>
                    <td>
                      <span className={`days-badge ${statusClass}`}>
                        {item.days_overdue === 0 ? 'On Time' : `${item.days_overdue} days`}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>
                        {statusClass === 'critical' ? '🔴 Critical' : 
                         statusClass === 'warning' ? '🟠 Warning' : '🟢 Normal'}
                      </span>
                    </td>
                    {isAdminMode && (
                      <td>
                        <button
                          onClick={() => {
                            setSelectedRecord(item);
                            setFormData({
                              customer_name: item.customer_name,
                              invoice_no: item.invoice_no,
                              total_amount: item.total_amount,
                              paid_amount: item.paid_amount,
                              due_date: item.due_date.toISOString().split('T')[0]
                            });
                            setShowUpdateModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#F59E0B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            marginRight: '8px'
                          }}
                        >
                          Update
                        </button>
                        <button
                          onClick={() => deleteOutstanding(item.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                          title="Delete record"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .summary-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 20px;
          border-left: 4px solid;
        }

        .summary-card.total { border-color: #9b59b6; }
        .summary-card.invoices { border-color: #3498db; }
        .summary-card.critical { border-color: #e74c3c; }
        .summary-card.warning { border-color: #f39c12; }

        .card-icon {
          font-size: 40px;
        }

        .card-value {
          font-size: 32px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .card-label {
          font-size: 13px;
          color: #7f8c8d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .notice-banner {
          background: #fff9e6;
          border-left: 4px solid #f39c12;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
          color: #7f6c00;
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

        .row-critical {
          background: #fff5f5;
        }

        .row-warning {
          background: #fff9e6;
        }

        .balance-amount {
          color: #e74c3c;
          font-weight: bold;
          font-size: 15px;
        }

        .days-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .days-badge.normal {
          background: #27ae60;
          color: white;
        }

        .days-badge.warning {
          background: #f39c12;
          color: white;
        }

        .days-badge.critical {
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

        .status-badge.normal {
          background: #27ae60;
          color: white;
        }

        .status-badge.warning {
          background: #f39c12;
          color: white;
        }

        .status-badge.critical {
          background: #e74c3c;
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px !important;
          color: #95a5a6;
          font-style: italic;
          font-size: 16px;
        }

        .loading {
          text-align: center;
          padding: 100px;
          font-size: 20px;
          color: #7f8c8d;
        }
      `}</style>

      {/* Create Outstanding Modal */}
      {showCreateModal && (
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
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
              Create Outstanding Record
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Save to backend
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
                setFormData({
                  customer_name: '',
                  invoice_no: '',
                  total_amount: 0,
                  paid_amount: 0,
                  due_date: new Date().toISOString().split('T')[0]
                });
                // Refresh data
                fetchOutstandingData();
                alert('✅ Outstanding record created successfully');
              } catch (error) {
                alert('❌ Failed to create outstanding: ' + error.message);
              }
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      Total Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      Paid Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.paid_amount}
                      onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    background: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Outstanding Modal */}
      {showUpdateModal && (
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
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
              Update Outstanding Record
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Update in backend
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
                // Refresh data
                fetchOutstandingData();
                alert('✅ Outstanding record updated successfully');
              } catch (error) {
                alert('❌ Failed to update outstanding: ' + error.message);
              }
            }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      Total Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      Paid Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.paid_amount}
                      onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedRecord(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    background: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutstandingSummary;
