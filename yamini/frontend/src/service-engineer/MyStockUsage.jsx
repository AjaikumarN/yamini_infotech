import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

export default function MyStockUsage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/stock-movements/my-usage');
      setUsage(data);
    } catch (error) {
      console.error('Failed to load stock usage:', error);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        ⏳ Loading your stock usage...
      </div>
    );
  }

  if (!usage) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>📦</span>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#111827' }}>My Stock Usage</h1>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '60px', 
            borderRadius: '12px', 
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            Unable to load stock usage data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ padding: '32px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '32px' }}>📦</span>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#111827' }}>
              My Stock Usage
            </h1>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#6b7280', lineHeight: '1.6' }}>
            Track the stock you've taken for service jobs with payment status
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Today's Stats */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              padding: '24px', 
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '600' }}>
                📅 Today's Stock
              </div>
              <div style={{ fontSize: '40px', fontWeight: '800' }}>
                {usage.today.total_items}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
                items across {usage.today.movements_count} movements
              </div>
            </div>

            {/* Week's Stats */}
            <div style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
                📆 This Week's Stock
              </div>
              <div style={{ fontSize: '40px', fontWeight: '800', color: '#111827' }}>
                {usage.this_week.total_items}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                items across {usage.this_week.movements_count} movements
              </div>
            </div>

            {/* Paid Status */}
            <div style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              borderLeft: '4px solid #27ae60',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
                ✅ Paid (This Week)
              </div>
              <div style={{ fontSize: '40px', fontWeight: '800', color: '#27ae60' }}>
                {usage.this_week.paid_count}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                movements paid
              </div>
            </div>

            {/* Pending Status */}
            <div style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              borderLeft: '4px solid #f39c12',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
                ⏳ Pending (This Week)
              </div>
              <div style={{ fontSize: '40px', fontWeight: '800', color: '#f39c12' }}>
                {usage.this_week.pending_count}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                payments pending
              </div>
            </div>
          </div>

          {/* Today's Movement List */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              📅 Today's Stock Movements
            </h2>
            {usage.today.movements.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '40px', 
                borderRadius: '12px', 
                textAlign: 'center',
                color: '#6b7280',
                border: '1px solid #e5e7eb'
              }}>
                No stock movements today
              </div>
            ) : (
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Item Name</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Quantity</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Service ID</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.today.movements.map((movement) => (
                      <tr key={movement.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                          📦 {movement.item_name}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#111827', fontWeight: '700' }}>
                          {movement.quantity}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>
                          {movement.service_request_id ? `#${movement.service_request_id}` : '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '5px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: movement.payment_status === 'PAID' ? '#DEF7EC' : '#FEF3C7',
                            color: movement.payment_status === 'PAID' ? '#03543F' : '#92400E',
                            border: `1px solid ${movement.payment_status === 'PAID' ? '#84E1BC' : '#FCD34D'}`
                          }}>
                            {movement.payment_status === 'PAID' ? '✅' : '⏳'} {movement.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* This Week's Movement List */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
              📆 This Week's Stock Movements
            </h2>
            {usage.this_week.movements.length === 0 ? (
              <div style={{ 
                background: 'white', 
                padding: '40px', 
                borderRadius: '12px', 
                textAlign: 'center',
                color: '#6b7280',
                border: '1px solid #e5e7eb'
              }}>
                No stock movements this week
              </div>
            ) : (
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Item Name</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Quantity</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Service ID</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.this_week.movements.map((movement) => (
                      <tr key={movement.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>
                          {new Date(movement.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                          📦 {movement.item_name}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#111827', fontWeight: '700' }}>
                          {movement.quantity}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>
                          {movement.service_request_id ? `#${movement.service_request_id}` : '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '5px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: movement.payment_status === 'PAID' ? '#DEF7EC' : '#FEF3C7',
                            color: movement.payment_status === 'PAID' ? '#03543F' : '#92400E',
                            border: `1px solid ${movement.payment_status === 'PAID' ? '#84E1BC' : '#FCD34D'}`
                          }}>
                            {movement.payment_status === 'PAID' ? '✅' : '⏳'} {movement.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
