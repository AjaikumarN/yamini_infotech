import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, RefreshCw, Users, Clock, AlertCircle, Navigation, Phone, Mail, X, ChevronRight, Activity, Search, Filter, Route, Eye, Calendar, MapPinned } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveMap.css';
import { API_BASE_URL } from '../../config';

/**
 * ENTERPRISE LIVE TRACKING MAP
 * ============================
 * 
 * CORE RULES:
 * 1. Routes are based on SALESMAN VISIT HISTORY - NOT admin location
 * 2. Admin is a VIEWER only - never affects routing logic
 * 3. No route drawn by default - only on salesman click
 * 4. Route = ordered visit points from backend API
 * 
 * DATA FLOW:
 * - Live Location API: Shows current markers (where salesmen ARE)
 * - Route API: Shows visit history (where salesmen WENT) - called on click only
 */

// Create custom marker with profile photo
const createPhotoMarker = (photoUrl, name, isSelected = false, hasRoute = false) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'S';
  const bgColor = isSelected ? '#667eea' : (hasRoute ? '#10B981' : '#4F46E5');
  const size = isSelected ? 50 : 44;
  const borderWidth = isSelected ? 4 : 3;
  
  const html = photoUrl 
    ? `<div class="photo-marker ${isSelected ? 'selected' : ''}" style="width:${size}px;height:${size}px;border:${borderWidth}px solid ${bgColor};border-radius:50%;overflow:hidden;background:${bgColor};box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"/>
        <span style="position:absolute;color:white;font-weight:bold;font-size:16px;">${initials}</span>
       </div>
       <div class="marker-pulse"></div>`
    : `<div class="photo-marker ${isSelected ? 'selected' : ''}" style="width:${size}px;height:${size}px;border:${borderWidth}px solid ${bgColor};border-radius:50%;background:${bgColor};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
        ${initials}
       </div>
       <div class="marker-pulse"></div>`;
  
  return L.divIcon({
    html,
    className: 'custom-photo-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2 - 5]
  });
};

