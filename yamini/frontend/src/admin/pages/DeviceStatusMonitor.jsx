import React, { useState, useEffect } from 'react';
import { Battery, BatteryLow, Wifi, WifiOff, MapPin, MapPinOff, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { apiRequest } from '../../utils/api';

/**
 * Device Status Monitor - Admin Panel
 * Shows battery, GPS, and connectivity alerts for all field staff
 */
export default function DeviceStatusMonitor() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await apiRequest('/api/tracking/device-status/alerts');
      setAlerts(data.alerts || []);
      setError('');
    } catch (e) {
      setError('Failed to load device alerts');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'battery_low':
      case 'battery_warning':
        return <BatteryLow size={20} color="#ef4444" />;
      case 'gps_disabled':
        return <MapPinOff size={20} color="#f59e0b" />;
      case 'offline':
        return <WifiOff size={20} color="#ef4444" />;
      default:
        return <AlertTriangle size={20} color="#6b7280" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'battery_low':
      case 'offline':
        return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
      case 'battery_warning':
      case 'gps_disabled':
        return { bg: '#fffbeb', border: '#fde68a', text: '#92400e' };
      default:
        return { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>📱 Device Status Monitor</h2>
        </div>
        <div style={styles.loading}>Loading alerts...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📱 Device Status Monitor</h2>
          <p style={styles.subtitle}>Battery, GPS & Connectivity Alerts</p>
        </div>
        <button onClick={fetchAlerts} style={styles.refreshBtn}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <BatteryLow size={24} color="#ef4444" />
          <div>
            <div style={styles.summaryCount}>
              {alerts.filter(a => a.alert_type?.includes('battery')).length}
            </div>
            <div style={styles.summaryLabel}>Battery Alerts</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <MapPinOff size={24} color="#f59e0b" />
          <div>
            <div style={styles.summaryCount}>
              {alerts.filter(a => a.alert_type === 'gps_disabled').length}
            </div>
            <div style={styles.summaryLabel}>GPS Issues</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <WifiOff size={24} color="#ef4444" />
          <div>
            <div style={styles.summaryCount}>
              {alerts.filter(a => a.alert_type === 'offline').length}
            </div>
            <div style={styles.summaryLabel}>Offline</div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div style={styles.alertsList}>
        {alerts.length === 0 ? (
          <div style={styles.noAlerts}>
            <span style={{ fontSize: '48px' }}>✅</span>
            <h3>All devices healthy</h3>
            <p>No alerts at this time</p>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const colors = getAlertColor(alert.alert_type);
            return (
              <div 
                key={index} 
                style={{
                  ...styles.alertCard,
                  background: colors.bg,
                  borderColor: colors.border
                }}
              >
                <div style={styles.alertIcon}>
                  {getAlertIcon(alert.alert_type)}
                </div>
                <div style={styles.alertContent}>
                  <div style={styles.alertHeader}>
                    <span style={{ ...styles.alertName, color: colors.text }}>
                      {alert.full_name || alert.username}
                    </span>
                    <span style={styles.alertType}>
                      {alert.alert_type?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.alertMessage}>{alert.message}</div>
                  <div style={styles.alertMeta}>
                    <Clock size={14} />
                    {formatTime(alert.logged_at)}
                    {alert.battery_level && (
                      <span style={styles.batteryLevel}>
                        🔋 {alert.battery_level}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  error: {
    background: '#fef2f2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  summaryCount: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937'
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  noAlerts: {
    textAlign: 'center',
    padding: '60px',
    background: '#f0fdf4',
    borderRadius: '12px',
    color: '#166534'
  },
  alertCard: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid'
  },
  alertIcon: {
    padding: '8px',
    background: 'white',
    borderRadius: '8px'
  },
  alertContent: {
    flex: 1
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  alertName: {
    fontWeight: '600',
    fontSize: '15px'
  },
  alertType: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 8px',
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '4px'
  },
  alertMessage: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '8px'
  },
  alertMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#9ca3af'
  },
  batteryLevel: {
    marginLeft: '12px',
    fontWeight: '600'
  }
};
