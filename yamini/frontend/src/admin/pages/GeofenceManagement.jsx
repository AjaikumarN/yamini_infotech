import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin, Plus, Trash2, Edit2, Save, X, Building, Users, Clock } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import 'leaflet/dist/leaflet.css';

/**
 * Geofence Management - Admin Panel
 * Create and manage virtual boundaries for attendance zones
 */
export default function GeofenceManagement() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]); // Chennai default
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    type: 'office',
    latitude: '',
    longitude: '',
    radius: 100,
    address: '',
    is_active: true
  });

  useEffect(() => {
    fetchGeofences();
  }, []);

  const fetchGeofences = async () => {
    try {
      const data = await apiRequest('/api/tracking/geofences');
      setGeofences(data.geofences || []);
      if (data.geofences?.length > 0) {
        const first = data.geofences[0];
        setMapCenter([first.latitude, first.longitude]);
      }
    } catch (e) {
      setError('Failed to load geofences');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        radius: parseInt(form.radius)
      };
      
      await apiRequest('/api/tracking/geofences', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      await fetchGeofences();
      resetForm();
    } catch (e) {
      setError('Failed to save geofence');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      type: 'office',
      latitude: '',
      longitude: '',
      radius: 100,
      address: '',
      is_active: true
    });
    setShowForm(false);
    setEditingId(null);
    setSelectedPoint(null);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'office': return '#4F46E5';
      case 'client': return '#10b981';
      case 'warehouse': return '#f59e0b';
      case 'restricted': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'office': return '🏢';
      case 'client': return '👤';
      case 'warehouse': return '📦';
      case 'restricted': return '⛔';
      default: return '📍';
    }
  };

  // Component to handle map clicks
  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        if (showForm) {
          setSelectedPoint(e.latlng);
          setForm(prev => ({
            ...prev,
            latitude: e.latlng.lat.toFixed(6),
            longitude: e.latlng.lng.toFixed(6)
          }));
        }
      }
    });
    return null;
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading geofences...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🗺️ Geofence Management</h2>
          <p style={styles.subtitle}>Create virtual boundaries for attendance zones</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          style={styles.addBtn}
          disabled={showForm}
        >
          <Plus size={18} />
          Add Geofence
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Building size={24} color="#4F46E5" />
          <div>
            <div style={styles.statCount}>
              {geofences.filter(g => g.type === 'office').length}
            </div>
            <div style={styles.statLabel}>Office Zones</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <Users size={24} color="#10b981" />
          <div>
            <div style={styles.statCount}>
              {geofences.filter(g => g.type === 'client').length}
            </div>
            <div style={styles.statLabel}>Client Sites</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <MapPin size={24} color="#f59e0b" />
          <div>
            <div style={styles.statCount}>{geofences.length}</div>
            <div style={styles.statLabel}>Total Zones</div>
          </div>
        </div>
      </div>

      {/* Map and Form Side by Side */}
      <div style={styles.mainGrid}>
        {/* Map */}
        <div style={styles.mapContainer}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '500px', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler />
            
            {/* Existing geofences */}
            {geofences.map((geo, index) => (
              <React.Fragment key={index}>
                <Circle
                  center={[geo.latitude, geo.longitude]}
                  radius={geo.radius}
                  pathOptions={{
                    color: getTypeColor(geo.type),
                    fillColor: getTypeColor(geo.type),
                    fillOpacity: 0.2
                  }}
                />
                <Marker position={[geo.latitude, geo.longitude]}>
                  <Popup>
                    <strong>{getTypeIcon(geo.type)} {geo.name}</strong>
                    <br />
                    Radius: {geo.radius}m
                    <br />
                    {geo.address || 'No address'}
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
            
            {/* Selected point for new geofence */}
            {selectedPoint && (
              <Circle
                center={[selectedPoint.lat, selectedPoint.lng]}
                radius={parseInt(form.radius) || 100}
                pathOptions={{
                  color: getTypeColor(form.type),
                  fillColor: getTypeColor(form.type),
                  fillOpacity: 0.3,
                  dashArray: '5,5'
                }}
              />
            )}
          </MapContainer>
          {showForm && (
            <div style={styles.mapHelp}>
              👆 Click on map to set location
            </div>
          )}
        </div>

        {/* Form / List */}
        <div style={styles.sidebar}>
          {showForm ? (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formHeader}>
                <h3 style={styles.formTitle}>
                  {editingId ? 'Edit Geofence' : 'New Geofence'}
                </h3>
                <button type="button" onClick={resetForm} style={styles.closeBtn}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Head Office"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Type *</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={styles.select}
                >
                  <option value="office">🏢 Office</option>
                  <option value="client">👤 Client Site</option>
                  <option value="warehouse">📦 Warehouse</option>
                  <option value="restricted">⛔ Restricted</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Latitude</label>
                  <input
                    type="text"
                    value={form.latitude}
                    onChange={e => setForm({ ...form, latitude: e.target.value })}
                    placeholder="Click map"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Longitude</label>
                  <input
                    type="text"
                    value={form.longitude}
                    onChange={e => setForm({ ...form, longitude: e.target.value })}
                    placeholder="Click map"
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Radius (meters) *</label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  value={form.radius}
                  onChange={e => setForm({ ...form, radius: e.target.value })}
                  style={styles.slider}
                />
                <div style={styles.radiusValue}>{form.radius}m</div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main St, City"
                  style={styles.input}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={resetForm} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.saveBtn}>
                  <Save size={16} />
                  Save Geofence
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.geofenceList}>
              <h3 style={styles.listTitle}>All Geofences</h3>
              {geofences.length === 0 ? (
                <div style={styles.noData}>
                  <MapPin size={48} color="#d1d5db" />
                  <p>No geofences created yet</p>
                  <button onClick={() => setShowForm(true)} style={styles.addBtn}>
                    Create First Geofence
                  </button>
                </div>
              ) : (
                geofences.map((geo, index) => (
                  <div 
                    key={index} 
                    style={{
                      ...styles.geofenceCard,
                      borderLeftColor: getTypeColor(geo.type)
                    }}
                    onClick={() => setMapCenter([geo.latitude, geo.longitude])}
                  >
                    <div style={styles.geoIcon}>
                      {getTypeIcon(geo.type)}
                    </div>
                    <div style={styles.geoContent}>
                      <div style={styles.geoName}>{geo.name}</div>
                      <div style={styles.geoMeta}>
                        {geo.radius}m radius • {geo.type}
                      </div>
                    </div>
                    <div style={{
                      ...styles.geoStatus,
                      background: geo.is_active ? '#dcfce7' : '#f3f4f6',
                      color: geo.is_active ? '#166534' : '#6b7280'
                    }}>
                      {geo.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  statCount: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px'
  },
  mapContainer: {
    position: 'relative'
  },
  mapHelp: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    zIndex: 1000
  },
  sidebar: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  },
  form: {
    padding: '20px'
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#6b7280'
  },
  formGroup: {
    marginBottom: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white'
  },
  slider: {
    width: '100%',
    marginTop: '8px'
  },
  radiusValue: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: '4px'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  saveBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  geofenceList: {
    padding: '20px'
  },
  listTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px'
  },
  noData: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280'
  },
  geofenceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderLeft: '4px solid',
    transition: 'all 0.2s'
  },
  geoIcon: {
    fontSize: '24px'
  },
  geoContent: {
    flex: 1
  },
  geoName: {
    fontWeight: '600',
    color: '#1f2937'
  },
  geoMeta: {
    fontSize: '12px',
    color: '#6b7280'
  },
  geoStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  }
};
