/**
 * Device Status Monitor
 * Tracks battery, GPS, and internet status
 */
import { API_BASE_URL } from '../config';

class DeviceMonitor {
  constructor() {
    this.status = {
      battery: { level: 100, charging: false, supported: false },
      gps: { enabled: false, accuracy: null, lastUpdate: null },
      internet: { online: navigator.onLine, type: 'unknown', effectiveType: 'unknown' }
    };
    this.listeners = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    // Battery API
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.status.battery = {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          supported: true
        };
        
        battery.addEventListener('levelchange', () => {
          this.status.battery.level = Math.round(battery.level * 100);
          this.notifyListeners();
          this.checkBatteryAlerts();
        });
        
        battery.addEventListener('chargingchange', () => {
          this.status.battery.charging = battery.charging;
          this.notifyListeners();
        });
      } catch (e) {
        console.warn('Battery API not available:', e);
      }
    }

    // Network status
    window.addEventListener('online', () => {
      this.status.internet.online = true;
      this.notifyListeners();
    });
    
    window.addEventListener('offline', () => {
      this.status.internet.online = false;
      this.notifyListeners();
      this.sendOfflineAlert();
    });

    // Network Information API
    if ('connection' in navigator) {
      const conn = navigator.connection;
      this.status.internet.type = conn.type || 'unknown';
      this.status.internet.effectiveType = conn.effectiveType || 'unknown';
      
      conn.addEventListener('change', () => {
        this.status.internet.type = conn.type || 'unknown';
        this.status.internet.effectiveType = conn.effectiveType || 'unknown';
        this.notifyListeners();
      });
    }

    this.initialized = true;
    
    // Return current status
    return {
      batteryLevel: this.status.battery.level,
      isCharging: this.status.battery.charging,
      isOnline: this.status.internet.online
    };
  }

  updateGPSStatus(enabled, accuracy = null) {
    this.status.gps = {
      enabled: enabled,
      accuracy: accuracy,
      lastUpdate: new Date().toISOString()
    };
    this.notifyListeners();
  }

  setGPSError() {
    this.status.gps.enabled = false;
    this.notifyListeners();
    this.sendGPSAlert();
  }

  // Callback for status changes (used by UI components)
  onStatusChange = null;

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    const status = {
      batteryLevel: this.status.battery.level,
      isCharging: this.status.battery.charging,
      isOnline: this.status.internet.online
    };
    this.listeners.forEach(cb => cb(status));
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  getStatus() {
    return { ...this.status };
  }

  cleanup() {
    this.listeners = [];
    this.onStatusChange = null;
  }

  async checkBatteryAlerts() {
    const level = this.status.battery.level;
    if (level <= 15 && !this.status.battery.charging) {
      await this.sendAlert('battery_low', `Battery critically low: ${level}%`);
    } else if (level <= 25 && !this.status.battery.charging) {
      await this.sendAlert('battery_warning', `Battery low: ${level}%`);
    }
  }

  async sendGPSAlert() {
    await this.sendAlert('gps_disabled', 'GPS is disabled or unavailable');
  }

  async sendOfflineAlert() {
    await this.sendAlert('offline', 'Device went offline');
  }

  async sendAlert(type, message) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/tracking/device-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert_type: type,
          message: message,
          battery_level: this.status.battery.level,
          battery_charging: this.status.battery.charging,
          gps_enabled: this.status.gps.enabled,
          gps_accuracy: this.status.gps.accuracy,
          is_online: this.status.internet.online,
          network_type: this.status.internet.effectiveType,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn('Failed to send device alert:', e);
    }
  }

  // Send periodic status update
  async sendStatusUpdate() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/tracking/device-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert_type: 'status_update',
          message: 'Periodic status update',
          battery_level: this.status.battery.level,
          battery_charging: this.status.battery.charging,
          gps_enabled: this.status.gps.enabled,
          gps_accuracy: this.status.gps.accuracy,
          is_online: this.status.internet.online,
          network_type: this.status.internet.effectiveType,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      // Silently fail for periodic updates
    }
  }
}

const deviceMonitor = new DeviceMonitor();
export default deviceMonitor;
