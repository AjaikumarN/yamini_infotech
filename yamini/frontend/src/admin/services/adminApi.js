/**
 * Admin API Service - Centralized API calls for admin operations
 * Reuses existing backend routes with admin permissions
 */

import { apiRequest } from '../../utils/api';

export const adminApi = {
  // Users
  getAllUsers: () => apiRequest('/api/users/all'),
  createUser: (userData) => apiRequest('/api/users/', { method: 'POST', body: userData }),
  updateUser: (userId, userData) => apiRequest(`/api/users/${userId}`, { method: 'PUT', body: userData }),
  
  // Enquiries
  getAllEnquiries: () => apiRequest('/api/enquiries/all'),
  assignEnquiry: (enquiryId, salesmanId) => 
    apiRequest(`/api/enquiries/${enquiryId}/assign`, { method: 'PUT', body: { assigned_to: salesmanId } }),
  
  // Orders
  getAllOrders: () => apiRequest('/api/orders/all'),
  approveOrder: (orderId) => 
    apiRequest(`/api/orders/${orderId}/approve`, { method: 'PUT' }),
  rejectOrder: (orderId, reason) => 
    apiRequest(`/api/orders/${orderId}/reject`, { method: 'PUT', body: { reason } }),
  
  // Attendance
  getAllAttendance: (date) => 
    apiRequest(`/api/attendance/all${date ? `?date=${date}` : ''}`),
  correctAttendance: (attendanceId, correction) =>
    apiRequest(`/api/attendance/${attendanceId}/correct`, { method: 'POST', body: correction }),
  
  // Service Requests
  getAllServiceRequests: () => apiRequest('/api/service_engineer/all-requests'),
  assignEngineer: (requestId, engineerId) =>
    apiRequest(`/api/service_engineer/requests/${requestId}/assign`, { method: 'PUT', body: { engineer_id: engineerId } }),
  
  // Analytics
  getSalesAnalytics: (period) => 
    apiRequest(`/api/analytics/sales?period=${period || 'week'}`),
  getServiceAnalytics: (period) =>
    apiRequest(`/api/analytics/service?period=${period || 'week'}`),
  getAttendanceAnalytics: (period) =>
    apiRequest(`/api/analytics/attendance?period=${period || 'month'}`),
  
  // Audit Logs
  getAuditLogs: (filters) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/api/audit/logs?${params}`);
  },
  
  // Feedback
  getAllFeedback: () => apiRequest('/api/feedback/all'),
  
  // Dashboard KPIs
  getDashboardKPIs: () => apiRequest('/api/analytics/dashboard-kpis')
};
