// API Client for backend communication
// Uses environment variable VITE_API_URL, defaults to production API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yaminicopier.com';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async logout() {
    this.setToken(null);
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // Customers
  async getCustomers() {
    return this.request('/api/customers/');
  }

  async createCustomer(data) {
    return this.request('/api/customers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Enquiries
  async getEnquiries() {
    return this.request('/api/enquiries/');
  }

  async createEnquiry(data) {
    return this.request('/api/enquiries/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEnquiry(id, data) {
    return this.request(`/api/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Complaints
  async getComplaints() {
    return this.request('/api/complaints/');
  }

  async getMyComplaints() {
    return this.request('/api/complaints/my-complaints');
  }

  async createComplaint(data) {
    return this.request('/api/complaints/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComplaintStatus(id, status) {
    return this.request(`/api/complaints/${id}/status?status=${status}`, {
      method: 'PUT',
    });
  }

  // MIF Records (Confidential)
  async getMIFRecords() {
    return this.request('/api/mif/');
  }

  async createMIFRecord(data) {
    return this.request('/api/mif/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMIFAccessLogs() {
    return this.request('/api/mif/access-logs');
  }

  // Sales
  async createSalesCall(data) {
    return this.request('/api/sales/calls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createShopVisit(data) {
    return this.request('/api/sales/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyCalls(todayOnly = false) {
    return this.request(`/api/sales/my-calls?today_only=${todayOnly}`);
  }

  async markAttendance(data) {
    return this.request('/api/sales/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyAttendance(todayOnly = false) {
    return this.request(`/api/sales/my-attendance?today_only=${todayOnly}`);
  }

  // Products & Services
  async getProducts() {
    return this.request('/api/products/');
  }

  async createProduct(data) {
    return this.request('/api/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getServices() {
    return this.request('/api/products/services');
  }

  async createService(data) {
    return this.request('/api/products/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bookings
  async getBookings() {
    return this.request('/api/bookings/');
  }

  async createBooking(data) {
    return this.request('/api/bookings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notifications
  async getMyNotifications(unreadOnly = false) {
    return this.request(`/api/notifications/my-notifications?unread_only=${unreadOnly}`);
  }

  async markNotificationRead(id) {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async createNotification(data) {
    return this.request('/api/notifications/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new APIClient();
export default apiClient;
