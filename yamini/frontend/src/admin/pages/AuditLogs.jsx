import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const styles = `
  .audit-desktop-table {
    display: none;
  }
  
  .audit-mobile-cards {
    display: block;
  }
  
  @media (min-width: 1024px) {
    .audit-desktop-table {
      display: block;
    }
    
    .audit-mobile-cards {
      display: none;
    }
  }
`;

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ module: '', action: '' });
  const [stats, setStats] = useState({ total: 0, today: 0, creates: 0, deletes: 0 });

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/audit/logs?limit=100';
      if (filter.module) endpoint += `&module=${filter.module}`;
      if (filter.action) endpoint += `&action=${filter.action}`;
      
      const data = await apiRequest(endpoint);
      setLogs(data);
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysLogs = data.filter(log => new Date(log.timestamp) >= today);
      const creates = data.filter(log => log.action === 'CREATE').length;
      const deletes = data.filter(log => log.action === 'DELETE').length;
      
      setStats({
        total: data.length,
        today: todaysLogs.length,
        creates,
        deletes
      });
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      'CREATE': '#10B981',
      'UPDATE': '#F59E0B',
      'DELETE': '#EF4444',
      'LOGIN': '#3B82F6',
      'APPROVE': '#8B5CF6'
    };
    return colors[action] || '#6B7280';
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>⏳ Loading audit logs...</div>;
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{ padding: '24px', maxWidth: '1400px' }}>
      {/* Gradient Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
          Audit Logs
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px' }}>
          Complete system activity trail - All admin actions are logged
        </p>

        {/* Stat Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Total Logs</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.today}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Today</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.creates}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Creates</div>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.deletes}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Deletes</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={filter.module}
            onChange={(e) => setFilter({ ...filter, module: e.target.value })}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              fontSize: '14px',
              color: '#1F2937',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">All Modules</option>
            <option value="user">Users</option>
            <option value="attendance">Attendance</option>
            <option value="enquiry">Enquiries</option>
            <option value="order">Orders</option>
            <option value="service">Service</option>
          </select>
          
          <select
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              fontSize: '14px',
              color: '#1F2937',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="APPROVE">Approve</option>
          </select>

          {(filter.module || filter.action) && (
            <button
              onClick={() => setFilter({ module: '', action: '' })}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #EF4444',
                background: '#FEE2E2',
                color: '#EF4444',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="audit-desktop-table">
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timestamp</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Module</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Record</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '48px 16px', textAlign: 'center', color: '#9CA3AF' }}>
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6B7280' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1F2937', fontWeight: '600' }}>
                      {log.username}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: `${getActionColor(log.action)}20`,
                        color: getActionColor(log.action)
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1F2937' }}>
                      {log.module}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6B7280' }}>
                      {log.record_type} #{log.record_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="audit-mobile-cards">
        {logs.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: '#9CA3AF' }}>
            No audit logs found
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {logs.map((log) => (
              <div key={log.id} style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1F2937' }}>
                    {log.username}
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: `${getActionColor(log.action)}20`,
                    color: getActionColor(log.action)
                  }}>
                    {log.action}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#1F2937' }}>Module:</span> {log.module}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ fontWeight: '600', color: '#1F2937' }}>Record:</span> {log.record_type} #{log.record_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
