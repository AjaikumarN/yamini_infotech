import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/user.dart';
import '../models/api_response.dart';
import 'storage_service.dart';
import 'secure_storage_service.dart';
import 'api_service.dart';
import 'dio_client.dart';
import '../../features/salesman/services/live_tracking_service.dart';

/// Authentication Service
/// 
/// Manages user authentication state and operations:
/// - Login/Logout with "Keep Me Logged In" support
/// - Token management (access + refresh tokens)
/// - Session validation with auto-refresh
/// - User data persistence
/// - FCM token registration
/// 
/// This is a ChangeNotifier to allow UI to react to auth state changes
class AuthService extends ChangeNotifier {
  static AuthService? _instance;
  
  final StorageService _storage = StorageService.instance;
  final SecureStorageService _secureStorage = SecureStorageService.instance;
  
  User? _currentUser;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  
  AuthService._();
  
  /// Singleton instance
  static AuthService get instance {
    _instance ??= AuthService._();
    return _instance!;
  }
  
  // ==================== GETTERS ====================
  
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  
  // ==================== INITIALIZATION ====================
  
  /// Initialize auth service (check for existing session)
  /// Call this in main.dart before runApp or during splash screen
  /// 
  /// AUTO-LOGIN FLOW:
  /// 1. Check if "Keep Me Logged In" was enabled
  /// 2. If yes, attempt to restore session from secure storage
  /// 3. Verify token validity
  /// 4. If token expired, attempt refresh (if backend supports it)
  /// 5. Navigate to role-based dashboard if successful
  Future<void> init() async {
    _setLoading(true);
    
    try {
      // Check if user wanted to stay logged in
      final keepLoggedIn = await _secureStorage.getKeepLoggedIn();
      
      if (!keepLoggedIn) {
        if (kDebugMode) debugPrint('⚠️ Keep me logged in disabled - user must login manually');
        return;
      }
      
      // Try to restore session from secure storage
      final accessToken = await _secureStorage.getAccessToken();
      final user = await _secureStorage.getUser();
      
      if (accessToken != null && user != null) {
        // We have stored credentials, verify token is still valid
        final isValid = await verifyToken(accessToken);
        
        if (isValid) {
          // Token is valid, restore session
          _currentUser = user;
          _isAuthenticated = true;
          
          // Update cached token in ApiService for subsequent API calls
          ApiService.instance.updateToken(accessToken);
          
          if (kDebugMode) debugPrint('✅ Auto-login successful: ${user.name} (${user.role.value})');
        } else {
          // Token expired, try to refresh
          if (kDebugMode) debugPrint('⚠️ Access token expired, attempting refresh...');
          final refreshed = await refreshToken();
          
          if (!refreshed) {
            // Refresh failed, clear auth and require login
            if (kDebugMode) debugPrint('❌ Token refresh failed - user must login');
            await clearAuth();
          }
        }
      } else {
        if (kDebugMode) debugPrint('⚠️ No stored credentials found');
      }
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Auto-login error: $e');
      // If anything fails, clear auth state
      await clearAuth();
    } finally {
      _setLoading(false);
    }
  }
  
  // ==================== AUTHENTICATION OPERATIONS ====================
  
