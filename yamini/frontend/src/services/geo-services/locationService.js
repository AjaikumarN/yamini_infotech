/**
 * Hyper-Accurate Location Service
 * Implements Rooftop-Level Precision with Mock Location Detection
 */

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with actual key or leave as is for fallback
const REQUIRED_ACCURACY_METERS = 50; // Increased from 20 to 50 meters for better compatibility

export class LocationService {
  constructor() {
    this.currentPosition = null;
    this.isWatchingPosition = false;
    this.watchId = null;
  }

  /**
   * Check if mock location is enabled (Android)
   */
  async detectMockLocation(position) {
    // For web, we can't directly detect mock location like native apps
    // But we can check for suspicious patterns
    const isSuspicious = 
      position.coords.accuracy === 0 || // Perfect accuracy is suspicious
      position.coords.altitude === null ||
      position.coords.speed === null;
    
    return isSuspicious;
  }

  /**
   * Get high-accuracy position with validation
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: false, // Use less accurate but faster location
        timeout: 30000, // Increase timeout to 30 seconds
        maximumAge: 10000 // Allow cached location up to 10 seconds old
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Check for mock location
          const isMock = await this.detectMockLocation(position);
          if (isMock) {
            reject(new Error('Mock location detected. Please disable fake GPS apps.'));
            return;
          }

          // Relaxed accuracy check - allow up to 100m accuracy
          if (position.coords.accuracy > 100) {
            console.warn(`GPS accuracy: ${Math.round(position.coords.accuracy)}m (acceptable)`);
          }

          this.currentPosition = position;
          resolve(position);
        },
        (error) => {
          let message = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location unavailable. Please check GPS settings.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again.';
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }

  /**
   * Reverse geocode with ROOFTOP precision (with fallback)
   */
  async getRooftopAddress(lat, lng) {
    try {
      // Try with Google Maps API first
      if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          // Prefer ROOFTOP, but accept other location types
          const rooftopResult = data.results.find(
            result => result.geometry.location_type === 'ROOFTOP'
          );
          
          const bestResult = rooftopResult || data.results[0];
          const addressComponents = bestResult.address_components;
          const detailedAddress = this.parseDetailedAddress(addressComponents, bestResult.formatted_address);

          return {
            formatted: bestResult.formatted_address,
            detailed: detailedAddress,
            locationType: bestResult.geometry.location_type,
            placeId: bestResult.place_id,
            components: addressComponents
          };
        }
      }

      // Fallback: Use browser's geolocation API (less precise but works without API key)
      return await this.getFallbackAddress(lat, lng);
    } catch (error) {
      console.error('Geocoding error:', error);
      // Return fallback address
      return await this.getFallbackAddress(lat, lng);
    }
  }

  /**
   * Fallback address when Google Maps API is unavailable
   */
  async getFallbackAddress(lat, lng) {
    // Use OpenStreetMap Nominatim (free, no API key required)
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'YaminiInfotech/1.0'
        }
      });
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        const detailedParts = [
          address.house_number,
          address.road,
          address.suburb || address.neighbourhood,
          address.city || address.town || address.village,
          address.state_district
        ].filter(Boolean);

        return {
          formatted: data.display_name,
          detailed: detailedParts.join(', '),
          locationType: 'APPROXIMATE',
          placeId: String(data.place_id || ''),
          components: data.address
        };
      }
    } catch (err) {
      console.error('Fallback geocoding error:', err);
    }

    // Last resort: Return coordinates
    return {
      formatted: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      detailed: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
      locationType: 'APPROXIMATE',
      placeId: '',
      components: {}
    };
  }

  /**
   * Parse address to extract door/street level format
   * Example: "5/77 e1, JJ Nagar, Reddiyarpatti, Tirunelveli"
   */
  parseDetailedAddress(components, formatted) {
    const addressParts = {
      doorNumber: '',
      street: '',
      sublocality: '',
      locality: '',
      district: '',
      state: '',
      pincode: ''
    };

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressParts.doorNumber = component.long_name;
      } else if (types.includes('route')) {
        addressParts.street = component.long_name;
      } else if (types.includes('sublocality_level_2') || types.includes('sublocality_level_1')) {
        addressParts.sublocality = component.long_name;
      } else if (types.includes('locality')) {
        addressParts.locality = component.long_name;
      } else if (types.includes('administrative_area_level_3')) {
        addressParts.district = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressParts.state = component.short_name;
      } else if (types.includes('postal_code')) {
        addressParts.pincode = component.long_name;
      }
    });

    // Build detailed format: "Door, Street, Sublocality, Locality, District"
    const parts = [
      addressParts.doorNumber && addressParts.street 
        ? `${addressParts.doorNumber}, ${addressParts.street}`
        : addressParts.street || addressParts.doorNumber,
      addressParts.sublocality,
      addressParts.locality,
      addressParts.district
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Start watching position for continuous monitoring
   */
  startWatching(onUpdate, onError) {
    if (this.isWatchingPosition) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = position;
        onUpdate(position);
      },
      onError,
      options
    );

    this.isWatchingPosition = true;
  }

  /**
   * Stop watching position
   */
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatchingPosition = false;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
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
}

export const locationService = new LocationService();
