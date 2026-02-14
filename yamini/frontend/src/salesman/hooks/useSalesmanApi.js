import { apiRequest } from '../../utils/api';

/**
 * Salesman API Hook
 * Centralized API calls for all salesman operations
 */

// ========== ATTENDANCE ==========
export const checkTodayAttendance = async () => {
  return apiRequest('/api/attendance/today');
};

export const markAttendance = async (formData) => {
  return apiRequest('/api/attendance/check-in', {
    method: 'POST',
    body: formData,
    isFormData: true
  });
};

// ========== ENQUIRIES ==========
export const getMyEnquiries = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  
  const query = params.toString();
  return apiRequest(`/api/enquiries${query ? '?' + query : ''}`);
};

export const updateEnquiry = async (id, data) => {
  return apiRequest(`/api/enquiries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

//========== CALLS ==========
export const getMyCalls = async (today = false, userId = null) => {
  const params = new URLSearchParams();
  if (today) params.append('today_only', 'true');
  if (userId) params.append('user_id', userId);
  const query = params.toString();
  return apiRequest(`/api/sales/my-calls${query ? '?' + query : ''}`);
};

export const createCall = async (data) => {
  return apiRequest('/api/sales/calls', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const markCallCompleted = async (callId) => {
  return apiRequest(`/api/sales/calls/${callId}/complete`, {
    method: 'PUT'
  });
};

// ========== ORDERS ==========
export const getMyOrders = async (userId = null) => {
  return apiRequest(`/api/orders${userId ? '?user_id=' + userId : ''}`);
};

// ========== DAILY REPORT ==========
export const submitDailyReport = async (data) => {
  return apiRequest('/api/sales/salesman/daily-report', {
    method: 'POST',
    body: JSON.stringify({
      achievements: data.achievements || '',
      challenges: data.challenges || '',
      tomorrow_plan: data.tomorrow_plan || '',
      report_notes: data.report_notes || null
    })
  });
};

export const getTodayReport = async () => {
  const today = new Date().toISOString().split('T')[0];
  return apiRequest(`/api/sales/salesman/daily-report/${today}`);
};

// ========== DASHBOARD STATS ==========
export const getDashboardStats = async (params = '') => {
  try {
    // Extract userId from params if present
    const userId = params ? new URLSearchParams(params).get('user_id') : null;
    
    const [attendance, calls, enquiries, orders] = await Promise.all([
      checkTodayAttendance(),
      getMyCalls(true, userId), // Pass userId to getMyCalls
      getMyEnquiries({ status: 'new,contacted' }),
      getMyOrders(userId) // Pass userId to getMyOrders
    ]);

    // Filter today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEnquiries = enquiries?.filter(e => {
      const enquiryDate = new Date(e.created_at);
      enquiryDate.setHours(0, 0, 0, 0);
      return enquiryDate.getTime() === today.getTime();
    }) || [];
    
    const todayOrders = orders?.filter(o => {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }) || [];
    
    // Calculate pending follow-ups from calls (callback + interested outcomes)
    const allCalls = await getMyCalls(false, userId); // Pass userId here too
    const pendingFollowUps = allCalls?.filter(c => 
      c.outcome === 'callback' || c.outcome === 'interested'
    ) || [];

    // Build timeline from today's activities
    const timeline = [
      ...(attendance ? [{
        time: new Date(attendance.check_in_time),
        type: 'attendance',
        icon: '🕘',
        title: 'Marked Attendance',
        description: `Check-in at ${attendance.location || 'Office'}`
      }] : []),
      ...(calls?.map(c => ({
        time: new Date(c.created_at),
        type: 'call',
        icon: '📞',
        title: `Called ${c.customer_name || 'Customer'}`,
        description: c.call_purpose || 'General inquiry'
      })) || []),
      ...(todayEnquiries.map(e => ({
        time: new Date(e.created_at),
        type: 'enquiry',
        icon: '📋',
        title: `New Enquiry: ${e.customer_name}`,
        description: `Interested in ${e.product_name || 'Product'}`
      })) || []),
      ...(todayOrders.map(o => ({
        time: new Date(o.created_at),
        type: 'order',
        icon: '🎉',
        title: `Order Created: ${o.customer_name}`,
        description: `₹${o.total_amount?.toLocaleString() || '0'}`
      })) || [])
    ].sort((a, b) => b.time - a.time); // Sort newest first

    return {
      attendanceMarked: !!attendance,
      attendanceData: attendance,
      todayCalls: calls?.length || 0,
      todayEnquiries: todayEnquiries.length,
      todayOrders: todayOrders.length,
      pendingFollowUps: pendingFollowUps.length,
      activeEnquiries: enquiries?.length || 0,
      ordersThisMonth: orders?.filter(o => {
        const orderDate = new Date(o.created_at);
        const now = new Date();
        return orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
      }).length || 0,
      timeline // Today's activity timeline
    };
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return {
      attendanceMarked: false,
      attendanceData: null,
      todayCalls: 0,
      todayEnquiries: 0,
      todayOrders: 0,
      pendingFollowUps: 0,
      activeEnquiries: 0,
      ordersThisMonth: 0,
      timeline: []
    };
  }
};
