/**
 * Admin Notification Router
 * Handles notification click navigation to correct admin pages with filters
 * 
 * PRINCIPLE: Every notification click redirects to EXACT page with EXACT filter
 */

import { useNavigate } from 'react-router-dom';

export const useNotificationRouter = () => {
  const navigate = useNavigate();

  /**
   * Handle notification click - route to appropriate admin page
   * @param {Object} notification - Notification object with action_url
   */
  const handleNotificationClick = (notification) => {
    if (!notification?.action_url) {
      console.warn('Notification missing action_url:', notification);
      return;
    }

    const url = notification.action_url;
    
    // Navigate to the action URL
    navigate(url);
    
    // Return the URL for logging/tracking
    return url;
  };

  /**
   * Get display info for notification type
   */
  const getNotificationDisplay = (notificationType) => {
    const displayMap = {
      // Enquiries & Sales
      'ENQUIRY_NEW': { color: '#10b981', icon: '📩' },
      'ENQUIRY_HOT': { color: '#ef4444', icon: '🔥' },
      'ENQUIRY_CONVERTED': { color: '#10b981', icon: '✅' },
      'ENQUIRY_FOLLOWUP_MISSED': { color: '#ef4444', icon: '⚠️' },
      
      // Service & SLA
      'SERVICE_NEW': { color: '#3b82f6', icon: '🔧' },
      'SERVICE_EMERGENCY': { color: '#ef4444', icon: '🚨' },
      'SERVICE_ASSIGNED': { color: '#6366f1', icon: '👷' },
      'SERVICE_SLA_RISK': { color: '#f59e0b', icon: '⏱' },
      'SERVICE_SLA_BREACHED': { color: '#ef4444', icon: '❌' },
      'SERVICE_COMPLETED': { color: '#10b981', icon: '✅' },
      
      // Orders & Billing
      'ORDER_PENDING': { color: '#f59e0b', icon: '🧾' },
      'ORDER_APPROVED': { color: '#10b981', icon: '✅' },
      'INVOICE_CREATED': { color: '#6366f1', icon: '📄' },
      'OUTSTANDING_ALERT': { color: '#ef4444', icon: '💰' },
      
      // Employees & Productivity
      'ENGINEER_INACTIVE': { color: '#ef4444', icon: '⚠️' },
      'SALESMAN_INACTIVE': { color: '#f59e0b', icon: '📉' },
      'ATTENDANCE_MISSING': { color: '#f59e0b', icon: '⏱' },
      'LATE_ATTENDANCE': { color: '#f59e0b', icon: '⏰' },
      
      // System & Risk
      'REPEAT_COMPLAINTS': { color: '#ef4444', icon: '🔁' },
      'STOCK_CRITICAL': { color: '#ef4444', icon: '📦' },
      'SYSTEM_ERROR': { color: '#ef4444', icon: '🚨' },
    };

    return displayMap[notificationType] || { color: '#6b7280', icon: '📌' };
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority) => {
    const colorMap = {
      'critical': '#ef4444',
      'high': '#f59e0b',
      'medium': '#3b82f6',
      'low': '#6b7280'
    };
    return colorMap[priority] || '#6b7280';
  };

  /**
   * Format notification title with icon
   */
  const formatTitle = (notification) => {
    const display = getNotificationDisplay(notification.notification_type);
    return notification.title; // Icon already included from backend
  };

  return {
    handleNotificationClick,
    getNotificationDisplay,
    getPriorityColor,
    formatTitle
  };
};

/**
 * Example usage in NotificationBell component:
 * 
 * const { handleNotificationClick, getPriorityColor } = useNotificationRouter();
 * 
 * <div onClick={() => handleNotificationClick(notification)}>
 *   {notification.title}
 * </div>
 */
