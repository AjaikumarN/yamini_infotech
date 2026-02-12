import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

export default function StockAnalytics() {
  const [period, setPeriod] = useState('week'); // week or month
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEngineer, setSelectedEngineer] = useState(null); // For drill-down modal

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/stock-movements/analytics/engineer?period=${period}`);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>⏳ Loading stock analytics...</div>;
  }

  if (!analytics || !analytics.engineers || analytics.engineers.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#111827' }}>Stock Analytics</h1>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '60px', 
            borderRadius: '12px', 
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            No stock movements found for the selected period.
          </div>
        </div>
      </div>
    );
  }

  const totalMovements = analytics.engineers.reduce((sum, e) => sum + e.total_movements, 0);
  const totalItems = analytics.engineers.reduce((sum, e) => sum + e.total_items_taken, 0);
  const totalPaid = analytics.engineers.reduce((sum, e) => sum + e.paid_count, 0);
  const totalPending = analytics.engineers.reduce((sum, e) => sum + e.pending_count, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ padding: '32px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#111827' }}>
              Stock Analytics - Engineer Accountability
            </h1>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#6b7280', lineHeight: '1.6' }}>
            Track stock OUT movements per engineer with payment status and service linkage
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div style={{ padding: '24px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPeriod('week')}
              style={{
                padding: '10px 18px',
                border: `2px solid ${period === 'week' ? '#667eea' : '#e5e7eb'}`,
                background: period === 'week' ? '#667eea' : 'white',
                color: period === 'week' ? 'white' : '#374151',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: period === 'week' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            >
              📅 Last 7 Days
            </button>
            <button
              onClick={() => setPeriod('month')}
              style={{
                padding: '10px 18px',
                border: `2px solid ${period === 'month' ? '#667eea' : '#e5e7eb'}`,
                background: period === 'month' ? '#667eea' : 'white',
                color: period === 'month' ? 'white' : '#374151',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: period === 'month' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            >
              📅 Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
                Total Movements
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#111827' }}>
                {totalMovements}
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
                Total Items OUT
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#111827' }}>
                {totalItems}
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderLeft: '4px solid #27ae60'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
                ✅ Paid Movements
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#27ae60' }}>
                {totalPaid}
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderLeft: '4px solid #f39c12'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
                ⏳ Pending Payments
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: '#f39c12' }}>
                {totalPending}
              </div>
            </div>
          </div>

          {/* Engineer Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '24px' 
          }}>
            {analytics.engineers.map((engineer) => (
              <div
                key={engineer.engineer_id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedEngineer(engineer)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                    👤 {engineer.engineer_name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Engineer ID: {engineer.engineer_id}
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Movements</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                      {engineer.total_movements}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Items Taken</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                      {engineer.total_items_taken}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  paddingTop: '16px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>✅ PAID</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#27ae60' }}>
                      {engineer.paid_count}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>⏳ PENDING</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#f39c12' }}>
                      {engineer.pending_count}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  marginTop: '16px', 
                  padding: '8px 12px', 
                  background: '#f9fafb', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#6b7280',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  Click to view details 📋
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      {selectedEngineer && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedEngineer(null)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', color: '#111827' }}>
                👤 {selectedEngineer.engineer_name}
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Detailed stock movement history for the selected period
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '24px',
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Movements</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {selectedEngineer.total_movements}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Items Taken</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                  {selectedEngineer.total_items_taken}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>✅ Paid</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#27ae60' }}>
                  {selectedEngineer.paid_count}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>⏳ Pending</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f39c12' }}>
                  {selectedEngineer.pending_count}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontWeight: '600', fontSize: '16px', color: '#111827' }}>
              Movement History
            </div>

            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px', 
              overflow: 'hidden' 
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Service ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEngineer.movements_detail.map((movement, idx) => (
                    <tr 
                      key={movement.id}
                      style={{ borderBottom: '1px solid #e5e7eb' }}
                    >
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>
                        {new Date(movement.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#111827', fontWeight: '600' }}>
                        {movement.item_name}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#111827', fontWeight: '600' }}>
                        {movement.quantity}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>
                        {movement.service_request_id || '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
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

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedEngineer(null)}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
