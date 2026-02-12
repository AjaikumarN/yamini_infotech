import React, { useState, useEffect } from 'react';
import { getMyOrders } from '../hooks/useSalesmanApi';
import EmptyState from '../components/EmptyState';
import ExportButtons from '../components/ExportButtons';
import { showToast } from '../components/ToastNotification';
import ActionButton from '../../components/shared/dashboard/ActionButton';
import DataCard from '../../components/shared/dashboard/DataCard';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import '../styles/salesman.css';

/**
 * Orders Page - Enhanced with filters and export
 */
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      showToast && showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.id?.toString().includes(query) ||
        o.customer_name?.toLowerCase().includes(query) ||
        o.phone?.includes(query) ||
        o.email?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  // Calculate total revenue from filtered orders
  const totalRevenue = filteredOrders.reduce((sum, order) => 
    sum + (order.total_amount || 0), 0
  );

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#6B7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            Orders
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            {filteredOrders.length} orders • ₹{totalRevenue.toLocaleString()} total revenue
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ActionButton 
            variant="primary" 
            icon="add_shopping_cart"
            onClick={() => window.location.href = '/salesman/create-order'}
          >
            Create Order
          </ActionButton>
          <ExportButtons 
            data={filteredOrders} 
            filename="orders" 
            type="orders" 
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Search by order ID, customer name, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontSize: '14px',
            color: '#374151',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3B82F6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = 'none';
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            background: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: '180px'
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">⏳ Pending</option>
          <option value="confirmed">✅ Confirmed</option>
          <option value="processing">📦 Processing</option>
          <option value="delivered">🎉 Delivered</option>
          <option value="cancelled">❌ Cancelled</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState 
          icon="🧾" 
          message={searchQuery || statusFilter !== 'all'
            ? "No orders match your filters" 
            : "No orders yet. Keep pushing to close those sales!"
          } 
        />
      ) : (
        <DataCard
          title={`Orders (${filteredOrders.length})`}
          subtitle="Manage and track your order conversions"
          noPadding
        >
          {/* Orders List */}
          <div style={{ overflowX: 'auto' }}>
            {filteredOrders.map((order, index) => {
              const OrderRow = () => {
                const [expanded, setExpanded] = React.useState(false);
                
                return (
                  <div>
                    {/* Main Row */}
                    <div 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr 1.2fr 1fr 1fr 1.2fr 0.4fr',
                        gap: '16px',
                        padding: '16px 20px',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        borderBottom: index < filteredOrders.length - 1 ? '1px solid #F3F4F6' : 'none',
                        minWidth: '900px'
                      }}
                      onClick={() => setExpanded(!expanded)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      {/* Order ID */}
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        color: '#2563EB'
                      }}>
                        #{order.id}
                      </div>

                      {/* Customer Name + Phone */}
                      <div>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 600, 
                          color: '#111827',
                          marginBottom: '2px'
                        }}>
                          {order.customer_name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#9CA3AF'
                        }}>
                          {order.phone}
                        </div>
                      </div>

                      {/* Amount */}
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: 700,
                        color: '#059669'
                      }}>
                        ₹{order.total_amount?.toLocaleString() || '0'}
                      </div>

                      {/* Status Badge */}
                      <div>
                        <StatusBadge 
                          status={order.status?.toUpperCase() || 'PENDING'}
                          variant={order.status?.toLowerCase() || 'pending'}
                          size="sm"
                        />
                      </div>

                      {/* Progress */}
                      <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                        {order.status === 'pending' && '▮░░░'}
                        {order.status === 'confirmed' && '▮▮░░'}
                        {order.status === 'processing' && '▮▮▮░'}
                        {order.status === 'delivered' && '▮▮▮▮'}
                        {order.status === 'cancelled' && '✕'}
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500' }}>
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>

                      {/* Expand Arrow */}
                      <div style={{ 
                        textAlign: 'center',
                        fontSize: '18px',
                        color: '#9CA3AF',
                        transition: 'transform 0.2s',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}>
                        ▼
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expanded && (
                      <div style={{
                        padding: '16px 20px',
                        background: '#F9FAFB',
                        borderTop: '1px solid #F3F4F6',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '16px'
                      }}>
                        {/* Customer Details */}
                        <div style={{ 
                          padding: '12px',
                          background: '#FFFFFF',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB'
                        }}>
                          <div style={{ 
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#6B7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Customer
                          </div>
                          <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px', fontWeight: '600' }}>
                            {order.customer_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
                            ☎️ {order.phone}
                          </div>
                          {order.email && (
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>
                              ✉️ {order.email}
                            </div>
                          )}
                        </div>

                        {/* Order Details */}
                        <div style={{ 
                          padding: '12px',
                          background: '#FFFFFF',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB'
                        }}>
                          <div style={{ 
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#6B7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Order Info
                          </div>
                          <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px', fontWeight: '600' }}>
                            Order #{order.id}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
                            📅 {new Date(order.created_at).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '13px', color: '#059669', fontWeight: 700 }}>
                            ₹{order.total_amount?.toLocaleString() || '0'}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ 
                          padding: '12px',
                          background: '#FFFFFF',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB'
                        }}>
                          <div style={{ 
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#6B7280',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Actions
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <a 
                              href={`tel:${order.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: '#DBEAFE',
                                color: '#1E40AF',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#3B82F6';
                                e.currentTarget.style.color = '#FFFFFF';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#DBEAFE';
                                e.currentTarget.style.color = '#1E40AF';
                              }}
                            >
                              ☎️ Call
                            </a>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('Feature coming soon: Track order');
                              }}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: '#F3F4F6',
                                color: '#374151',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                            >
                              📦 Track
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              };
              
              return <OrderRow key={order.id} />;
            })}
          </div>
        </DataCard>
      )}
    </div>
  );
}
