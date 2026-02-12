/// Application-wide constants
/// 
/// This file contains non-API constants like:
/// - Storage keys
/// - App configuration
/// - Default values
/// - Feature flags
class AppConstants {
  // Storage keys for SharedPreferences/SecureStorage
  static const String STORAGE_TOKEN_KEY = 'auth_token';
  static const String STORAGE_REFRESH_TOKEN_KEY = 'refresh_token';
  static const String STORAGE_USER_DATA_KEY = 'user_data';
  static const String STORAGE_ROLE_KEY = 'user_role';
  static const String STORAGE_THEME_KEY = 'app_theme';
  
  // App information
  static const String APP_NAME = 'Staff ERP';
  static const String APP_VERSION = '1.0.0';
  
  // Pagination defaults
  static const int DEFAULT_PAGE_SIZE = 20;
  static const int MAX_PAGE_SIZE = 100;
  
  // Session management
  static const Duration SESSION_TIMEOUT = Duration(hours: 8);
  static const Duration TOKEN_REFRESH_THRESHOLD = Duration(minutes: 5);
  
  // Retry configuration
  static const int MAX_RETRY_ATTEMPTS = 3;
  static const Duration RETRY_DELAY = Duration(seconds: 2);
  
  // Feature flags
  // TODO: Configure these based on your requirements
  static const bool ENABLE_OFFLINE_MODE = false;
  static const bool ENABLE_ANALYTICS = false;
  static const bool ENABLE_CRASH_REPORTING = false;
  
  // Date/Time formats
  static const String DATE_FORMAT = 'yyyy-MM-dd';
  static const String TIME_FORMAT = 'HH:mm:ss';
  static const String DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
  static const String DISPLAY_DATE_FORMAT = 'dd MMM yyyy';
  static const String DISPLAY_DATETIME_FORMAT = 'dd MMM yyyy, hh:mm a';
}
