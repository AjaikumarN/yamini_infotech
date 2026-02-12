import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RefreshCw, Clock, Navigation, Route, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

/**
 * SALESMAN VISIT OVERVIEW - Web Version
 * 
 * Shows today's visits on a map with:
 * - Start point (attendance location)
 * - Visit points (numbered 1, 2, 3...)
 * - Connected route polyline
 * - Visit list with details
 * 
 * ALL DATA FROM BACKEND - No frontend route calculation
 */

// Create numbered visit marker
const createVisitMarker = (number, color = '#6366f1') => {
  return L.divIcon({
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${number}</div>`,
    className: 'visit-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

// Start marker
const createStartMarker = () => {
  return L.divIcon({
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#10b981;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">S</div>`,
    className: 'start-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Map controller component
function MapController({ visits, onMapReady }) {
  const map = useMap();
  
  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);
  
  useEffect(() => {
    if (visits.length > 0) {
      const bounds = L.latLngBounds(visits.map(v => [v.lat, v.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [visits, map]);
  
  return null;
}

export default function VisitOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const defaultCenter = [8.7139, 77.7567];

  const fetchRouteData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/tracking/visits/history`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch visit history');
      }
      
      const data = await response.json();
      setRouteData(data);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Visit history fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRouteData();
    const interval = setInterval(fetchRouteData, 30000);
    return () => clearInterval(interval);
  }, [fetchRouteData]);

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const visits = routeData?.visits || [];
  const summary = routeData?.summary || {};
  const validVisits = visits.filter(v => v.lat && v.lng);
  const routePath = validVisits.map(v => [v.lat, v.lng]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={styles.title}>Today's Visit Overview</h1>
            <p style={styles.subtitle}>Your route and customer visits</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={fetchRouteData} disabled={loading} style={styles.refreshButton}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}><Route size={20} /></div>
          <div style={styles.summaryContent}>
            <span style={styles.summaryValue}>{summary.total_visits || visits.length}</span>
            <span style={styles.summaryLabel}>Total Visits</span>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}><Navigation size={20} /></div>
          <div style={styles.summaryContent}>
            <span style={styles.summaryValue}>{summary.total_distance_km || '0'} km</span>
            <span style={styles.summaryLabel}>Distance</span>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}><Clock size={20} /></div>
          <div style={styles.summaryContent}>
            <span style={styles.summaryValue}>{summary.start_time || 'N/A'}</span>
            <span style={styles.summaryLabel}>Started</span>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}><Clock size={20} /></div>
          <div style={styles.summaryContent}>
            <span style={styles.summaryValue}>{summary.end_time || 'Active'}</span>
            <span style={styles.summaryLabel}>Last Update</span>
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
              <p>Failed to load visit data</p>
              <button onClick={fetchRouteData} style={styles.retryButton}>Retry</button>
            </div>
          ) : visits.length === 0 && !loading ? (
            <div style={styles.emptyState}>
              <MapPin size={48} color="#9ca3af" />
              <p style={styles.emptyTitle}>No visits recorded today</p>
              <p style={styles.emptySubtitle}>Start visiting customers to see your route here</p>
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
              
              <MapController visits={validVisits} />
              
              {/* Route polyline */}
              {routePath.length > 1 && (
                <Polyline
                  positions={routePath}
                  color="#6366f1"
                  weight={4}
                  opacity={0.8}
                />
              )}
              
              {/* Visit markers */}
              {visits.filter(v => v.lat && v.lng).map((visit, idx) => (
                <Marker
                  key={`visit-${idx}`}
                  position={[visit.lat, visit.lng]}
                  icon={idx === 0 ? createStartMarker() : createVisitMarker(visit.sequence || idx + 1)}
                >
                  <Popup>
                    <div style={{ padding: '8px', minWidth: '180px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                        {idx === 0 ? 'Start Point' : `Visit #${visit.sequence || idx}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        📍 {visit.address || `${visit.lat?.toFixed(5) || 0}, ${visit.lng?.toFixed(5) || 0}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        ⏱️ {visit.time || formatTime(visit.visited_at)}
                      </div>
                      {visit.customer_name && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          👤 {visit.customer_name}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Visit List */}
        <div style={styles.visitList}>
          <h3 style={styles.listTitle}>Visit Timeline</h3>
          {visits.length === 0 ? (
            <div style={styles.emptyList}>No visits yet</div>
          ) : (
            <div style={styles.timeline}>
              {visits.map((visit, idx) => (
                <div key={idx} style={styles.timelineItem}>
                  <div style={styles.timelineMarker}>
                    <div style={{
                      ...styles.markerDot,
                      background: idx === 0 ? '#10b981' : '#6366f1'
                    }}>
                      {idx === 0 ? 'S' : visit.sequence || idx + 1}
                    </div>
                    {idx < visits.length - 1 && <div style={styles.markerLine} />}
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineTitle}>
                        {idx === 0 ? 'Day Started' : (visit.customer_name || `Visit ${idx}`)}
                      </span>
                      <span style={styles.timelineTime}>{visit.time || formatTime(visit.visited_at)}</span>
                    </div>
                    <div style={styles.timelineAddress}>
                      {visit.address || (visit.lat && visit.lng ? `${visit.lat.toFixed(4)}, ${visit.lng.toFixed(4)}` : 'Location unavailable')}
                    </div>
                    {visit.distance_km > 0 && (
                      <div style={styles.timelineDistance}>
                        📏 {visit.distance_km} km from previous
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
    borderRadius: '10px',
    background: '#f0f4ff',
    color: '#6366f1'
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
  visitList: {
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
    width: '28px'
  },
  markerDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
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
    marginBottom: '4px'
  },
  timelineTitle: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1e293b'
  },
  timelineTime: {
    fontSize: '12px',
    color: '#64748b'
  },
  timelineAddress: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '4px'
  },
  timelineDistance: {
    fontSize: '12px',
    color: '#10b981'
  },
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8'
  }
};
