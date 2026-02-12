import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

const SLATracker = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, warning, breached

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchServices = async () => {
    try {
      const data = await apiRequest('/api/service-requests/my-services');
      // Only show non-completed services
      const activeServices = data.filter(s => s.status !== 'COMPLETED' && s.status !== 'CANCELLED');
      setServices(activeServices);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSLAColor = (status) => {
    const colors = {
      ok: '#10b981',
      warning: '#f59e0b',
      breached: '#ef4444',
      paused: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getSLAIcon = (status) => {
    const icons = {
      ok: '🟢',
      warning: '🟠',
      breached: '🔴',
      paused: '⏸'
    };
    return icons[status] || '⚪';
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0h 0m';
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    return seconds < 0 ? `-${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
  };

  const getProgressPercentage = (sla) => {
    if (!sla || !sla.total_seconds) return 0;
    const elapsed = sla.total_seconds - sla.remaining;
    return Math.min((elapsed / sla.total_seconds) * 100, 100);
  };

  const filteredServices = services.filter(service => {
    if (filter === 'warning') {
      return service.sla_status?.status === 'warning';
    }
    if (filter === 'breached') {
      return service.sla_status?.status === 'breached';
    }
    return true;
  });

  // Count by status
  const counts = {
    all: services.length,
    warning: services.filter(s => s.sla_status?.status === 'warning').length,
    breached: services.filter(s => s.sla_status?.status === 'breached').length
  };

  if (loading) {
    return (
      <div className="sla-loading">
        <div className="spinner"></div>
        <p>Loading SLA data...</p>
      </div>
    );
  }

  return (
    <div className="sla-tracker">
      <div className="sla-header">
        <div className="header-left">
          <h1>⏱ SLA Tracker</h1>
          <p>Monitor service level agreements in real-time</p>
        </div>
        <div className="header-stats">
          <div className="stat-chip stat-all">
            <span>Total: {counts.all}</span>
          </div>
          <div className="stat-chip stat-warning">
            <span>🟠 Warning: {counts.warning}</span>
          </div>
          <div className="stat-chip stat-breached">
            <span>🔴 Breached: {counts.breached}</span>
          </div>
        </div>
      </div>

      <div className="sla-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Services ({counts.all})
        </button>
        <button
          className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
          onClick={() => setFilter('warning')}
        >
          🟠 Warnings ({counts.warning})
        </button>
        <button
          className={`filter-btn ${filter === 'breached' ? 'active' : ''}`}
          onClick={() => setFilter('breached')}
        >
          🔴 Breached ({counts.breached})
        </button>
      </div>

      {filteredServices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h2>{filter === 'all' ? 'No Active Services' : `No ${filter} SLAs`}</h2>
          <p>All clear! No services to track at the moment.</p>
        </div>
      ) : (
        <div className="sla-list">
          {filteredServices.map(service => {
            const sla = service.sla_status;
            const progress = getProgressPercentage(sla);
            const isBreached = sla?.remaining < 0;

            return (
              <div 
                key={service.id} 
                className={`sla-card sla-${sla?.status || 'unknown'}`}
                style={{ borderLeftColor: getSLAColor(sla?.status) }}
              >
                <div className="sla-card-header">
                  <div className="sla-ticket">
                    <span className="sla-icon">{getSLAIcon(sla?.status)}</span>
                    <div>
                      <strong>{service.ticket_no}</strong>
                      <span className="sla-customer">{service.customer_name}</span>
                    </div>
                  </div>
                  <div className="sla-status-badge">
                    {sla?.status?.toUpperCase() || 'UNKNOWN'}
                  </div>
                </div>

                <div className="sla-card-body">
                  <div className="sla-progress-section">
                    <div className="sla-time-display">
                      <div className="time-label">
                        {isBreached ? '🚨 Overdue by' : '⏰ Time Remaining'}
                      </div>
                      <div 
                        className={`time-value ${isBreached ? 'breached' : ''}`}
                      >
                        {formatTime(sla?.remaining)}
                      </div>
                    </div>

                    <div className="sla-progress-bar">
                      <div 
                        className="sla-progress-fill"
                        style={{ 
                          width: `${progress}%`,
                          background: getSLAColor(sla?.status)
                        }}
                      />
                    </div>

                    <div className="sla-timestamps">
                      <span>Started: {new Date(service.created_at).toLocaleString()}</span>
                      {service.sla_time && (
                        <span>Due: {new Date(service.sla_time).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="sla-details">
                    <div className="detail-row">
                      <span className="detail-label">Issue:</span>
                      <span className="detail-value">{service.fault_description || service.description || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value status-badge-inline status-{service.status.toLowerCase()}">
                        {service.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Priority:</span>
                      <span className={`detail-value priority-${service.priority?.toLowerCase()}`}>
                        {service.priority || 'NORMAL'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">📍 {service.address || service.location || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {sla?.status === 'breached' && (
                  <div className="sla-alert">
                    🚨 <strong>SLA Breached!</strong> Admin and Reception have been notified.
                  </div>
                )}

                {sla?.status === 'warning' && (
                  <div className="sla-warning">
                    ⚠️ <strong>SLA Warning!</strong> Less than 1 hour remaining.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .sla-tracker {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .sla-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .sla-header h1 {
          margin: 0;
          color: #1f2937;
        }

        .sla-header p {
          margin: 4px 0 0 0;
          color: #6b7280;
        }

        .header-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .stat-chip {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .stat-all {
          background: #e0e7ff;
          color: #3730a3;
        }

        .stat-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .stat-breached {
          background: #fee2e2;
          color: #991b1b;
        }

        .sla-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
          flex-wrap: nowrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.3s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          min-width: fit-content;
        }

        .filter-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
        }

        .sla-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .empty-icon {
          font-size: 72px;
          margin-bottom: 16px;
        }

        .empty-state h2 {
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0;
        }

        .sla-list {
          display: grid;
          gap: 20px;
        }

        .sla-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          overflow: hidden;
          border-left: 6px solid #e5e7eb;
          transition: all 0.3s;
        }

        .sla-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .sla-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .sla-ticket {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sla-icon {
          font-size: 28px;
        }

        .sla-ticket strong {
          display: block;
          color: #1f2937;
          font-size: 16px;
        }

        .sla-customer {
          display: block;
          color: #6b7280;
          font-size: 13px;
        }

        .sla-status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          background: #e5e7eb;
          color: #1f2937;
        }

        .sla-ok .sla-status-badge {
          background: #d1fae5;
          color: #065f46;
        }

        .sla-warning .sla-status-badge {
          background: #fef3c7;
          color: #92400e;
        }

        .sla-breached .sla-status-badge {
          background: #fee2e2;
          color: #991b1b;
        }

        .sla-card-body {
          padding: 20px;
        }

        .sla-progress-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .sla-time-display {
          text-align: center;
          margin-bottom: 16px;
        }

        .time-label {
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .time-value {
          font-size: 32px;
          font-weight: 700;
          color: #10b981;
        }

        .time-value.breached {
          color: #dc2626;
        }

        .sla-progress-bar {
          height: 12px;
          background: #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .sla-progress-fill {
          height: 100%;
          transition: width 0.5s ease;
          border-radius: 6px;
        }

        .sla-timestamps {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
        }

        .sla-details {
          display: grid;
          gap: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .detail-label {
          font-weight: 600;
          color: #6b7280;
          min-width: 100px;
        }

        .detail-value {
          color: #1f2937;
          flex: 1;
          text-align: right;
        }

        .priority-critical {
          color: #dc2626;
          font-weight: 700;
        }

        .priority-urgent {
          color: #f59e0b;
          font-weight: 700;
        }

        .priority-normal {
          color: #10b981;
          font-weight: 700;
        }

        .status-badge-inline {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .sla-alert {
          padding: 16px;
          background: #fee2e2;
          border-top: 1px solid #fecaca;
          color: #991b1b;
          font-size: 13px;
        }

        .sla-warning {
          padding: 16px;
          background: #fef3c7;
          border-top: 1px solid #fde68a;
          color: #92400e;
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .sla-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .detail-value {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default SLATracker;
