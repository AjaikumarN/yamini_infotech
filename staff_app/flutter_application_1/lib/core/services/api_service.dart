import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../models/api_response.dart';
import 'storage_service.dart';
import 'secure_storage_service.dart';

/// API Service
/// 
/// Centralized HTTP client for all API communications
/// Handles authentication headers, error handling, and response parsing
/// 
/// Features:
/// - Automatic token injection
/// - Request/Response logging (debug mode)
/// - Error handling and parsing
/// - Timeout configuration
/// - Retry logic (TODO)
class ApiService {
  static ApiService? _instance;
  final http.Client _client = http.Client();
  final StorageService _storage = StorageService.instance;
  final SecureStorageService _secureStorage = SecureStorageService.instance;
  
  // Cached token for sync access (updated when token changes)
  String? _cachedToken;
  
  ApiService._();
  
  /// Singleton instance
  static ApiService get instance {
    _instance ??= ApiService._();
    return _instance!;
  }
  
  /// Initialize API service - call after auth service init to cache token
  Future<void> init() async {
    await _refreshCachedToken();
  }
  
  /// Refresh the cached token from storage
  Future<void> _refreshCachedToken() async {
    // Try secure storage first (for "Keep Me Logged In")
    _cachedToken = await _secureStorage.getAccessToken();
    // Fall back to regular storage
    _cachedToken ??= _storage.getToken();
  }
  
  /// Update cached token (call after login)
  void updateToken(String? token) {
    _cachedToken = token;
  }
  
  /// Get common headers with authentication
  Map<String, String> _getHeaders({bool includeAuth = true}) {
    final headers = {
      ApiConstants.HEADER_CONTENT_TYPE: ApiConstants.CONTENT_TYPE_JSON,
      ApiConstants.HEADER_ACCEPT: ApiConstants.CONTENT_TYPE_JSON,
    };
    
    if (includeAuth) {
      // Use cached token (from either secure or regular storage)
      final token = _cachedToken ?? _storage.getToken();
      if (token != null) {
        headers[ApiConstants.HEADER_AUTHORIZATION] = 
            ApiConstants.getAuthHeader(token);
      }
    }
    
    return headers;
  }
  
  /// GET request
  Future<ApiResponse<T>> get<T>(
    String endpoint, {
    Map<String, dynamic>? queryParams,
    T Function(dynamic)? fromJson,
    bool requiresAuth = true,
  }) async {
    try {
      var uri = Uri.parse('${ApiConstants.BASE_URL}$endpoint');
      
      if (queryParams != null && queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }
      
      print('🌐 GET $uri');
      print('🔑 Auth: ${requiresAuth ? "Yes" : "No"}');
      
      final response = await _client
          .get(uri, headers: _getHeaders(includeAuth: requiresAuth))
          .timeout(ApiConstants.TIMEOUT_DURATION);
      
      print('📨 Status: ${response.statusCode}, Body length: ${response.body.length}');
      
      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      print('❌ GET Exception: $e');
      return ApiResponse.error(_handleError(e));
    }
  }
  
  /// POST request
  Future<ApiResponse<T>> post<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
    bool requiresAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConstants.BASE_URL}$endpoint');
      
      final response = await _client
          .post(
            uri,
            headers: _getHeaders(includeAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConstants.TIMEOUT_DURATION);
      
      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse.error(_handleError(e));
    }
  }
  
  /// PUT request
  Future<ApiResponse<T>> put<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
    bool requiresAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConstants.BASE_URL}$endpoint');
      
      final response = await _client
          .put(
            uri,
            headers: _getHeaders(includeAuth: requiresAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConstants.TIMEOUT_DURATION);
      
      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse.error(_handleError(e));
    }
  }
  
  /// DELETE request
  Future<ApiResponse<T>> delete<T>(
    String endpoint, {
    T Function(dynamic)? fromJson,
    bool requiresAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConstants.BASE_URL}$endpoint');
      
      final response = await _client
          .delete(uri, headers: _getHeaders(includeAuth: requiresAuth))
          .timeout(ApiConstants.TIMEOUT_DURATION);
      
      return _handleResponse<T>(response, fromJson);
    } catch (e) {
      return ApiResponse.error(_handleError(e));
    }
  }
  
  /// Handle HTTP response
  /// Note: Backend returns data directly, not wrapped in {success, data} format
  ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(dynamic)? fromJson,
  ) {
    final statusCode = response.statusCode;
    
    try {
      // Backend returns data directly (list or object), not wrapped
      final dynamic responseData = jsonDecode(response.body);
      
      if (statusCode >= 200 && statusCode < 300) {
        // Success - parse the direct response
        if (fromJson != null) {
          return ApiResponse.success(fromJson(responseData), statusCode: statusCode);
        } else {
          return ApiResponse.success(responseData as T, statusCode: statusCode);
        }
      } else {
        // Error response - backend returns {detail: "error message"}
        String errorMessage = 'Request failed';
        if (responseData is Map) {
          errorMessage = responseData['detail'] ?? responseData['message'] ?? 'Request failed';
        }
        return ApiResponse.error(
          errorMessage,
          statusCode: statusCode,
        );
      }
    } catch (e) {
      // If response is not JSON or parsing fails
      if (statusCode >= 200 && statusCode < 300) {
        // For empty successful responses (like null from /attendance/today)
        return ApiResponse.success(null as T, statusCode: statusCode);
      } else {
        return ApiResponse.error(
          'Server error: ${response.reasonPhrase}',
          statusCode: statusCode,
        );
      }
    }
  }
  
  /// Handle errors
  String _handleError(dynamic error) {
    if (error.toString().contains('SocketException')) {
      return 'No internet connection';
    } else if (error.toString().contains('TimeoutException')) {
      return 'Request timeout. Please try again.';
    } else {
      return 'An unexpected error occurred';
    }
  }
  
  /// Dispose client
  void dispose() {
    _client.close();
  }
}
