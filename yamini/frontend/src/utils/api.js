// API utility for backend communication
// Uses environment variable VITE_API_URL, defaults to production API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yaminicopier.com';

// Get auth token from localStorage
const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('yamini_user') || '{}');
    return user.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// API request wrapper
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  // Don't set Content-Type for FormData - browser will set it automatically with boundary
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  // Only add Content-Type for non-FormData requests
  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('yamini_user');
        localStorage.removeItem('token');
        window.location.href = '/#/login';
        throw new Error('Not authenticated');
      }
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      // Handle Pydantic validation errors (422)
      if (response.status === 422 && error.detail) {
        if (Array.isArray(error.detail)) {
          const errorMsg = error.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
          throw new Error(errorMsg);
        }
        throw new Error(JSON.stringify(error.detail));
      }
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Only log errors if not a network failure (let components handle those silently)
    if (error.name !== 'TypeError' || !error.message.includes('Failed to fetch')) {
      console.error('API Error:', error);
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    // Don't use apiRequest here to avoid auto-redirect on 401
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Invalid username or password');
    }
    
    return await response.json();
  },
  
  getCurrentUser: () => apiRequest('/api/auth/me'),
};

// Customer API
export const customerAPI = {
  getAll: () => apiRequest('/api/customers'),
  getById: (id) => apiRequest(`/api/customers/${id}`),
  create: (data) => apiRequest('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Enquiry API
export const enquiryAPI = {
  getAll: () => apiRequest('/api/enquiries'),
  create: (data) => apiRequest('/api/enquiries', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/api/enquiries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Complaint API
export const complaintAPI = {
  getAll: () => apiRequest('/api/complaints'),
  getMy: () => apiRequest('/api/complaints/my-complaints'),
  create: (data) => apiRequest('/api/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status) => apiRequest(`/api/complaints/${id}/status?status=${status}`, {
    method: 'PUT',
  }),
};

// Booking API
export const bookingAPI = {
  getAll: () => apiRequest('/api/bookings'),
  create: (data) => apiRequest('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Sales API
export const salesAPI = {
  createCall: (data) => apiRequest('/api/sales/calls', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMyCalls: (todayOnly = false) => apiRequest(`/api/sales/my-calls?today_only=${todayOnly}`),
  createVisit: (data) => apiRequest('/api/sales/visits', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markAttendance: (data) => apiRequest('/api/sales/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMyAttendance: (todayOnly = false) => apiRequest(`/api/sales/my-attendance?today_only=${todayOnly}`),
};

// MIF API (Confidential)
export const mifAPI = {
  getAll: () => apiRequest('/api/mif'),
  create: (data) => apiRequest('/api/mif', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAccessLogs: () => apiRequest('/api/mif/access-logs'),
};

// Product API
export const productAPI = {
  getAll: () => apiRequest('/api/products'),
  getServices: () => apiRequest('/api/products/services'),
  create: (data) => apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createService: (data) => apiRequest('/api/products/services', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Notification API
export const notificationAPI = {
  getMy: (unreadOnly = false) => apiRequest(`/api/notifications/my-notifications?unread_only=${unreadOnly}`),
  create: (data) => apiRequest('/api/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markRead: (id) => apiRequest(`/api/notifications/${id}/read`, {
    method: 'PUT',
  }),
};

// User/Employee API
export const userAPI = {
  getAll: () => apiRequest('/api/users'),
  create: (data) => apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/api/users/${id}`, {
    method: 'DELETE',
  }),
  getMe: () => apiRequest('/api/users/me'),
};

