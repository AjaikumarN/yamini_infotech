import React, { createContext, useState, useCallback, useEffect } from 'react'

export const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [notificationHistory, setNotificationHistory] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Add a notification
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString()
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    }

    setNotifications(prev => [newNotification, ...prev])
    setNotificationHistory(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Auto-remove notification after specified duration (default 5 seconds)
    if (notification.duration !== false) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }

    return id
  }, [removeNotification])

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setNotificationHistory(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Clear notification history
  const clearHistory = useCallback(() => {
    setNotificationHistory([])
  }, [])

  // Notification type templates
  const templates = {
    followUpReminder: (enquiryId, customerName) => ({
      type: 'reminder',
      title: '📞 Follow-up Reminder',
      message: `Follow-up due for ${customerName} (${enquiryId})`,
      priority: 'high',
      module: 'Reception',
      actionUrl: '/reception'
    }),

    missedReport: (employeeName, reportType) => ({
      type: 'alert',
      title: '⚠️ Missed Report',
      message: `${employeeName} has not submitted ${reportType} report`,
      priority: 'high',
      module: 'Employees',
      actionUrl: '/employee'
    }),

    serviceDelay: (customerName, slaHours) => ({
      type: 'critical',
      title: '🚨 Service Delay',
      message: `Service for ${customerName} is ${slaHours}+ hours delayed`,
      priority: 'critical',
      module: 'Service',
      actionUrl: '/employee/service-engineer'
    }),

    amcExpiry: (customerName, daysLeft) => ({
      type: 'warning',
      title: '⏰ AMC Expiring',
      message: `AMC for ${customerName} expires in ${daysLeft} days`,
      priority: 'high',
      module: 'Admin',
      actionUrl: '/admin'
    }),

    salesTarget: (salesmanName, progress) => ({
      type: 'info',
      title: '📊 Sales Target Update',
      message: `${salesmanName} is at ${progress}% of daily target`,
      priority: 'medium',
      module: 'Sales',
      actionUrl: '/employee/salesman'
    }),

    mifCall: (machineCount) => ({
      type: 'reminder',
      title: '🖨️ MIF Monthly Review',
      message: `${machineCount} machines due for monthly MIF call review`,
      priority: 'medium',
      module: 'Admin',
      actionUrl: '/admin'
    }),

    attendanceAlert: (employeeName) => ({
      type: 'warning',
      title: '📋 Attendance Alert',
      message: `${employeeName} marked absent today`,
      priority: 'medium',
      module: 'Office',
      actionUrl: '/employee/office-staff'
    }),

    stockAlert: (productName, quantity) => ({
      type: 'alert',
      title: '📦 Stock Alert',
      message: `${productName} stock is low (${quantity} units remaining)`,
      priority: 'high',
      module: 'Office',
      actionUrl: '/employee/office-staff'
    }),

    enquiryAssigned: (enquiryId, salesmanName) => ({
      type: 'info',
      title: '✅ Enquiry Assigned',
      message: `Enquiry ${enquiryId} assigned to ${salesmanName}`,
      priority: 'medium',
      module: 'Reception',
      actionUrl: '/reception'
    }),

    serviceCompleted: (customerName) => ({
      type: 'success',
      title: '✓ Service Completed',
      message: `Service for ${customerName} has been completed`,
      priority: 'low',
      module: 'Service',
      actionUrl: '/employee/service-engineer'
    }),

    bookingConfirmed: (bookingId, serviceName) => ({
      type: 'success',
      title: '✓ Booking Confirmed',
      message: `Your booking for ${serviceName} (${bookingId}) is confirmed`,
      priority: 'low',
      module: 'Customer',
      actionUrl: '/customer'
    }),

    complaintRaised: (complaintId, category) => ({
      type: 'info',
      title: '📝 Complaint Raised',
      message: `Complaint ${complaintId} (${category}) has been registered`,
      priority: 'medium',
      module: 'Customer',
      actionUrl: '/customer'
    })
  }

  const value = {
    notifications,
    notificationHistory,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    clearHistory,
    templates
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
