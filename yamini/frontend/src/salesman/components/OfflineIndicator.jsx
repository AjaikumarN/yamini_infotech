import React, { useState, useEffect } from 'react';
import '../styles/salesman.css';

/**
 * OfflineIndicator - Shows online/offline status
 * Caches data when offline, syncs when back online
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending sync items
    checkPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingSync = () => {
    try {
      const pending = localStorage.getItem('pending-sync');
      if (pending) {
        const items = JSON.parse(pending);
        setPendingSync(items.length);
      }
    } catch (err) {
      console.error('Failed to check pending sync:', err);
    }
  };

  const syncPendingData = async () => {
    try {
      const pending = localStorage.getItem('pending-sync');
      if (!pending) return;

      const items = JSON.parse(pending);
      console.log('Syncing', items.length, 'items...');

      // Sync each item (implement actual API calls here)
      for (const item of items) {
        // await syncItem(item);
      }

      // Clear pending after sync
      localStorage.removeItem('pending-sync');
      setPendingSync(0);
      
      // Show success notification
      if (window.showToast) {
        window.showToast('Data synced successfully!', 'success');
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  if (isOnline && pendingSync === 0) {
    return null; // Don't show when online and nothing to sync
  }

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        <div className="offline-status">
          <span className="status-icon">🟢</span>
          <span className="status-text">Online</span>
          {pendingSync > 0 && (
            <span className="sync-badge">
              Syncing {pendingSync} item{pendingSync > 1 ? 's' : ''}...
            </span>
          )}
        </div>
      ) : (
        <div className="offline-status">
          <span className="status-icon">🔴</span>
          <span className="status-text">Offline Mode</span>
          <span className="offline-message">
            You can still work. Data will sync when online.
          </span>
        </div>
      )}
    </div>
  );
}
