/// API Configuration and Endpoints
/// 
/// This file contains all API-related constants including:
/// - Base URL configuration
/// - Endpoint paths
/// - Timeout configurations
/// 
/// All endpoints must match the actual FastAPI backend routes
class ApiConstants {
  // ==================================================================
  // BASE URL CONFIGURATION
  // ==================================================================
  // 
  // FOR DEVELOPMENT:
  // - Android Emulator: Use 'http://10.0.2.2:8000' (emulator's localhost)
  // - iOS Simulator: Use 'http://localhost:8000'
  // - Physical Device (same network): Use your PC's IP (e.g., 'http://192.168.1.100:8000')
  //   To find your IP:
  //   - Windows: Run 'ipconfig' in CMD, look for IPv4 Address
  //   - Mac: Run 'ifconfig' in Terminal, look for inet under en0
  //
  // FOR PRODUCTION:
  // - Use your server's public URL (e.g., 'https://api.yourdomain.com')
  // ==================================================================
  
  // Change this URL based on your environment:
  static const String BASE_URL = 'http://10.0.2.2:8000';
  
  // Alternative configurations (uncomment as needed):
  // static const String BASE_URL = 'http://localhost:8000';        // iOS Simulator
  // static const String BASE_URL = 'http://192.168.1.100:8000';    // Physical device (update IP)
  // static const String BASE_URL = 'https://api.yaminicopier.com'; // Production
  
  static const Duration TIMEOUT_DURATION = Duration(seconds: 30);

  
  // ==================== AUTHENTICATION ====================
  static const String AUTH_LOGIN = '/api/auth/login';
  static const String AUTH_LOGOUT = '/api/auth/logout';
  static const String AUTH_REFRESH = '/api/auth/refresh';
  static const String AUTH_ME = '/api/auth/me';
  static const String AUTH_VERIFY = '/api/auth/me'; // Alias for token verification
  
  // ==================== USERS (Admin) ====================
  static const String USERS_LIST = '/api/users';
  static const String USERS_CREATE = '/api/users';
  static const String USERS_UPDATE = '/api/users';  // /{id}
  static const String USERS_DELETE = '/api/users';  // /{id}
  
  // ==================== ATTENDANCE ====================
  static const String ATTENDANCE_TODAY = '/api/attendance/today';
  static const String ATTENDANCE_CHECK_IN = '/api/attendance/check-in';
  static const String ATTENDANCE_HISTORY = '/api/attendance/history';
  
  // Simple Check-In Only Attendance (New)
  static const String ATTENDANCE_SIMPLE_TODAY = '/api/attendance/simple/today';
  static const String ATTENDANCE_SIMPLE_CHECK_IN = '/api/attendance/simple/check-in';
  
  // ==================== ENQUIRIES ====================
  static const String ENQUIRIES = '/api/enquiries';
  static const String ENQUIRIES_FOLLOWUPS = '/api/enquiries/followups';
  
  // ==================== SALES ====================
  static const String SALES_CALLS = '/api/sales/calls';
  static const String SALES_MY_CALLS = '/api/sales/my-calls';
  static const String SALES_MY_VISITS = '/api/sales/my-visits';
  static const String SALES_MY_ATTENDANCE = '/api/sales/my-attendance';
  static const String SALESMAN_ANALYTICS = '/api/sales/salesman/analytics/summary';
  static const String SALESMAN_DAILY_REPORT = '/api/sales/salesman/daily-report';
  static const String SALESMAN_CALLS = '/api/sales/my-calls'; // Alias for follow-ups screen
  
  // ==================== TRACKING / LOCATION ====================
  static const String TRACKING_VISIT_CHECKIN = '/api/tracking/visits/check-in';
  static const String TRACKING_VISIT_CHECKOUT = '/api/tracking/visits/check-out';
  static const String TRACKING_LOCATION_UPDATE = '/api/tracking/location/update';
  static const String TRACKING_ACTIVE_VISIT = '/api/tracking/visits/active';
  static const String TRACKING_VISIT_HISTORY = '/api/tracking/visits/history';
  static const String TRACKING_LIVE_LOCATIONS = '/api/tracking/live/locations';
  
  // ==================== ORDERS ====================
  static const String ORDERS = '/api/orders';
  static const String ORDERS_MY = '/api/orders/my-orders';
  static const String ORDERS_PENDING = '/api/orders/pending-approval';
  
  // ==================== CUSTOMERS ====================
  static const String CUSTOMERS = '/api/customers';
  
  // ==================== PRODUCTS ====================
  static const String PRODUCTS = '/api/products';
  
  // ==================== NOTIFICATIONS ====================
  static const String NOTIFICATIONS = '/api/notifications';
  
  // ==================== RECEPTION SPECIFIC ====================
  static const String RECEPTION_CALLS = '/api/calls';
  static const String VISITORS = '/api/visitors';
  static const String BOOKINGS = '/api/bookings';
  
  // ==================== SERVICE ENGINEER ====================
  static const String SERVICE_REQUESTS = '/api/service-requests';
  static const String SERVICE_ENGINEER = '/api/service-engineer';
  static const String COMPLAINTS = '/api/complaints';
  
  // ==================== REPORTS ====================
  static const String REPORTS = '/api/reports';
  static const String ANALYTICS = '/api/analytics';
  
  // ==================== HTTP HEADERS ====================
  static const String HEADER_CONTENT_TYPE = 'Content-Type';
  static const String HEADER_AUTHORIZATION = 'Authorization';
  static const String HEADER_ACCEPT = 'Accept';
  static const String CONTENT_TYPE_JSON = 'application/json';
  
  /// Get authorization header value
  static String getAuthHeader(String token) => 'Bearer $token';
}
