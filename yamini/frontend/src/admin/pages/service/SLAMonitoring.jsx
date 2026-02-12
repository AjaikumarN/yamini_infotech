import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../../utils/api';

export default function SLAMonitoring() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, onTrack: 0, warning: 0, breached: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/service-requests');
      setServices(data);
      
      // Calculate SLA stats
      const onTrack = data.filter(s => s.sla_status === 'ok' && s.status !== 'COMPLETED').length;
      const warning = data.filter(s => s.sla_status === 'warning').length;
      const breached = data.filter(s => s.sla_status === 'breached').length;
      
      setStats({ total: data.length, onTrack, warning, breached });
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const getSLABadge = (slaStatus) => {
    const styles = {
      'ok': { bg: '#DEF7EC', color: '#03543F', text: 'On Track', border: '#84E1BC' },
      'warning': { bg: '#FEF3C7', color: '#92400E', text: 'At Risk', border: '#FCD34D' },
      'breached': { bg: '#FEE2E2', color: '#991B1B', text: 'Breached', border: '#FCA5A5' },
      'paused': { bg: '#E0E7FF', color: '#3730A3', text: 'On Hold', border: '#A5B4FC' }
    };
    const style = styles[slaStatus] || styles['ok'];
    
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
        {style.text}
      </span>
    );
  };

  const formatRemainingTime = (seconds) => {
    if (!seconds || seconds <= 0) return 'Expired';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>⏳ Loading SLA data...</div>;
  }

  return (
    <div>
      <div style={{ padding: isMobile ? '20px' : '32px' }}>
        {/* Stats Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Total Services</div>
            <div style={{ fontSize: '42px', fontWeight: '800', color: '#0f172a' }}>{stats.total}</div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', padding: '24px', borderRadius: '14px', border: '1px solid #6ee7b7', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)' }}>
            <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ On Track</div>
            <div style={{ fontSize: '42px', fontWeight: '800', color: '#10b981' }}>{stats.onTrack}</div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '24px', borderRadius: '14px', border: '1px solid #fcd34d', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)' }}>
            <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠️ At Risk</div>
            <div style={{ fontSize: '42px', fontWeight: '800', color: '#f59e0b' }}>{stats.warning}</div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)', padding: '24px', borderRadius: '14px', border: '1px solid #fca5a5', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)' }}>
            <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>❌ Breached</div>
            <div style={{ fontSize: '42px', fontWeight: '800', color: '#ef4444' }}>{stats.breached}</div>
          </div>
        </div>

      {/* SLA Table - Desktop */}
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
                <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎫 Ticket #</th>
                <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👤 Customer</th>
                <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚨 Priority</th>
                <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 SLA Status</th>
                <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⏳ Time Remaining</th>
                <th style={{ padding: '18px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👷 Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '15px', borderBottom: '1px solid #e5e7eb' }}>
                    No service requests found
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.target.parentElement.style.background = '#f9fafb'}
                    onMouseOut={(e) => e.target.parentElement.style.background = 'white'}
                  >
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                      {service.ticket_no}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>
                      <div style={{ fontWeight: '600' }}>{service.customer_name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{service.phone}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                      {service.priority}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {getSLABadge(service.sla_status)}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                      {formatRemainingTime(service.sla_remaining_seconds)}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#374151' }}>
                      {service.engineer_name || 'Unassigned'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Mobile Card View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {services.length === 0 ? (
            <div style={{ 
              background: 'white', 
              padding: '60px 20px', 
              borderRadius: '12px', 
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '15px',
              border: '1px solid #e5e7eb'
            }}>
              No service requests found
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>
                      {service.ticket_no}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {service.customer_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {service.phone}
                    </div>
                  </div>
                  {getSLABadge(service.sla_status)}
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
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Priority</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{service.priority}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Time Remaining</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {formatRemainingTime(service.sla_remaining_seconds)}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>Assigned To</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                      {service.engineer_name || 'Unassigned'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>
    </div>
  );
}