  /// Login with username and password
  /// 
  /// Uses OAuth2 password flow - sends form data to /api/auth/login
  /// 
  /// Parameters:
  /// - username: User's username/email
  /// - password: User's password
  /// - keepMeLoggedIn: Whether to persist session across app restarts (default: false)
  /// - fcmToken: Optional FCM token for push notifications
  Future<ApiResponse<User>> login({
    required String username,
    required String password,
    bool keepMeLoggedIn = false,
    String? fcmToken,
  }) async {
    _setLoading(true);
    
    try {
      // Backend uses OAuth2PasswordRequestForm which expects form data
      final body = {
        'username': username,
        'password': password,
      };
      
      // Include FCM token if provided (backend will store it for notifications)
      if (fcmToken != null) {
        body['fcm_token'] = fcmToken;
      }
      
      final response = await DioClient.instance.dio.post(
        ApiConstants.AUTH_LOGIN,
        data: body,
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          headers: {'skipAuth': true},
        ),
      );
      
      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        final Map<String, dynamic> responseData = response.data is String 
            ? jsonDecode(response.data) 
            : response.data;
        
        // Extract tokens
        final accessToken = responseData['access_token'] as String?;
        final refreshToken = responseData['refresh_token'] as String?;
        
        if (kDebugMode) {
          debugPrint('🔑 Access token: ${accessToken != null ? "present" : "MISSING"}');
          debugPrint('🔑 Refresh token: ${refreshToken != null ? "present" : "MISSING"}');
        }
        
        if (accessToken == null) {
          if (kDebugMode) debugPrint('❌ No access token in response');
          return ApiResponse.error('Invalid response: missing access token');
        }
        
        // Extract user data from response
        final userData = responseData['user'] as Map<String, dynamic>?;
        if (kDebugMode) debugPrint('👤 User data: ${userData != null ? "present" : "MISSING"}');
        
        if (userData == null) {
          if (kDebugMode) debugPrint('❌ No user data in response');
          return ApiResponse.error('Invalid response: missing user data');
        }
        
        // Create user object
        final user = User.fromJson(userData);
        
        // Save tokens and user data
        if (keepMeLoggedIn) {
          // Save to SECURE storage for persistence
          await _secureStorage.saveAccessToken(accessToken);
          if (refreshToken != null) {
            await _secureStorage.saveRefreshToken(refreshToken);
          }
          await _secureStorage.saveUser(user);
          await _secureStorage.setKeepLoggedIn(true);
          
          if (kDebugMode) debugPrint('🔐 Session saved securely (Keep Me Logged In enabled)');
        } else {
          // Save to regular storage (session-based, cleared on app close)
          await _storage.saveToken(accessToken);
          if (refreshToken != null) {
            await _storage.saveRefreshToken(refreshToken);
          }
          await _storage.saveUser(user);
          
          if (kDebugMode) debugPrint('📝 Session saved (temporary, cleared on logout)');
        }
        
        // Update cached token in ApiService for subsequent API calls
        ApiService.instance.updateToken(accessToken);
        
        _currentUser = user;
        _isAuthenticated = true;
        
        notifyListeners();
        
        if (kDebugMode) debugPrint('✅ Login successful: ${user.name} (${user.role.value})');
        return ApiResponse.success(user, message: 'Login successful');
      } else {
        // Parse error response
        final errorData = response.data;
        if (errorData is Map) {
          return ApiResponse.error(errorData['detail'] ?? 'Login failed');
        }
        return ApiResponse.error('Login failed');
      }
    } on DioException catch (e) {
      if (kDebugMode) debugPrint('❌ Login error: $e');
      if (e.type == DioExceptionType.connectionError) {
        return ApiResponse.error('Cannot connect to server. Please check your connection.');
      } else if (e.type == DioExceptionType.connectionTimeout || 
                 e.type == DioExceptionType.receiveTimeout) {
        return ApiResponse.error('Connection timeout. Please try again.');
      }
      // Try to extract error detail from response
      final data = e.response?.data;
      if (data is Map) {
        return ApiResponse.error(data['detail'] ?? 'Login failed');
      }
      return ApiResponse.error('Login error: ${e.message}');
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Unexpected login error: $e');
      return ApiResponse.error('An unexpected error occurred: $e');
    } finally {
      _setLoading(false);
    }
  }
  
  /// Logout user
  /// 
  /// COMPLETE LOGOUT:
  /// - Stops live tracking
  /// - Clears all tokens from secure storage
  /// - Clears user data
  /// - Resets "Keep Me Logged In" preference
  /// - Optionally notifies backend to invalidate token
  Future<void> logout() async {
    _setLoading(true);
    
    try {
      // IMPORTANT: Stop live tracking before logout
      try {
        await LiveTrackingService.instance.stopTracking();
        if (kDebugMode) debugPrint('✅ Live tracking stopped on logout');
      } catch (e) {
        if (kDebugMode) debugPrint('⚠️ Failed to stop tracking: $e');
      }
      
      // Get token before clearing (for backend logout API call)
      final token = await _secureStorage.getAccessToken() ?? _storage.getToken();
      
      // Optional: Call backend logout endpoint to invalidate token server-side
      if (token != null) {
        try {
          await DioClient.instance.post(
            ApiConstants.AUTH_LOGOUT,
          );
          if (kDebugMode) debugPrint('✅ Backend logout successful');
        } catch (e) {
          if (kDebugMode) debugPrint('⚠️ Backend logout failed (continuing with local logout): $e');
          // Continue with local logout even if backend call fails
        }
      }
      
      // Clear ALL authentication data (secure + regular storage)
      await clearAuth();
      
      // Clear API caches
      ApiService.instance.clearCaches();
      
      if (kDebugMode) debugPrint('✅ Logout complete - all data cleared');
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Logout error: $e');
      // Even if something fails, clear local auth
      await clearAuth();
    } finally {
      _setLoading(false);
    }
  }
  
  /// Verify if current token is still valid
  /// 
  /// Checks with backend if the token is still accepted
  Future<bool> verifyToken([String? token]) async {
    try {
      final tokenToVerify = token ?? 
                           await _secureStorage.getAccessToken() ?? 
                           _storage.getToken();
      
      if (tokenToVerify == null) return false;
      
      final response = await DioClient.instance.dio.get(
        ApiConstants.AUTH_VERIFY,
        options: Options(
          headers: {
            'Authorization': 'Bearer $tokenToVerify',
            'skipAuth': true,
          },
        ),
      );
      
      final isValid = response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300;
      if (kDebugMode) debugPrint(isValid ? '✅ Token valid' : '❌ Token invalid');
      return isValid;
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Token verification error: $e');
      return false;
    }
  }
  
  /// Refresh access token using refresh token
  /// 
  /// AUTOMATIC TOKEN REFRESH:
  /// 1. Gets refresh token from secure storage
  /// 2. Calls backend /api/auth/refresh endpoint
  /// 3. Receives new access token (and optionally new refresh token)
  /// 4. Updates stored tokens
  /// 5. Restores user session
  /// 
  /// Returns true if refresh successful, false otherwise
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _secureStorage.getRefreshToken();
      
      if (refreshToken == null) {
        if (kDebugMode) debugPrint('❌ No refresh token available');
        return false;
      }
      
      // Call backend refresh endpoint
      final response = await DioClient.instance.dio.post(
        ApiConstants.AUTH_REFRESH,
        data: {'refresh_token': refreshToken},
        options: Options(
          headers: {'skipAuth': true},
        ),
      );
      
      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        final responseData = response.data;
        final newAccessToken = responseData['access_token'] as String?;
        final newRefreshToken = responseData['refresh_token'] as String?;
        
        if (newAccessToken == null) {
          if (kDebugMode) debugPrint('❌ Invalid refresh response: missing access token');
          return false;
        }
        
        // Update tokens in secure storage
        await _secureStorage.saveAccessToken(newAccessToken);
        if (newRefreshToken != null) {
          await _secureStorage.saveRefreshToken(newRefreshToken);
        }
        
        // Update cached token in ApiService
        ApiService.instance.updateToken(newAccessToken);
        
        // Restore user session
        final user = await _secureStorage.getUser();
        if (user != null) {
          _currentUser = user;
          _isAuthenticated = true;
          notifyListeners();
        }
        
        if (kDebugMode) debugPrint('✅ Token refreshed successfully');
        return true;
      } else {
        if (kDebugMode) debugPrint('❌ Token refresh failed: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Token refresh error: $e');
      return false;
    }
  }
  
  // ==================== HELPER METHODS ====================
  
  /// Clear all authentication data
  /// 
  /// COMPLETE DATA WIPE:
  /// - Secure storage (tokens, user data, keep logged in preference)
  /// - Regular storage (fallback)
  /// - In-memory state
  Future<void> clearAuth() async {
    // Clear secure storage
    await _secureStorage.clearAll();
    
    // Clear regular storage (fallback)
    await _storage.removeTokens();
    await _storage.removeUser();
    
    // Clear cached token in ApiService
    ApiService.instance.updateToken(null);
    
    // Clear in-memory state
    _currentUser = null;
    _isAuthenticated = false;
    
    notifyListeners();
    if (kDebugMode) debugPrint('🗑️ All authentication data cleared');
  }
  
  /// Set loading state
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
  
  /// Check if user has specific role
  bool hasRole(List<String> allowedRoles) {
    if (_currentUser == null) return false;
    return allowedRoles.contains(_currentUser!.role.value);
  }
}

