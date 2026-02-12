import React, { useState, useEffect, useRef } from 'react';
import { MapPin, CheckCircle, XCircle, Navigation, Loader, Wifi, WifiOff, Battery, BatteryLow, Shield } from 'lucide-react';
import deviceMonitor from '../../services/deviceMonitor';
import geofenceService from '../../services/geofenceService';
import { API_BASE_URL } from '../../config';
import './LocationSharing.css';

export default function LocationSharing() {
  const [activeVisit, setActiveVisit] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('searching'); // searching, ready, error
  const [trackingStatus, setTrackingStatus] = useState('idle'); // idle, tracking, error
  const [deviceStatus, setDeviceStatus] = useState({ batteryLevel: null, isCharging: false, isOnline: true });
  const [currentZone, setCurrentZone] = useState(null);
  const watchIdRef = useRef(null);
  const prefetchWatchRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const intervalRef = useRef(null);
  const currentLocationRef = useRef(null);

  useEffect(() => {
    checkActiveVisit();
    startGpsPreFetch();
    initializeServices();
    
    return () => {
      stopTracking();
      if (prefetchWatchRef.current) {
        navigator.geolocation.clearWatch(prefetchWatchRef.current);
      }
      deviceMonitor.cleanup();
    };
  }, []);

  // Initialize device monitoring and geofence services
  const initializeServices = async () => {
    try {
      // Initialize device monitor for battery/GPS/network status
      const status = await deviceMonitor.initialize();
      if (status) {
        setDeviceStatus({
          batteryLevel: status.batteryLevel,
          isCharging: status.isCharging,
          isOnline: status.isOnline
        });
      }

      // Subscribe to device status changes
      deviceMonitor.onStatusChange = (newStatus) => {
        setDeviceStatus(prev => ({ ...prev, ...newStatus }));
      };

      // Load geofences for zone checking
      await geofenceService.loadGeofences();
    } catch (e) {
      console.warn('Failed to initialize services:', e);
    }
  };

  // Continuously fetch GPS in background so it's ready for check-in
  const startGpsPreFetch = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      deviceMonitor.updateGPSStatus(false);
      return;
    }

    setGpsStatus('searching');
    deviceMonitor.updateGPSStatus(true, 'searching');

    // Watch position continuously
    prefetchWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        currentLocationRef.current = loc;
        setCurrentLocation(loc);
        setGpsStatus('ready');
        deviceMonitor.updateGPSStatus(true, 'ready');

        // Check which geofence zone we're in
        const zones = geofenceService.checkPosition(loc.latitude, loc.longitude);
        if (zones.length > 0) {
          setCurrentZone(zones[0]);
        } else {
          setCurrentZone(null);
        }
      },
      (err) => {
        console.warn('GPS prefetch error:', err.message);
        if (!currentLocationRef.current) {
          setGpsStatus('error');
          deviceMonitor.updateGPSStatus(false, 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTrackingStatus('idle');
  };

  // Get current position - uses pre-fetched location if available (instant!)
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      // Use pre-fetched location immediately if available
      if (currentLocationRef.current) {
        resolve(currentLocationRef.current);
        return;
      }
      
      // GPS not ready yet
      reject(new Error('GPS not ready. Please wait for GPS signal.'));
    });
  };

  const checkActiveVisit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tracking/visits/active`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'active_visit') {
        setActiveVisit(data);
        startContinuousTracking();
      }
    } catch (err) {
      console.error('Failed to check active visit:', err);
    }
  };

  // Send location update to server
  const sendLocationUpdate = async (position) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tracking/location/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy
        })
      });
      
      if (response.ok) {
        lastUpdateRef.current = Date.now();
        setCurrentLocation(position);
        setTrackingStatus('tracking');
      }
    } catch (err) {
      console.error('GPS update failed:', err);
      setTrackingStatus('error');
    }
  };

  // Start continuous GPS tracking using watchPosition
  const startContinuousTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setTrackingStatus('tracking');

    // Use watchPosition for real-time updates when moving
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const newPos = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setCurrentLocation(newPos);
        currentLocationRef.current = newPos; // Store in ref for interval callback
        setTrackingStatus('tracking');
        
        // Send update immediately on significant movement or every 10 seconds
        const timeSinceLastUpdate = Date.now() - (lastUpdateRef.current || 0);
        if (timeSinceLastUpdate >= 10000) { // At least 10 seconds between updates
          await sendLocationUpdate(newPos);
        }
      },
      (error) => {
        console.error('Watch position error:', error);
        // Don't set error status immediately, let interval handle it
      },
      {
        enableHighAccuracy: true,
        timeout: 60000, // 60 seconds timeout for watch
        maximumAge: 10000 // Accept position up to 10 seconds old
      }
    );

    // Also set up interval-based updates as backup (every 15 seconds)
    intervalRef.current = setInterval(async () => {
      try {
        // Use cached position if available to avoid timeout
        const position = await getCurrentPosition();
        currentLocationRef.current = position;
        await sendLocationUpdate(position);
      } catch (err) {
        console.warn('Interval GPS update failed, using last known location:', err.message);
        if (currentLocationRef.current) {
          await sendLocationUpdate(currentLocationRef.current);
        }
      }
    }, 15000);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    // Check if GPS is ready BEFORE setting loading state
    if (!currentLocationRef.current) {
      setError('GPS not ready yet. Please wait for green GPS indicator.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use the already-fetched location (instant!)
      const position = currentLocationRef.current;
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/tracking/visits/check-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customername: customerName,
          notes: notes,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy
        })
      });
      
      if (!response.ok) {
        throw new Error('Check-in failed');
      }
      
      const data = await response.json();
      
      setActiveVisit({
        visit_id: data.visit_id,
        customername: customerName,
        notes: notes,
        latitude: position.latitude,
        longitude: position.longitude
      });
      
      setCustomerName('');
      setNotes('');
      setCurrentLocation(position);
      
      // Start continuous GPS tracking
      startContinuousTracking();
      
    } catch (err) {
      setError(err.message || 'Failed to check in. Please enable GPS and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeVisit) return;
    
    setLoading(true);
    setError('');
    
    try {
      const position = await getCurrentPosition();
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/tracking/visits/check-out`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visit_id: activeVisit.visit_id,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy
        })
      });
      
      if (!response.ok) {
        throw new Error('Check-out failed');
      }
      
      // Stop GPS tracking
      stopTracking();
      
      setActiveVisit(null);
      setCurrentLocation(null);
      
    } catch (err) {
      setError(err.message || 'Failed to check out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-sharing-container">
      <div className="location-sharing-header">
        <h2>
          <MapPin size={24} />
          Live Location Tracking
        </h2>
        <p>Automatic GPS tracking during customer visits</p>
      </div>

      {error && (
        <div className="error-message">
          <XCircle size={20} />
          {error}
        </div>
      )}

      {!activeVisit ? (
        <div className="check-in-form">
          <h3>Start Customer Visit</h3>
          
          {/* Device Status Bar */}
          <div className="device-status-bar">
            <div className={`status-item ${deviceStatus.isOnline ? 'online' : 'offline'}`}>
              {deviceStatus.isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{deviceStatus.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            {deviceStatus.batteryLevel !== null && (
              <div className={`status-item ${deviceStatus.batteryLevel < 20 ? 'low' : 'normal'}`}>
                {deviceStatus.batteryLevel < 20 ? <BatteryLow size={14} /> : <Battery size={14} />}
                <span>{deviceStatus.batteryLevel}%{deviceStatus.isCharging ? ' ⚡' : ''}</span>
              </div>
            )}
            {currentZone && (
              <div className="status-item zone">
                <Shield size={14} />
                <span>{currentZone.name}</span>
              </div>
            )}
          </div>
          
          {/* GPS Status Indicator */}
          <div className={`gps-status-bar ${gpsStatus}`}>
            {gpsStatus === 'searching' && (
              <>
                <Loader size={16} className="spinning" />
                <span>Searching for GPS signal...</span>
              </>
            )}
            {gpsStatus === 'ready' && (
              <>
                <Wifi size={16} />
                <span>GPS Ready • Accuracy: {Math.round(currentLocation?.accuracy || 0)}m</span>
              </>
            )}
            {gpsStatus === 'error' && (
              <>
                <WifiOff size={16} />
                <span>GPS unavailable - Please enable location</span>
              </>
            )}
          </div>

          <form onSubmit={handleCheckIn}>
            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add visit notes..."
                rows="3"
              />
            </div>

            <button 
              type="submit" 
              className={`btn-primary btn-check-in ${gpsStatus !== 'ready' ? 'disabled' : ''}`}
              disabled={loading || gpsStatus !== 'ready'}
            >
              {loading ? (
                <span>Checking in...</span>
              ) : gpsStatus !== 'ready' ? (
                <>
                  <Loader size={20} className="spinning" />
                  Waiting for GPS...
                </>
              ) : (
                <>
                  <Navigation size={20} />
                  Check In - Start Tracking
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="active-visit">
          <div className="visit-info">
            <div className={`tracking-badge ${trackingStatus}`}>
              <span className="tracking-pulse"></span>
              {trackingStatus === 'tracking' ? 'GPS Tracking Active (10s updates)' : 
               trackingStatus === 'error' ? 'GPS Error - Retrying...' : 
               'Initializing GPS...'}
            </div>
            
            <h3>Current Visit</h3>
            <div className="visit-details">
              <div className="detail-row">
                <strong>Customer:</strong>
                <span>{activeVisit.customername}</span>
              </div>
              {activeVisit.notes && (
                <div className="detail-row">
                  <strong>Notes:</strong>
                  <span>{activeVisit.notes}</span>
                </div>
              )}
              {currentLocation && (
                <div className="detail-row location-coords">
                  <strong>Location:</strong>
                  <span>
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    <small style={{display: 'block', color: '#6b7280', fontSize: '11px'}}>
                      Accuracy: ±{currentLocation.accuracy?.toFixed(0) || '?'}m
                    </small>
                  </span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleCheckOut}
            className="btn-danger btn-check-out"
            disabled={loading}
          >
            {loading ? (
              <span>Checking out...</span>
            ) : (
              <>
                <CheckCircle size={20} />
                Check Out - Stop Tracking
              </>
            )}
          </button>
        </div>
      )}

      <div className="info-box">
        <h4>📍 How It Works</h4>
        <ul>
          <li>✅ Check in when you arrive at customer location</li>
          <li>📡 GPS automatically updates every 30 seconds</li>
          <li>✅ Check out when visit is complete</li>
          <li>📧 Daily route reports sent to admin at 6:30 PM</li>
        </ul>
      </div>
    </div>
  );
}