// Visit point marker (numbered)
const createVisitMarker = (number, color) => {
  return L.divIcon({
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${number}</div>`,
    className: 'visit-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

// Map controller component
function MapController({ locations, selectedSalesman, onMapReady }) {
  const map = useMap();
  
  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);
  
  useEffect(() => {
    if (selectedSalesman) {
      map.flyTo([selectedSalesman.latitude, selectedSalesman.longitude], 15, { duration: 0.5 });
    } else if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
    }
  }, [locations, selectedSalesman, map]);
  
  return null;
}

export default function LiveMap() {
  // State
  const [locations, setLocations] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null); // Route data from API
  const [routeLoading, setRouteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState('street');
  
  const mapRef = useRef(null);
  const defaultCenter = [8.7139, 77.7567]; // Tirunelveli default

  // Filter locations based on search
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Fetch live locations (markers only)
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Use existing tracking API that works with live_locations table
      const response = await fetch(`${API_BASE_URL}/api/tracking/live/locations`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const data = await response.json();
      console.log('📍 Live locations response:', data);
      setLocations(data.locations || []);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Live locations fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch route for specific salesman (ONLY on click)
  const fetchSalesmanRoute = useCallback(async (salesmanId) => {
    try {
      setRouteLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/salesmen/${salesmanId}/route`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log('Route API not available, showing marker only');
        setSelectedRoute(null);
        return;
      }
      
      const data = await response.json();
      setSelectedRoute(data);
      
    } catch (err) {
      console.error('Route fetch error:', err);
      setSelectedRoute(null);
    } finally {
      setRouteLoading(false);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [fetchLocations]);

  // Handle salesman click - fetch route
  const handleSalesmanClick = async (location) => {
    if (selectedSalesman?.user_id === location.user_id) {
      // Deselect
      setSelectedSalesman(null);
      setSelectedRoute(null);
    } else {
      // Select and fetch route
      setSelectedSalesman(location);
      await fetchSalesmanRoute(location.user_id);
    }
  };

  // Helper functions
  const formatTime = (input) => {
    if (!input) return 'N/A';
    // Handle Date objects directly
    if (input instanceof Date) {
      return input.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    }
    if (typeof input !== 'string') return 'N/A';
    // Ensure UTC timestamps from backend are parsed correctly
    const utcDate = input.endsWith('Z') || input.includes('+') ? input : input + 'Z';
    return new Date(utcDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  };

  const getTimeSinceUpdate = (input) => {
    if (!input) return 'Unknown';
    let dateObj;
    if (input instanceof Date) {
      dateObj = input;
    } else if (typeof input === 'string') {
      const utcDate = input.endsWith('Z') || input.includes('+') ? input : input + 'Z';
      dateObj = new Date(utcDate);
    } else {
      return 'Unknown';
    }
    const diffMins = Math.floor((new Date() - dateObj) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`;
  };

  const getPhotoUrl = (photo) => {
    if (!photo || typeof photo !== 'string') return null;
    if (photo.startsWith('data:') || photo.startsWith('http')) return photo;
    return `${API_BASE_URL}/uploads/employees/${photo}`;
  };

  const routeColor = '#4F46E5'; // Primary route color

  return (
    <div className="lystloc-container">
      {/* Left Sidebar - Salesman List */}
      <div className={`salesman-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Premium Header */}
        <div className="sidebar-header">
          <div className="header-content">
            <div className="header-icon">
              <Users size={22} />
            </div>
            <div className="header-text">
              <h2>Field Team</h2>
              <p>Real-time tracking</p>
            </div>
          </div>
          <div className="header-badge">
            <span className="badge-count">{locations.length}</span>
            <span className="badge-label">Active</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sidebar-search">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="sidebar-quick-stats">
          <div className="quick-stat">
            <MapPin size={14} className="stat-icon online" />
            <span className="stat-number">{locations.length}</span>
            <span className="stat-text">Online</span>
          </div>
          <div className="quick-stat">
            <Route size={14} className="stat-icon routes" />
            <span className="stat-number">{selectedRoute?.summary?.total_visits || 0}</span>
            <span className="stat-text">Visits</span>
          </div>
          <div className="quick-stat">
            <Eye size={14} className="stat-icon tracking" />
            <span className="stat-number">{selectedSalesman ? 1 : 0}</span>
            <span className="stat-text">Viewing</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="info-banner">
          <MapPinned size={14} />
          <span>Click a salesman to view their route</span>
        </div>
        
        {/* Team Member List */}
        <div className="salesman-list">
          {filteredLocations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Navigation size={32} />
              </div>
              <h3>No Active Team Members</h3>
              <p>Team members will appear here when they check-in and start sharing their location.</p>
              <button onClick={fetchLocations} className="empty-refresh-btn">
                <RefreshCw size={14} />
                Refresh Now
              </button>
            </div>
          ) : (
            <>
              <div className="list-header">
                <span className="list-title">Team Members</span>
                <span className="list-count">{filteredLocations.length} found</span>
              </div>
              {filteredLocations.map((loc, idx) => (
                <div 
                  key={loc.user_id} 
                  className={`salesman-card ${selectedSalesman?.user_id === loc.user_id ? 'selected' : ''}`}
                  onClick={() => handleSalesmanClick(loc)}
                >
                  <div className="card-avatar" style={{'--accent-color': routeColor}}>
                    {loc.photo_url ? (
                      <img src={getPhotoUrl(loc.photo_url)} alt={loc.full_name} onError={(e) => e.target.style.display = 'none'} />
                    ) : null}
                    <span className="avatar-initials">{loc.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'S'}</span>
                    <span className="status-dot"></span>
                  </div>
                  <div className="card-content">
                    <div className="card-main">
                      <h4 className="card-name">{loc.full_name || `Team Member #${loc.user_id}`}</h4>
                      <div className="card-meta">
                        <span className="meta-item live">
                          <span className="live-pulse"></span>
                          Live
                        </span>
                        <span className="meta-divider">•</span>
                        <span className="meta-item time">
                          <Clock size={11} />
                          {getTimeSinceUpdate(loc.updated_at)}
                        </span>
                      </div>
                    </div>
                    <div className="card-accuracy">
                      <span className="accuracy-value">{loc.accuracy_m?.toFixed(0) || loc.accuracy?.toFixed(0) || '?'}m</span>
                      <span className="accuracy-label">accuracy</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="card-chevron" />
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="sidebar-footer">
          <div className="footer-left">
            <button onClick={fetchLocations} disabled={loading} className="refresh-btn">
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
              {loading ? 'Updating...' : 'Refresh'}
            </button>
          </div>
          <div className="footer-right">
            <span className="last-update-label">Last sync</span>
            <span className="last-update-time">{lastUpdate ? formatTime(lastUpdate) : '--:--'}</span>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {/* Main Map Area */}
      <div className="map-main">
        {/* Top Stats Bar */}
        <div className="top-stats-bar">
          <div className="stat-pill">
            <Users size={16} />
            <span>{locations.length} Active</span>
          </div>
          <div className="stat-pill">
            <Clock size={16} />
            <span>15s refresh</span>
          </div>
          <div 
            className="stat-pill" 
            onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
            style={{ cursor: 'pointer', background: mapStyle === 'satellite' ? '#667eea' : undefined, color: mapStyle === 'satellite' ? 'white' : undefined }}
          >
            <MapPinned size={16} />
            <span>{mapStyle === 'satellite' ? '🛰️ Satellite' : '🗺️ Street'}</span>
          </div>
          <div className="stat-pill live">
            <span className="live-dot"></span>
            <span>LIVE</span>
          </div>
        </div>

        {error && (
          <div className="map-error">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={fetchLocations}>Retry</button>
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={12}
          className="leaflet-map"
          ref={mapRef}
          zoomControl={false}
        >
          {mapStyle === 'satellite' ? (
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          )}
          
          <MapController 
            locations={locations} 
            selectedSalesman={selectedSalesman}
            onMapReady={(map) => mapRef.current = map}
          />
          
          {/* Route polyline - ONLY shown when salesman is selected */}
          {selectedRoute && selectedRoute.route_path && selectedRoute.route_path.length > 1 && (
            <Polyline
              positions={selectedRoute.route_path}
              color={routeColor}
              weight={4}
              opacity={0.8}
            />
          )}
          
          {/* Visit point markers - ONLY shown when salesman is selected */}
          {selectedRoute && selectedRoute.visits && selectedRoute.visits.map((visit, idx) => (
            <Marker
              key={`visit-${idx}`}
              position={[visit.lat, visit.lng]}
              icon={createVisitMarker(visit.sequence, routeColor)}
            >
              <Popup>
                <div style={{padding: '8px', minWidth: '180px'}}>
                  <div style={{fontWeight: 'bold', marginBottom: '8px', fontSize: '14px'}}>
                    Visit #{visit.sequence}
                  </div>
                  <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>
                    📍 {visit.address || `${visit.lat.toFixed(5)}, ${visit.lng.toFixed(5)}`}
                  </div>
                  <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>
                    ⏱️ {visit.time || 'N/A'}
                  </div>
                  {visit.distance_km > 0 && (
                    <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>
                      📏 {visit.distance_km} km from previous
                    </div>
                  )}
                  {visit.customer_name && (
                    <div style={{fontSize: '12px', color: '#666'}}>
                      👤 {visit.customer_name}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Salesman markers (current live position) */}
          {locations.map((loc, idx) => (
            <Marker
              key={`marker-${loc.user_id}`}
              position={[loc.latitude, loc.longitude]}
              icon={createPhotoMarker(
                getPhotoUrl(loc.photo_url),
                loc.full_name,
                selectedSalesman?.user_id === loc.user_id,
                selectedRoute && selectedSalesman?.user_id === loc.user_id
              )}
              eventHandlers={{
                click: () => handleSalesmanClick(loc)
              }}
            >
              <Popup className="custom-popup">
                <div className="popup-content">
                  <div className="popup-header">
                    <div className="popup-avatar" style={{borderColor: routeColor}}>
                      {loc.photo_url ? (
                        <img src={getPhotoUrl(loc.photo_url)} alt="" />
                      ) : (
                        <span>{loc.full_name?.charAt(0) || 'S'}</span>
                      )}
                    </div>
                    <div className="popup-info">
                      <h3>{loc.full_name || 'Salesman'}</h3>
                      <span className="status-badge">🟢 Tracking</span>
                    </div>
                  </div>
                  <div className="popup-details">
                    <div className="detail"><Clock size={14} /> {getTimeSinceUpdate(loc.updated_at)}</div>
                    <div className="detail"><MapPin size={14} /> {loc.accuracy_m?.toFixed(0) || loc.accuracy?.toFixed(0) || '?'}m accuracy</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Selected Salesman Detail Panel — full-height right panel */}
        {selectedSalesman && (
          <div className="detail-panel">
            <button className="close-panel" onClick={() => { setSelectedSalesman(null); setSelectedRoute(null); }}>
              <X size={16} />
            </button>
            <div className="panel-header">
              <div className="panel-avatar">
                {selectedSalesman.photo_url ? (
                  <img src={getPhotoUrl(selectedSalesman.photo_url)} alt="" />
                ) : (
                  <span>{selectedSalesman.full_name?.charAt(0) || 'S'}</span>
                )}
                <span className="live-badge">LIVE</span>
              </div>
              <div className="panel-info">
                <h2>{selectedSalesman.full_name || 'Salesman'}</h2>
                <p className="panel-status">
                  <span className="pulse-dot"></span>
                  Currently tracking
                </p>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="panel-body" style={{flex: 1, overflowY: 'auto'}}>
              {/* Route Summary */}
              {routeLoading ? (
                <div className="panel-loading">
                  <RefreshCw size={18} className="spinning" />
                  <span>Loading route...</span>
                </div>
              ) : selectedRoute ? (
                <>
                  <div className="panel-section-title">
                    <Route size={14} />
                    Today's Route Summary
                  </div>
                  <div className="panel-stats">
                    <div className="panel-stat">
                      <span className="stat-label">Start Time</span>
                      <span className="stat-value">{selectedRoute.summary?.start_time || 'N/A'}</span>
                    </div>
                    <div className="panel-stat">
                      <span className="stat-label">End Time</span>
                      <span className="stat-value">{selectedRoute.summary?.end_time || 'N/A'}</span>
                    </div>
                    <div className="panel-stat highlight">
                      <span className="stat-label">Total Distance</span>
                      <span className="stat-value">{selectedRoute.summary?.total_distance_km || 0} km</span>
                    </div>
                    <div className="panel-stat">
                      <span className="stat-label">Total Visits</span>
                      <span className="stat-value">{selectedRoute.summary?.total_visits || 0}</span>
                    </div>
                  </div>

                  {/* Visit List */}
                  {selectedRoute.visits && selectedRoute.visits.length > 0 && (
                    <div className="panel-visits">
                      <div className="panel-section-title">
                        <MapPinned size={14} />
                        Visit History
                      </div>
                      <div className="visits-list">
                        {selectedRoute.visits.map((visit, idx) => (
                          <div key={idx} className="visit-item">
                            <div className="visit-number" style={{background: routeColor}}>{visit.sequence}</div>
                            <div className="visit-details">
                              <div className="visit-address">{visit.address || `Location ${visit.sequence}`}</div>
                              <div className="visit-meta">
                                <span>{visit.time}</span>
                                {visit.distance_km > 0 && <span>{visit.distance_km} km</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="panel-no-route">
                  <MapPin size={22} />
                  <p>No visits recorded today</p>
                  <span>Visits will appear here when salesman marks locations</span>
                </div>
              )}

              {/* Current Location */}
              <div className="panel-section-title">
                <Navigation size={14} />
                Current Location
              </div>
              <div className="panel-location-address">
                {selectedSalesman.latitude?.toFixed(6)}, &nbsp;{selectedSalesman.longitude?.toFixed(6)}
              </div>
              <div className="panel-stats">
                <div className="panel-stat">
                  <span className="stat-label">Last Update</span>
                  <span className="stat-value">{getTimeSinceUpdate(selectedSalesman.updated_at)}</span>
                </div>
                <div className="panel-stat">
                  <span className="stat-label">GPS Accuracy</span>
                  <span className="stat-value">{selectedSalesman.accuracy_m?.toFixed(0) || selectedSalesman.accuracy?.toFixed(0) || '?'}m</span>
                </div>
              </div>
            </div>

            <div className="panel-actions">
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSalesman.latitude},${selectedSalesman.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn primary"
              >
                <Navigation size={15} />
                Get Directions
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
