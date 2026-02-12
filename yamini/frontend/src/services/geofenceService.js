/**
 * Geofencing Service
 * Manages virtual boundaries for location-based features
 */
import { API_BASE_URL } from '../config';

class GeofenceService {
  constructor() {
    this.geofences = [];
    this.currentPosition = null;
    this.listeners = [];
    this.insideZones = new Set();
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Load geofences from server
   */
  async loadGeofences() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token, using default geofence');
        this.useDefaultGeofence();
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/tracking/geofences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.geofences = data.geofences || [];
      } else if (response.status === 401 || response.status === 404) {
        console.warn('Geofences API unavailable, using default');
        this.useDefaultGeofence();
      }
    } catch (e) {
      console.warn('Failed to load geofences:', e);
      this.useDefaultGeofence();
    }
  }

  useDefaultGeofence() {
    // Use default office geofence
    this.geofences = [
      {
        id: 'office',
        name: 'Office',
        type: 'office',
        latitude: 13.0827, // Default Chennai location
        longitude: 80.2707,
        radius: 100, // 100 meters
        allow_attendance: true
      }
    ];
  }

  /**
   * Add a geofence
   */
  addGeofence(geofence) {
    this.geofences.push({
      id: geofence.id || Date.now().toString(),
      name: geofence.name,
      type: geofence.type || 'custom', // office, client, restricted
      latitude: geofence.latitude,
      longitude: geofence.longitude,
      radius: geofence.radius || 100, // Default 100 meters
      allow_attendance: geofence.allow_attendance || false
    });
  }

  /**
   * Check if position is inside a geofence
   */
  isInsideGeofence(lat, lon, geofence) {
    const distance = this.calculateDistance(lat, lon, geofence.latitude, geofence.longitude);
    return distance <= geofence.radius;
  }

  /**
   * Check position against all geofences
   */
  checkPosition(latitude, longitude) {
    const previousInsideZones = new Set(this.insideZones);
    this.insideZones.clear();
    
    const results = {
      inside: [],
      entered: [],
      exited: [],
      canMarkAttendance: false,
      nearestOffice: null,
      distanceToNearestOffice: null
    };

    let nearestOfficeDistance = Infinity;

    for (const geofence of this.geofences) {
      const distance = this.calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
      const isInside = distance <= geofence.radius;

      if (isInside) {
        this.insideZones.add(geofence.id);
        results.inside.push({ ...geofence, distance });

        if (geofence.allow_attendance) {
          results.canMarkAttendance = true;
        }

        if (!previousInsideZones.has(geofence.id)) {
          results.entered.push(geofence);
          this.notifyZoneEnter(geofence);
        }
      } else {
        if (previousInsideZones.has(geofence.id)) {
          results.exited.push(geofence);
          this.notifyZoneExit(geofence);
        }
      }

      // Track nearest office
      if (geofence.type === 'office' && distance < nearestOfficeDistance) {
        nearestOfficeDistance = distance;
        results.nearestOffice = geofence;
        results.distanceToNearestOffice = Math.round(distance);
      }
    }

    this.currentPosition = { latitude, longitude };
    this.notifyListeners(results);
    
    return results;
  }

  /**
   * Check if user can mark attendance at current location
   */
  canMarkAttendanceHere(latitude, longitude) {
    for (const geofence of this.geofences) {
      if (geofence.allow_attendance) {
        const distance = this.calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
        if (distance <= geofence.radius) {
          return {
            allowed: true,
            zone: geofence,
            distance: Math.round(distance)
          };
        }
      }
    }

    // Find nearest allowed zone
    let nearest = null;
    let nearestDistance = Infinity;
    
    for (const geofence of this.geofences) {
      if (geofence.allow_attendance) {
        const distance = this.calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = geofence;
        }
      }
    }

    return {
      allowed: false,
      nearestZone: nearest,
      distanceToNearest: Math.round(nearestDistance),
      message: nearest 
        ? `You are ${Math.round(nearestDistance)}m away from ${nearest.name}. Move closer to mark attendance.`
        : 'No attendance zones configured.'
    };
  }

  /**
   * Subscribe to geofence events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners(results) {
    this.listeners.forEach(cb => cb(results));
  }

  async notifyZoneEnter(geofence) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/tracking/geofence-event`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'enter',
          geofence_id: geofence.id,
          geofence_name: geofence.name,
          geofence_type: geofence.type,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn('Failed to notify zone enter:', e);
    }
  }

  async notifyZoneExit(geofence) {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/tracking/geofence-event`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'exit',
          geofence_id: geofence.id,
          geofence_name: geofence.name,
          geofence_type: geofence.type,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn('Failed to notify zone exit:', e);
    }
  }

  getGeofences() {
    return [...this.geofences];
  }
}

const geofenceService = new GeofenceService();
export default geofenceService;
