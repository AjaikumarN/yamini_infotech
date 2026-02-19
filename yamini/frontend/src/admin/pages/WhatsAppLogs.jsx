import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const styles = `
  .whatsapp-desktop-table {
    display: none;
  }
  
  .whatsapp-mobile-cards {
    display: block;
  }
  
  @media (min-width: 1024px) {
    .whatsapp-desktop-table {
      display: block;
    }
    
    .whatsapp-mobile-cards {
      display: none;
    }
  }
`;

export default function WhatsAppLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [filter, setFilter] = useState({ 
    event_type: '', 
    status: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadEventTypes();
    loadSummary();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filter, page]);

  const loadEventTypes = async () => {
    try {
      const data = await apiRequest('/whatsapp-logs/event-types');
      setEventTypes(data.event_types || []);
    } catch (error) {
      console.error('Failed to load event types:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await apiRequest('/whatsapp-logs/summary');
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      let endpoint = `/whatsapp-logs?page=${page}&page_size=20`;
      if (filter.event_type) endpoint += `&event_type=${filter.event_type}`;
      if (filter.status) endpoint += `&status=${filter.status}`;
      if (filter.search) endpoint += `&search=${encodeURIComponent(filter.search)}`;
      
      const data = await apiRequest(endpoint);
      setLogs(data.logs || []);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error('Failed to load WhatsApp logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'SENT': '#10B981',
      'PENDING': '#F59E0B',
      'FAILED': '#EF4444',
      'RETRYING': '#3B82F6'
    };
    return colors[status] || '#6B7280';
  };

  const getEventTypeLabel = (eventType) => {
    const found = eventTypes.find(et => et.value === eventType);
    return found ? found.label : eventType;
  };

  const getEventTypeIcon = (eventType) => {
    const icons = {
      'enquiry_created': '📝',
      'service_created': '🔧',
      'engineer_assigned': '👨‍🔧',
      'service_completed': '✅',
      'delivery_failed': '❌',
      'delivery_reattempt': '🔄'
    };
    return icons[eventType] || '📱';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Backend stores UTC timestamps — ensure JS interprets them as UTC
    let str = String(dateString);
    if (!str.endsWith('Z') && !str.includes('+') && !str.includes('-', 10)) {
      str += 'Z';
    }
    const date = new Date(str);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  const handleRetry = async (logId) => {
    try {
      await apiRequest(`/whatsapp-logs/retry/${logId}`, { method: 'POST' });
      loadLogs();
      loadSummary();
    } catch (error) {
      console.error('Failed to retry message:', error);
      alert('Failed to retry message');
    }
  };

  if (loading && logs.length === 0) {
    return <div style={{ padding: '24px' }}>⏳ Loading WhatsApp logs...</div>;
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{ padding: '24px', maxWidth: '1400px' }}>
        
        {/* Gradient Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '32px' }}>📱</span>
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              WhatsApp Message Logs
            </h1>
          </div>
          <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px' }}>
            Customer WhatsApp notification audit trail - All automated messages logged
          </p>

          {/* Stat Pills */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{summary.total_messages}</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Total Messages</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#90EE90' }}>{summary.sent_count}</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Sent ✓</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFD93D' }}>{summary.pending_count}</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Pending</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#FF6B6B' }}>{summary.failed_count}</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Failed</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{summary.today_count}</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Today</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>{summary.this_week_count}</div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>This Week</div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={filter.event_type}
              onChange={(e) => { setFilter({ ...filter, event_type: e.target.value }); setPage(1); }}
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
              <option value="">All Event Types</option>
              {eventTypes.map(et => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
            
            <select
              value={filter.status}
              onChange={(e) => { setFilter({ ...filter, status: e.target.value }); setPage(1); }}
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
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="RETRYING">Retrying</option>
            </select>

            <input
              type="text"
              placeholder="Search phone or name..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px',
                color: '#1F2937',
                background: 'white',
                minWidth: '200px'
              }}
            />

            {(filter.event_type || filter.status || filter.search) && (
              <button
                onClick={() => { setFilter({ event_type: '', status: '', search: '' }); setPage(1); }}
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

            <button
              onClick={() => { loadLogs(); loadSummary(); }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#25D366',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="whatsapp-desktop-table">
          <div style={{
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Event</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Customer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Phone</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Sent At</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                      No WhatsApp messages found
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{getEventTypeIcon(log.event_type)}</span>
                          <span style={{ fontWeight: '500', color: '#1F2937' }}>{getEventTypeLabel(log.event_type)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#4B5563' }}>{log.customer_name || 'N/A'}</td>
                      <td style={{ padding: '16px', color: '#4B5563', fontFamily: 'monospace' }}>{log.customer_phone}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'white',
                          background: getStatusColor(log.status)
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#6B7280', fontSize: '13px' }}>
                        {log.sent_at ? formatDate(log.sent_at) : formatDate(log.created_at)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {log.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#3B82F6',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            🔄 Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="whatsapp-mobile-cards">
          {logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', background: 'white', borderRadius: '12px' }}>
              No WhatsApp messages found
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{getEventTypeIcon(log.event_type)}</span>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1F2937' }}>{getEventTypeLabel(log.event_type)}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{formatDate(log.created_at)}</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    background: getStatusColor(log.status)
                  }}>
                    {log.status}
                  </span>
                </div>
                
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6B7280', fontSize: '13px' }}>Customer:</span>
                    <span style={{ fontWeight: '500', color: '#1F2937' }}>{log.customer_name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6B7280', fontSize: '13px' }}>Phone:</span>
                    <span style={{ fontFamily: 'monospace', color: '#1F2937' }}>{log.customer_phone}</span>
                  </div>
                  {log.error_message && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#FEE2E2', borderRadius: '6px', fontSize: '12px', color: '#EF4444' }}>
                      ⚠️ {log.error_message}
                    </div>
                  )}
                  {log.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetry(log.id)}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#3B82F6',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🔄 Retry Message
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: page === 1 ? '#F3F4F6' : 'white',
                color: page === 1 ? '#9CA3AF' : '#1F2937',
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Previous
            </button>
            <span style={{ padding: '8px 16px', color: '#6B7280' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                background: page === totalPages ? '#F3F4F6' : 'white',
                color: page === totalPages ? '#9CA3AF' : '#1F2937',
                cursor: page === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* Message Preview Modal would go here */}
      </div>
    </>
  );
}
