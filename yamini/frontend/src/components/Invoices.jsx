import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import AdminModeBanner from '../admin/components/AdminModeBanner';

/**
 * Invoices - FULLY FUNCTIONAL for Admin
 * Admin can: create, edit (before finalized), export
 * Admin cannot: delete invoices, hide payments
 */
export default function Invoices({ mode = 'staff' }) {
  const isAdminMode = mode === 'admin';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0
  });
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    customer_email: '',
    items: [],
    tax_percent: 18,
    notes: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/invoices/');
      
      // Filter based on selection
      let filtered = data;
      if (filter === 'paid') {
        filtered = data.filter(i => i.status === 'PAID' || i.payment_status === 'PAID');
      } else if (filter === 'pending') {
        filtered = data.filter(i => i.status === 'PENDING' || i.payment_status === 'PENDING');
      } else if (filter === 'overdue') {
        filtered = data.filter(i => i.status === 'OVERDUE' || i.payment_status === 'OVERDUE');
      }
      
      setInvoices(filtered);
      
      // Calculate stats
      const totalAmount = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      setStats({
        total: data.length,
        paid: data.filter(i => i.status === 'PAID' || i.payment_status === 'PAID').length,
        pending: data.filter(i => i.status === 'PENDING' || i.payment_status === 'PENDING').length,
        overdue: data.filter(i => i.status === 'OVERDUE' || i.payment_status === 'OVERDUE').length,
        totalAmount
      });
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.customer_email) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      await apiRequest('/api/invoices/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert('✅ Invoice created successfully');
      setShowCreateModal(false);
      setFormData({
        order_id: '',
        customer_name: '',
        customer_email: '',
        items: [],
        tax_percent: 18,
        notes: ''
      });
      // Reset filter to show all invoices
      setFilter('all');
      // Small delay then reload
      setTimeout(() => loadInvoices(), 100);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('❌ Failed to create invoice');
    }
  };

  const handleExport = async (invoiceId) => {
    try {
      // Fetch full invoice details
      const invoice = await apiRequest(`/api/invoices/${invoiceId}`);
      generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      alert('Failed to generate invoice PDF');
    }
  };

  const generateInvoicePDF = (invoice) => {
    const items = invoice.items || [];
    const subtotal = invoice.subtotal || 0;
    const taxAmount = invoice.tax_amount || 0;
    const totalAmount = invoice.total_amount || 0;
    const amountPaid = invoice.amount_paid || 0;
    const outstanding = totalAmount - amountPaid;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #000;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .company-name {
      font-size: 18px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 14px;
    }
    .section-title {
      font-weight: bold;
      background: #f2f2f2;
      padding: 6px;
      border: 1px solid #000;
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
    }
    th {
      background: #fafafa;
    }
    .right {
      text-align: right;
    }
    .total-box {
      font-size: 14px;
      font-weight: bold;
    }
    .footer-note {
      font-size: 10px;
      border-top: 1px dashed #000;
      margin-top: 15px;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Yamini Infotech</div>
    <div>Billing & Invoice</div>
  </div>

  <div class="section">
    <table>
      <tr>
        <td><b>Invoice #</b></td>
        <td>INV-${invoice.id}</td>
        <td><b>Invoice Date</b></td>
        <td>${invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}</td>
      </tr>
      <tr>
        <td><b>Status</b></td>
        <td>${invoice.status || invoice.payment_status || 'PENDING'}</td>
        <td><b>Payment Mode</b></td>
        <td>${invoice.payment_mode || 'N/A'}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Customer Details</div>
    <table>
      <tr>
        <td><b>Customer Name</b></td>
        <td>${invoice.customer_name || 'N/A'}</td>
      </tr>
      <tr>
        <td><b>Email</b></td>
        <td>${invoice.customer_email || 'N/A'}</td>
      </tr>
      <tr>
        <td><b>Contact</b></td>
        <td>${invoice.customer_phone || 'N/A'}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Invoice Items</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th class="right">Qty</th>
          <th class="right">Rate</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.description || item.product_name || 'Item'}</td>
          <td class="right">${item.quantity || 1}</td>
          <td class="right">₹${parseFloat(item.rate || item.price || 0).toLocaleString()}</td>
          <td class="right">₹${parseFloat(item.amount || (item.quantity * item.rate) || 0).toLocaleString()}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <table>
      <tr>
        <td class="right"><b>Subtotal</b></td>
        <td class="right">₹${parseFloat(subtotal).toLocaleString()}</td>
      </tr>
      <tr>
        <td class="right"><b>Tax (GST ${invoice.tax_percent || 18}%)</b></td>
        <td class="right">₹${parseFloat(taxAmount).toLocaleString()}</td>
      </tr>
      <tr>
        <td class="right total-box">Total Amount</td>
        <td class="right total-box">₹${parseFloat(totalAmount).toLocaleString()}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Outstanding Summary</div>
    <table>
      <tr>
        <td><b>Total Invoice Amount</b></td>
        <td class="right">₹${parseFloat(totalAmount).toLocaleString()}</td>
      </tr>
      <tr>
        <td><b>Amount Paid</b></td>
        <td class="right">₹${parseFloat(amountPaid).toLocaleString()}</td>
      </tr>
      <tr>
        <td><b>Outstanding Balance</b></td>
        <td class="right">₹${parseFloat(outstanding).toLocaleString()}</td>
      </tr>
    </table>
  </div>

  ${invoice.notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div style="padding: 8px; border: 1px solid #000;">${invoice.notes}</div>
  </div>
  ` : ''}

  <div class="section">
    <table>
      <tr>
        <td height="60">
          Prepared By (Reception)<br><br>
          Signature: ___________
        </td>
        <td height="60">
          Authorized By (Admin)<br><br>
          Signature: ___________
        </td>
      </tr>
    </table>
  </div>

  <div class="footer-note">
    This is a system‑generated invoice. Please contact the office for any discrepancies.
  </div>
</body>
</html>
    `;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
    
    setTimeout(() => {
      newWindow.print();
    }, 500);
  };

  const handleUpdatePaymentStatus = async (invoiceId, newStatus) => {
    if (!confirm(`Mark invoice as ${newStatus}?`)) return;
    
    try {
      await apiRequest(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        body: JSON.stringify({ payment_status: newStatus })
      });
      alert('✅ Payment status updated');
      loadInvoices();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('❌ Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'PAID': { bg: '#DEF7EC', color: '#03543F', border: '#84E1BC' },
      'PENDING': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
      'OVERDUE': { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' }
    };
    const style = styles[status] || styles['PENDING'];
    
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>⏳ Loading invoices...</div>;
  }

  return (
    <div>
      
      <div style={{ padding: isMobile ? '20px' : '32px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                💳 Billing & Invoices
              </h1>
              <p style={{ fontSize: isMobile ? '14px' : '16px', color: '#6b7280' }}>
                {isAdminMode 
                  ? 'Create and manage customer invoices with complete control' 
                  : 'View customer billing and invoices efficiently'}
              </p>
            </div>
            {isAdminMode && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s',
                  transform: 'translateY(0)',
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                ➕ Create Invoice
              </button>
            )}
          </div>

          {/* Filter Buttons Section */}
          <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['all', 'paid', 'pending', 'overdue'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: filter === f ? 'none' : '2px solid #e5e7eb',
                    background: filter === f ? '#667eea' : 'white',
                    color: filter === f ? 'white' : '#374151',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: filter === f ? '0 4px 14px rgba(102, 126, 234, 0.4)' : 'none',
                  }}
                  onMouseOver={(e) => {
                    if (filter !== f) {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.color = '#667eea';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (filter !== f) {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.color = '#374151';
                    }
                  }}
                >
                  {f === 'all' ? '📋 All' : f === 'paid' ? '✅ Paid' : f === 'pending' ? '⏳ Pending' : '🚨 Overdue'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices Table - Desktop */}
        {!isMobile ? (
          <div style={{ 
            background: 'white', 
            borderRadius: '14px', 
            border: '1px solid #e5e7eb',
            overflow: 'auto',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📄 Invoice #</th>
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👤 Customer</th>
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Date</th>
                  <th style={{ padding: '18px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Amount</th>
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Status</th>
                  {isAdminMode && (
                    <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminMode ? "6" : "5"} style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '15px', borderBottom: '1px solid #e5e7eb' }}>
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s', cursor: 'pointer' }}
                      onMouseOver={(e) => e.target.parentElement.style.background = '#f9fafb'}
                      onMouseOut={(e) => e.target.parentElement.style.background = 'white'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>
                        INV-{invoice.id}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>
                        {invoice.customer_name || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>
                        {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151', textAlign: 'right', fontWeight: '600' }}>
                        ₹{invoice.total_amount?.toLocaleString() || '0'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {getStatusBadge(invoice.status || invoice.payment_status || 'PENDING')}
                      </td>
                      {isAdminMode && (
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleExport(invoice.id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #3b82f6',
                                background: 'white',
                                color: '#3b82f6',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#eff6ff';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = 'white';
                              }}
                            >
                              📄 Export
                            </button>
                            {(invoice.status === 'PENDING' || invoice.payment_status === 'PENDING') && (
                              <button
                                onClick={() => handleUpdatePaymentStatus(invoice.id, 'PAID')}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: '#10b981',
                                  color: 'white',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.background = '#059669';
                                  e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.background = '#10b981';
                                  e.target.style.boxShadow = 'none';
                                }}
                              >
                                ✅ Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Mobile Card View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invoices.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '60px 20px', 
                borderRadius: '12px', 
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '15px',
                border: '1px solid #e5e7eb'
              }}>
                No invoices found
              </div>
            ) : (
              invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '16px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                      INV-{invoice.id}
                    </span>
                    {getStatusBadge(invoice.status || invoice.payment_status || 'PENDING')}
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Customer</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{invoice.customer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Date</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Amount</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                        ₹{invoice.total_amount?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                  
                  {isAdminMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => handleExport(invoice.id)}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1.5px solid #3b82f6',
                          background: 'white',
                          color: '#3b82f6',
                          fontSize: '14px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          width: '100%',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#eff6ff';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'white';
                        }}
                      >
                        📄 Export
                      </button>
                      {(invoice.status === 'PENDING' || invoice.payment_status === 'PENDING') && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(invoice.id, 'PAID')}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#10b981',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            width: '100%',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = '#059669';
                            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = '#10b981';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          ✅ Mark Paid
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '16px' }}>Create New Invoice</h2>
            <form onSubmit={handleCreateInvoice}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Customer Email *
                </label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Tax (%)
                </label>
                <input
                  type="number"
                  value={formData.tax_percent}
                  onChange={(e) => setFormData({...formData, tax_percent: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
