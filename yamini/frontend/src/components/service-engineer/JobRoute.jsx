import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RefreshCw, Clock, Navigation, Wrench, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

/**
 * SERVICE ENGINEER JOB ROUTE - Web Version
 * 
 * Shows today's service jobs on a map with:
 * - Job locations (colored by status)
 * - Connected route polyline
 * - Job list with details
 * 
 * ALL DATA FROM BACKEND - No frontend route calculation
 */

// Create job marker with status color
const createJobMarker = (number, status) => {
  const colors = {
    'COMPLETED': '#10b981',
    'IN_PROGRESS': '#f59e0b',
    'ON_THE_WAY': '#3b82f6',
    'PENDING': '#6b7280',
    'ASSIGNED': '#8b5cf6'
  };
  const color = colors[status] || '#6366f1';
  
  return L.divIcon({
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${number}</div>`,
    className: 'job-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Map controller component
function MapController({ jobs, onMapReady }) {
  const map = useMap();
  
  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);
  
  useEffect(() => {
    const validJobs = jobs.filter(j => j.latitude && j.longitude);
    if (validJobs.length > 0) {
      const bounds = L.latLngBounds(validJobs.map(j => [j.latitude, j.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [jobs, map]);
  
  return null;
}

export default function JobRoute() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const defaultCenter = [8.7139, 77.7567];

  const fetchJobData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/service-requests/my-services`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch job data');
      }
      
      const data = await response.json();
      
      // Filter today's jobs
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const todayJobs = data.filter(job => {
        const status = job.status?.toUpperCase();
        if (status === 'COMPLETED') {
          const completedAt = job.resolved_at || job.updated_at;
          return completedAt && new Date(completedAt) >= today;
        }
        return ['ASSIGNED', 'IN_PROGRESS', 'ON_THE_WAY', 'PENDING'].includes(status);
      });
      
      setJobs(todayJobs);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Job data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobData();
    const interval = setInterval(fetchJobData, 30000);
    return () => clearInterval(interval);
  }, [fetchJobData]);

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusColor = (status) => {
    const colors = {
      'COMPLETED': '#10b981',
      'IN_PROGRESS': '#f59e0b',
      'ON_THE_WAY': '#3b82f6',
      'PENDING': '#6b7280',
      'ASSIGNED': '#8b5cf6'
    };
    return colors[status?.toUpperCase()] || '#6366f1';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'COMPLETED': 'Completed',
      'IN_PROGRESS': 'In Progress',
      'ON_THE_WAY': 'On The Way',
      'PENDING': 'Pending',
      'ASSIGNED': 'Assigned'
    };
    return labels[status?.toUpperCase()] || status;
  };

  // Calculate stats
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status?.toUpperCase() === 'COMPLETED').length,
    inProgress: jobs.filter(j => ['IN_PROGRESS', 'ON_THE_WAY'].includes(j.status?.toUpperCase())).length,
    pending: jobs.filter(j => ['PENDING', 'ASSIGNED'].includes(j.status?.toUpperCase())).length
  };

  // Build route path from jobs with coordinates
  const jobsWithCoords = jobs.filter(j => j.latitude && j.longitude);
  const routePath = jobsWithCoords.map(j => [j.latitude, j.longitude]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={styles.title}>Today's Job Route</h1>
            <p style={styles.subtitle}>Your service locations and progress</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={fetchJobData} disabled={loading} style={styles.refreshButton}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, background: '#f0f4ff', color: '#6366f1'}}>
            <Wrench size={20} />
          </div>
          <div style={styles.summaryContent}>
            <span style={styles.summaryValue}>{stats.total}</span>
            <span style={styles.summaryLabel}>Total Jobs</span>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, background: '#dcfce7', color: '#10b981'}}>
            <CheckCircle size={20} />
          </div>
          <div style={styles.summaryContent}>
            <span style={styles.summaryValue}>{stats.completed}</span>
            <span style={styles.summaryLabel}>Completed</span>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, background: '#fef3c7', color: '#f59e0b'}}>
            <Clock size={20} />
          </div>
          <div style={styles.summaryContent}>
            <span style={styles.summaryValue}>{stats.inProgress}</span>
            <span style={styles.summaryLabel}>In Progress</span>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, background: '#f3f4f6', color: '#6b7280'}}>
            <AlertCircle size={20} />
          </div>
          <div style={styles.summaryContent}>
            <span style={styles.summaryValue}>{stats.pending}</span>
            <span style={styles.summaryLabel}>Pending</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Map */}
        <div style={styles.mapContainer}>
          {error ? (
            <div style={styles.errorState}>
              <MapPin size={48} color="#9ca3af" />
              <p>Failed to load job data</p>
              <button onClick={fetchJobData} style={styles.retryButton}>Retry</button>
            </div>
          ) : jobs.length === 0 && !loading ? (
            <div style={styles.emptyState}>
              <Wrench size={48} color="#9ca3af" />
              <p style={styles.emptyTitle}>No jobs assigned for today</p>
              <p style={styles.emptySubtitle}>Check back later for new assignments</p>
            </div>
          ) : (
            <MapContainer
              center={defaultCenter}
              zoom={12}
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapController jobs={jobsWithCoords} />
              
              {/* Route polyline */}
              {routePath.length > 1 && (
                <Polyline
                  positions={routePath}
                  color="#6366f1"
                  weight={3}
                  opacity={0.6}
                  dashArray="8, 8"
                />
              )}
              
              {/* Job markers */}
              {jobsWithCoords.map((job, idx) => (
                <Marker
                  key={`job-${job.id}`}
                  position={[job.latitude, job.longitude]}
                  icon={createJobMarker(idx + 1, job.status)}
                >
                  <Popup>
                    <div style={{ padding: '8px', minWidth: '200px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                        {job.request_number || `Job #${job.id}`}
                      </div>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: `${getStatusColor(job.status)}20`,
                        color: getStatusColor(job.status),
                        fontSize: '11px',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}>
                        {getStatusLabel(job.status)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        👤 {job.customer_name || 'Unknown Customer'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        🔧 {job.product_name || 'N/A'}
                      </div>
                      {job.complaint && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          📝 {job.complaint.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Job List */}
        <div style={styles.jobList}>
          <h3 style={styles.listTitle}>Jobs Timeline</h3>
          {jobs.length === 0 ? (
            <div style={styles.emptyList}>No jobs assigned</div>
          ) : (
            <div style={styles.timeline}>
              {jobs.map((job, idx) => (
                <div key={job.id} style={styles.timelineItem}>
                  <div style={styles.timelineMarker}>
                    <div style={{
                      ...styles.markerDot,
                      background: getStatusColor(job.status)
                    }}>
                      {idx + 1}
                    </div>
                    {idx < jobs.length - 1 && <div style={styles.markerLine} />}
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineTitle}>
                        {job.request_number || `Job #${job.id}`}
                      </span>
                      <span style={{
                        ...styles.statusBadge,
                        background: `${getStatusColor(job.status)}20`,
                        color: getStatusColor(job.status)
                      }}>
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                    <div style={styles.timelineCustomer}>
                      👤 {job.customer_name || 'Unknown'}
                    </div>
                    <div style={styles.timelineMachine}>
                      🔧 {job.product_name || 'N/A'}
                    </div>
                    {job.priority && (
                      <div style={{
                        ...styles.priorityBadge,
                        color: job.priority === 'CRITICAL' ? '#ef4444' : 
                               job.priority === 'URGENT' ? '#f59e0b' : '#10b981'
                      }}>
                        ● {job.priority}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Last update footer */}
      <div style={styles.footer}>
        <span>Last sync: {lastUpdate ? formatTime(lastUpdate) : '--:--'}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#f8fafc',
    padding: '24px',
    gap: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b'
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b'
  },
  headerRight: {
    display: 'flex',
    gap: '12px'
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  summaryIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '10px'
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b'
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#64748b'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
    flex: 1,
    minHeight: 0
  },
  mapContainer: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    minHeight: '400px'
  },
  jobList: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflowY: 'auto'
  },
  listTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#9ca3af'
  },
  emptyTitle: {
    margin: '16px 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#64748b'
  },
  emptySubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#9ca3af'
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#9ca3af'
  },
  retryButton: {
    marginTop: '12px',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: '#6366f1',
    color: 'white',
    cursor: 'pointer'
  },
  emptyList: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '40px 0'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column'
  },
  timelineItem: {
    display: 'flex',
    gap: '12px'
  },
  timelineMarker: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '32px'
  },
  markerDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0
  },
  markerLine: {
    width: '2px',
    flex: 1,
    background: '#e2e8f0',
    margin: '4px 0'
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '20px'
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  timelineTitle: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1e293b'
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  timelineCustomer: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '2px'
  },
  timelineMachine: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '4px'
  },
  priorityBadge: {
    fontSize: '11px',
    fontWeight: '600'
  },
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8'
  }
};
