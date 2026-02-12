/// Route path constants for the application
/// 
/// Centralized route definitions for navigation
/// Each role has its own route namespace to avoid conflicts
class RouteConstants {
  // Root and auth routes
  static const String ROOT = '/';
  static const String SPLASH = '/splash';
  static const String LOGIN = '/login';
  static const String UNAUTHORIZED = '/unauthorized';
  
  // Admin routes (prefix: /admin)
  static const String ADMIN_HOME = '/admin';
  static const String ADMIN_DASHBOARD = '/admin/dashboard';
  static const String ADMIN_LIVE_LOCATION = '/admin/live-location';
  static const String ADMIN_ATTENDANCE = '/admin/attendance';
  static const String ADMIN_USERS = '/admin/users';
  static const String ADMIN_SETTINGS = '/admin/settings';
  static const String ADMIN_REPORTS = '/admin/reports';
  // TODO: Add more admin routes as features are implemented
  
  // Reception routes (prefix: /reception)
  static const String RECEPTION_HOME = '/reception';
  static const String RECEPTION_DASHBOARD = '/reception/dashboard';
  static const String RECEPTION_CREATE_REQUEST = '/reception/create-request';
  static const String RECEPTION_ENQUIRIES = '/reception/enquiries';
  static const String RECEPTION_SERVICE_REQUESTS = '/reception/service-requests';
  static const String RECEPTION_ASSIGN = '/reception/assign';
  static const String RECEPTION_TRACKING = '/reception/tracking';
  static const String RECEPTION_ATTENDANCE = '/reception/attendance';
  
  // Salesman routes (prefix: /salesman)
  static const String SALESMAN_HOME = '/salesman';
  static const String SALESMAN_DASHBOARD = '/salesman/dashboard';
  static const String SALESMAN_ENQUIRIES = '/salesman/enquiries';
  static const String SALESMAN_ATTENDANCE = '/salesman/attendance';
  static const String SALESMAN_CUSTOMER_VISIT = '/salesman/customer-visit';
  static const String SALESMAN_FOLLOWUPS = '/salesman/followups';
  static const String SALESMAN_ORDERS = '/salesman/orders';
  static const String SALESMAN_DAILY_REPORT = '/salesman/daily-report';
  static const String SALESMAN_LOCATION = '/salesman/location';
  static const String SALESMAN_LEADS = '/salesman/leads';
  static const String SALESMAN_CUSTOMERS = '/salesman/customers';
  static const String SALESMAN_REPORTS = '/salesman/reports';
  static const String SALESMAN_VISIT_OVERVIEW = '/salesman/visit-overview';
  // TODO: Add more salesman routes as features are implemented
  
  // Service Engineer routes (prefix: /service-engineer)
  static const String SERVICE_HOME = '/service';
  static const String SERVICE_DASHBOARD = '/service/dashboard';
  static const String SERVICE_TICKETS = '/service/tickets';
  static const String SERVICE_SCHEDULE = '/service/schedule';
  static const String SERVICE_INVENTORY = '/service/inventory';
  
  // New Service Engineer routes
  static const String SERVICE_ENGINEER_DASHBOARD = '/service-engineer/dashboard';
  static const String SERVICE_ENGINEER_JOBS = '/service-engineer/jobs';
  static const String SERVICE_ENGINEER_JOB_DETAILS = '/service-engineer/jobs/:id';
  static const String SERVICE_ENGINEER_ATTENDANCE = '/service-engineer/attendance';
  static const String SERVICE_ENGINEER_JOB_ROUTE = '/service-engineer/job-route';
  // TODO: Add more service engineer routes as features are implemented
  
  // Admin routes (additional)
  static const String ADMIN_FIELD_OVERVIEW = '/admin/field-overview';
  
  // Shared routes (accessible to all roles)
  static const String PROFILE = '/profile';
  static const String NOTIFICATIONS = '/notifications';
  static const String SETTINGS = '/settings';
  static const String HELP = '/help';
}
