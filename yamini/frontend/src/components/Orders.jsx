import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import AdminModeBanner from '../admin/components/AdminModeBanner';
import CreateOrder from './CreateOrder.jsx';

/**
 * Orders - FULLY FUNCTIONAL for Admin
 * Admin can: create, edit, approve, reject, update status
 * Admin cannot: delete orders, hide orders
 */
export default function Orders({ mode = 'staff' }) {
  const isAdminMode = mode === 'admin';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadOrders();
    loadEnquiries();
  }, [filter]);

  const loadEnquiries = async () => {
    try {
      const data = await apiRequest('/api/enquiries/');
      // Only show enquiries without orders
      const unorderedEnquiries = data.filter(e => !orders.some(o => o.enquiry_id === e.id));
      setEnquiries(unorderedEnquiries);
    } catch (error) {
      console.error('Failed to load enquiries:', error);
      setEnquiries([]);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Mark orders as viewed to clear badge count
      apiRequest('/api/notifications/mark-viewed/orders', { method: 'PUT' }).catch(() => {});
      const data = await apiRequest('/api/orders/');
      
      // Filter based on selection
      let filtered = data;
      if (filter === 'pending') {
        filtered = data.filter(o => ['PENDING', 'Pending'].includes(o.status));
      } else if (filter === 'approved') {
        filtered = data.filter(o => ['APPROVED', 'Approved'].includes(o.status));
      } else if (filter === 'rejected') {
        filtered = data.filter(o => ['REJECTED', 'Rejected'].includes(o.status));
      }
      
      setOrders(filtered);
      
      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(o => ['PENDING', 'Pending'].includes(o.status)).length,
        approved: data.filter(o => ['APPROVED', 'Approved'].includes(o.status)).length,
        rejected: data.filter(o => ['REJECTED', 'Rejected'].includes(o.status)).length
      });
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    if (!confirm('Approve this order?')) return;
    
    try {
      await apiRequest(`/api/orders/${orderId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ approved: true })
      });
      alert('✅ Order approved successfully');
      loadOrders();
    } catch (error) {
      console.error('Failed to approve order:', error);
      if (error.response?.status === 404) {
        alert(`❌ Order #${orderId} not found. It may have been deleted.`);
      } else if (error.response?.status === 403) {
        alert('❌ You do not have permission to approve orders');
      } else {
        alert('❌ Failed to approve order. Please try again.');
      }
    }
  };

  const handleReject = async (orderId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await apiRequest(`/api/orders/${orderId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ rejection_reason: reason })
      });
      alert('✅ Order rejected');
      loadOrders();
    } catch (error) {
      console.error('Failed to reject order:', error);
      if (error.response?.status === 404) {
        alert(`❌ Order #${orderId} not found. It may have been deleted.`);
      } else if (error.response?.status === 403) {
        alert('❌ You do not have permission to reject orders');
      } else {
        alert('❌ Failed to reject order. Please try again.');
      }
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const reason = prompt(`Enter reason for status change to ${newStatus}:`);
    if (!reason) return;
    
    try {
      // Admin can force update status
      await apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, reason, admin_override: true })
      });
      alert('✅ Status updated');
      loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('❌ Failed to update status');
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await apiRequest(`/api/orders/${orderId}`, { method: 'DELETE' });
      alert('✅ Order deleted successfully');
      loadOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('❌ Failed to delete order: ' + (error.message || ''));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
      'Pending': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
      'APPROVED': { bg: '#DEF7EC', color: '#03543F', border: '#84E1BC' },
      'Approved': { bg: '#DEF7EC', color: '#03543F', border: '#84E1BC' },
      'REJECTED': { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
      'Rejected': { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
      'DELIVERED': { bg: '#E0E7FF', color: '#3730A3', border: '#A5B4FC' },
      'Delivered': { bg: '#E0E7FF', color: '#3730A3', border: '#A5B4FC' }
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
    return <div style={{ padding: '24px' }}>⏳ Loading orders...</div>;
  }

  return (
    <div>
      
      <div style={{ padding: isMobile ? '20px' : '32px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                📋 {isAdminMode ? 'Orders - Admin Management' : 'Orders Management'}
              </h1>
              <p style={{ fontSize: isMobile ? '14px' : '16px', color: '#6b7280' }}>
                {isAdminMode 
                  ? 'Create, approve, and manage customer orders with full control' 
                  : 'View and manage orders efficiently'}
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
                ➕ Create Order
              </button>
            )}
          </div>

          {/* Filter Buttons Section */}
          <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['all', 'pending', 'approved', 'rejected'].map((f) => (
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
                  {f === 'all' ? '📋 All' : f === 'pending' ? '⏳ Pending' : f === 'approved' ? '✅ Approved' : '❌ Rejected'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table - Desktop */}
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
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🆔 Order ID</th>
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👤 Customer</th>
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📦 Product</th>
                  <th style={{ padding: '18px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔢 Quantity</th>
                  <th style={{ padding: '18px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Amount</th>
                  <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Status</th>
                  {isAdminMode && (
                    <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={isAdminMode ? "7" : "6"} style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '15px', borderBottom: '1px solid #e5e7eb' }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s', cursor: 'pointer' }}
                      onMouseOver={(e) => e.target.parentElement.style.background = '#f9fafb'}
                      onMouseOut={(e) => e.target.parentElement.style.background = 'white'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>
                        #{order.id}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>
                        {order.customer_name || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>
                        {order.product_name || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151', textAlign: 'right' }}>
                        {order.quantity}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151', textAlign: 'right', fontWeight: '600' }}>
                        ₹{order.total_amount?.toLocaleString() || '0'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {getStatusBadge(order.status)}
                      </td>
                      {isAdminMode && (
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {['PENDING', 'Pending'].includes(order.status) && (
                              <>
                                <button
                                  onClick={() => handleApprove(order.id)}
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
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={() => handleReject(order.id)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #ef4444',
                                    background: 'white',
                                    color: '#ef4444',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => {
                                    e.target.style.background = '#fef2f2';
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.background = 'white';
                                  }}
                                >
                                  ❌ Reject
                                </button>
                              </>
                            )}
                            {['APPROVED', 'Approved'].includes(order.status) && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
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
                                📦 Mark Delivered
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(order.id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #ef4444',
                                background: 'white',
                                color: '#ef4444',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#fef2f2';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = 'white';
                              }}
                              title="Delete order"
                            >
                              🗑️
                            </button>
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
            {orders.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '60px 20px', 
                borderRadius: '12px', 
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '15px',
                border: '1px solid #e5e7eb'
              }}>
                No orders found
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
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
                      Order #{order.id}
                    </span>
                    {getStatusBadge(order.status)}
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
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{order.customer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Product</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{order.product_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Quantity</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{order.quantity}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Amount</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>₹{order.total_amount?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                  
                  {isAdminMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {['PENDING', 'Pending'].includes(order.status) && (
                        <>
                          <button
                            onClick={() => handleApprove(order.id)}
                            style={{
                              padding: '12px',
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
                            ✅ Approve Order
                          </button>
                          <button
                            onClick={() => handleReject(order.id)}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1.5px solid #ef4444',
                              background: 'white',
                              color: '#ef4444',
                              fontSize: '14px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              width: '100%',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#fef2f2';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'white';
                            }}
                          >
                            ❌ Reject Order
                          </button>
                        </>
                      )}
                      {['APPROVED', 'Approved'].includes(order.status) && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                          style={{
                            padding: '12px',
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
                          📦 Mark Delivered
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

      {/* Create Order Modal - reuse existing component */}
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
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>Create New Order</h2>
            <p style={{ color: '#6B7280', marginBottom: '20px', fontSize: '14px' }}>
              Select an enquiry to convert into an order
            </p>

            {enquiries.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                background: '#F9FAFB', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ color: '#6B7280', marginBottom: '12px' }}>No available enquiries to convert</p>
                <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Create an enquiry first, then come back here to convert it to an order.</p>
              </div>
            ) : (
              <div style={{ marginBottom: '20px', maxHeight: '400px', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Select</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Customer</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Product</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Quantity</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enq) => (
                      <tr 
                        key={enq.id}
                        onClick={() => setSelectedEnquiry(enq)}
                        style={{ 
                          borderBottom: '1px solid #E5E7EB',
                          cursor: 'pointer',
                          background: selectedEnquiry?.id === enq.id ? '#EFF6FF' : 'white'
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="radio" 
                            checked={selectedEnquiry?.id === enq.id}
                            onChange={() => setSelectedEnquiry(enq)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1F2937' }}>
                          {new Date(enq.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1F2937', fontWeight: '600' }}>
                          {enq.customer_name}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1F2937' }}>
                          {enq.product_name}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                          {enq.quantity}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: enq.status === 'NEW' ? '#DBEAFE' : '#F3F4F6',
                            color: enq.status === 'NEW' ? '#1E40AF' : '#6B7280'
                          }}>
                            {enq.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedEnquiry(null);
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
              {selectedEnquiry && (
                <button
                  onClick={async () => {
                    try {
                      await apiRequest('/api/orders/', {
                        method: 'POST',
                        body: JSON.stringify({
                          enquiry_id: selectedEnquiry.id,
                          quantity: selectedEnquiry.quantity || 1,
                          discount_percent: 0,
                          notes: `Created from enquiry #${selectedEnquiry.id}`
                        })
                      });
                      alert('✅ Order created successfully');
                      setShowCreateModal(false);
                      setSelectedEnquiry(null);
                      loadOrders();
                      loadEnquiries();
                    } catch (error) {
                      console.error('Failed to create order:', error);
                      alert('❌ Failed to create order');
                    }
                  }}
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
                  Create Order from Enquiry
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
