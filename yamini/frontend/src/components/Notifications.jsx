import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Notifications({ showPanel, setShowPanel, backendNotifications = [], allNotifications = [], markAsRead, refreshNotifications }) {
  const [viewTab, setViewTab] = useState('active')
  const navigate = useNavigate()
  
  // backendNotifications are already filtered for unread (from API with ?unread_only=true)
  const unreadNotifications = backendNotifications
  const unreadCount = unreadNotifications.length

  const getNotificationColor = (type) => {
    const colors = {
      critical: '#e74c3c',
      alert: '#e74c3c',
      warning: '#f39c12',
      reminder: '#3498db',
      info: '#2ecc71',
      success: '#27ae60'
    }
    return colors[type] || '#95a5a6'
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read_status && markAsRead) {
      await markAsRead(notification.id)
    }
    // Navigate to action URL if present
    if (notification.action_url) {
      setShowPanel(false)
      // Handle internal routing
      if (notification.action_url.startsWith('/')) {
        navigate(notification.action_url)
      }
    }
  }

  return (
    <>
      {showPanel && (
        <div className="notification-panel">
          <div className="panel-header">
            <h3>Notifications</h3>
            <button 
              className="close-panel"
              onClick={() => setShowPanel(false)}
            >
              ✕
            </button>
          </div>

            <div className="panel-tabs">
              <button 
                className={`tab-button ${viewTab === 'active' ? 'active' : ''}`}
                onClick={() => setViewTab('active')}
              >
                Active ({unreadCount})
              </button>
              <button 
                className={`tab-button ${viewTab === 'history' ? 'active' : ''}`}
                onClick={() => setViewTab('history')}
              >
                History
              </button>
            </div>

            <div className="panel-content">
              {viewTab === 'active' && (
                <>
                  {unreadNotifications.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📭</span>
                      <p>No active notifications</p>
                    </div>
                  ) : (
                    <div className="notification-list">
                      {unreadNotifications.map(notif => (
                        <div 
                          key={notif.id}
                          className={`notification-item ${notif.notification_type} ${notif.read_status ? 'read' : 'unread'}`}
                          onClick={() => handleNotificationClick(notif)}
                          style={{ borderLeft: `4px solid ${getNotificationColor(notif.priority)}` }}
                        >
                          <div className="notif-priority">
                            <span className={`priority-indicator ${notif.priority}`}></span>
                          </div>
                          <div className="notif-content">
                            <div className="notif-title">{notif.title}</div>
                            <div className="notif-message">{notif.message}</div>
                            <div className="notif-meta">
                              <span className="notif-time">
                                {new Date(notif.created_at).toLocaleTimeString()}
                              </span>
                              <span className="notif-module">{notif.module}</span>
                            </div>
                          </div>
                          <button 
                            className="notif-remove"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead && markAsRead(notif.id)
                            }}
                          >
                            ✓
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {viewTab === 'history' && (
                <>
                  {allNotifications.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📚</span>
                      <p>No notification history</p>
                    </div>
                  ) : (
                    <div className="notification-list history">
                      {allNotifications.slice(0, 50).map(notif => (
                        <div 
                          key={notif.id}
                          className={`notification-item ${notif.notification_type} ${notif.read_status ? 'read' : 'unread'}`}
                          style={{ borderLeft: `4px solid ${getNotificationColor(notif.priority)}` }}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="notif-content">
                            <div className="notif-title">{notif.title}</div>
                            <div className="notif-message">{notif.message}</div>
                            <div className="notif-meta">
                              <span className="notif-time">
                                {new Date(notif.created_at).toLocaleString()}
                              </span>
                              <span className="notif-module">{notif.module}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
      )}

      <style>{`
        .notifications-system {
          position: relative;
        }

        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
          pointer-events: auto;
        }

        .toast-notification {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast-content {
          flex: 1;
        }

        .toast-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .toast-message {
          font-size: 14px;
          color: #555;
          line-height: 1.4;
        }

        .toast-action {
          display: block;
          color: #3498db;
          margin-top: 8px;
          font-weight: 500;
          cursor: pointer;
        }

        .toast-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #95a5a6;
          padding: 0;
          min-width: auto;
        }

        .toast-close:hover {
          color: #e74c3c;
        }

        .notification-bell {
          position: relative;
        }

        .bell-button {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 12px;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bell-icon {
          display: block;
        }

        .unread-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #e74c3c;
          color: white;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .notification-panel {
          position: fixed;
          top: 70px;
          right: 20px;
          width: 400px;
          max-width: 100vw;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 100px);
        }

        .panel-header {
          padding: 15px 20px;
          border-bottom: 2px solid #ecf0f1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .close-panel {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #7f8c8d;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-panel:hover {
          color: #e74c3c;
        }

        .panel-tabs {
          display: flex;
          border-bottom: 1px solid #ecf0f1;
          padding: 0 10px;
        }

        .tab-button {
          flex: 1;
          padding: 12px 15px;
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          font-size: 14px;
          font-weight: 600;
          color: #7f8c8d;
          transition: all 0.3s;
        }

        .tab-button.active {
          color: #3498db;
          border-bottom-color: #3498db;
        }

        .tab-button:hover {
          color: #2c3e50;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          min-height: 200px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #95a5a6;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }

        .notification-list {
          padding: 10px;
        }

        .notification-item {
          padding: 15px;
          margin-bottom: 8px;
          background: #f8f9fa;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          gap: 10px;
          transition: all 0.3s;
        }

        .notification-item:hover {
          background: #ecf0f1;
        }

        .notification-item.unread {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .notification-item.read {
          opacity: 0.7;
        }

        .notif-priority {
          width: 8px;
          flex-shrink: 0;
        }

        .priority-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: block;
        }

        .priority-indicator.critical {
          background: #e74c3c;
        }

        .priority-indicator.high {
          background: #f39c12;
        }

        .priority-indicator.medium {
          background: #3498db;
        }

        .priority-indicator.low {
          background: #27ae60;
        }

        .notif-content {
          flex: 1;
          min-width: 0;
        }

        .notif-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
          font-size: 13px;
        }

        .notif-message {
          color: #555;
          font-size: 12px;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .notif-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: #95a5a6;
        }

        .notif-time {
          font-weight: 500;
        }

        .notif-module {
          background: #e8f4f8;
          padding: 2px 6px;
          border-radius: 3px;
          color: #2c3e50;
        }

        .notif-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #95a5a6;
          padding: 0;
          font-size: 16px;
          flex-shrink: 0;
          min-width: auto;
        }

        .notif-remove:hover {
          color: #e74c3c;
        }

        .panel-footer {
          padding: 15px 20px;
          border-top: 1px solid #ecf0f1;
          display: flex;
          gap: 10px;
        }

        .clear-button {
          flex: 1;
          padding: 10px;
          background: #ecf0f1;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #7f8c8d;
          transition: all 0.3s;
        }

        .clear-button:hover {
          background: #ddd;
          color: #2c3e50;
        }

        @media (max-width: 768px) {
          .notification-panel {
            position: fixed;
            right: 10px;
            left: 10px;
            width: auto;
            max-height: 70vh;
          }

          .toast-container {
            left: 10px;
            right: 10px;
            max-width: none;
          }
        }
      `}</style>
    </>
  )
}
