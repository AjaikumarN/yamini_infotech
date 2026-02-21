import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/api_response.dart';
import 'dio_client.dart';
import 'storage_service.dart';
import 'secure_storage_service.dart';

/// API Service - now powered by DioClient
///
/// Same interface as before (ApiResponse<T>) but uses Dio underneath:
/// - 10s connect / 15s receive timeouts
/// - Automatic retry (2x) on network errors
/// - Response caching for dashboards, lists
/// - Request deduplication
/// - Gzip compression
/// - Keep-alive connections
/// - Timing logs for every request
class ApiService {
  static ApiService? _instance;
  final DioClient _dio = DioClient.instance;
  final StorageService _storage = StorageService.instance;
  final SecureStorageService _secureStorage = SecureStorageService.instance;

  // Cached token for sync access (updated when token changes)
  String? _cachedToken;

  // Future cache - prevents repeated API calls in initState loops
  final Map<String, _FutureCacheEntry> _futureCache = {};

  ApiService._();

  /// Singleton instance
  static ApiService get instance {
    _instance ??= ApiService._();
    return _instance!;
  }

  /// Initialize API service
  Future<void> init() async {
    await _refreshCachedToken();
    await _dio.init();
  }

  Future<void> _refreshCachedToken() async {
    _cachedToken = await _secureStorage.getAccessToken();
    _cachedToken ??= _storage.getToken();
  }

  /// Update cached token (call after login)
  void updateToken(String? token) {
    _cachedToken = token;
    _dio.updateToken(token);
  }

  /// GET request with optional response caching
  ///
  /// [cacheDuration] - if set, caches response for this duration
  /// Use for: dashboard, product lists, employee lists etc.
  Future<ApiResponse<T>> get<T>(
    String endpoint, {
    Map<String, dynamic>? queryParams,
    T Function(dynamic)? fromJson,
    bool requiresAuth = true,
    Duration? cacheDuration,
  }) async {
    try {
      final response = await _dio.get(
        endpoint,
        queryParameters: queryParams,
        cacheDuration: cacheDuration,
      );

      return _handleDioResponse<T>(response, fromJson);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) {
        return ApiResponse.error('Request cancelled');
      }
      return ApiResponse.error(_handleDioError(e));
    } catch (e) {
      return ApiResponse.error('An unexpected error occurred');
    }
  }

  /// GET with Future caching - prevents duplicate calls in initState
  ///
  /// Same API call within [dedupWindow] returns the same Future
  Future<ApiResponse<T>> getCached<T>(
    String endpoint, {
    Map<String, dynamic>? queryParams,
    T Function(dynamic)? fromJson,
    Duration dedupWindow = const Duration(seconds: 5),
    Duration? cacheDuration,
  }) async {
    final key = '$endpoint${queryParams ?? ''}';
    final existing = _futureCache[key];

    if (existing != null && !existing.isExpired) {
      if (kDebugMode) debugPrint('🔄 DEDUP: $endpoint (reusing in-flight)');
      return existing.future as Future<ApiResponse<T>>;
    }

    final future = get<T>(
      endpoint,
      queryParams: queryParams,
      fromJson: fromJson,
      cacheDuration: cacheDuration,
    );

    _futureCache[key] = _FutureCacheEntry(
      future: future,
      expiry: DateTime.now().add(dedupWindow),
    );

    return future;
  }

  /// POST request
  Future<ApiResponse<T>> post<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
    bool requiresAuth = true,
  }) async {
    try {
      final response = await _dio.post(endpoint, data: body);
      // Invalidate related caches after mutation
      _dio.invalidateCache(endpoint.split('/').take(3).join('/'));
      return _handleDioResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e));
    } catch (e) {
      return ApiResponse.error('An unexpected error occurred');
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
      final response = await _dio.put(endpoint, data: body);
      _dio.invalidateCache(endpoint.split('/').take(3).join('/'));
      return _handleDioResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e));
    } catch (e) {
      return ApiResponse.error('An unexpected error occurred');
    }
  }

  /// PATCH request (partial update)
  Future<ApiResponse<T>> patch<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? fromJson,
    bool requiresAuth = true,
  }) async {
    try {
      final response = await _dio.patch(endpoint, data: body);
      _dio.invalidateCache(endpoint.split('/').take(3).join('/'));
      return _handleDioResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e));
    } catch (e) {
      return ApiResponse.error('An unexpected error occurred');
    }
  }

  /// DELETE request
  Future<ApiResponse<T>> delete<T>(
    String endpoint, {
    T Function(dynamic)? fromJson,
    bool requiresAuth = true,
  }) async {
    try {
      final response = await _dio.delete(endpoint);
      _dio.invalidateCache(endpoint.split('/').take(3).join('/'));
      return _handleDioResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return ApiResponse.error(_handleDioError(e));
    } catch (e) {
      return ApiResponse.error('An unexpected error occurred');
    }
  }

  /// Handle Dio response → ApiResponse
  ApiResponse<T> _handleDioResponse<T>(
    Response response,
    T Function(dynamic)? fromJson,
  ) {
    final statusCode = response.statusCode ?? 500;
    final responseData = response.data;

    if (statusCode >= 200 && statusCode < 300) {
      if (fromJson != null && responseData != null) {
        return ApiResponse.success(fromJson(responseData),
            statusCode: statusCode);
      } else {
        return ApiResponse.success(responseData as T,
            statusCode: statusCode);
      }
    } else {
      String errorMessage = 'Request failed';
      if (responseData is Map) {
        errorMessage = responseData['detail'] ??
            responseData['message'] ??
            'Request failed';
      }
      return ApiResponse.error(errorMessage, statusCode: statusCode);
    }
  }

  /// Handle Dio errors
  String _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Request timeout. Please try again.';
      case DioExceptionType.connectionError:
        return 'No internet connection';
      case DioExceptionType.badResponse:
        final data = error.response?.data;
        if (data is Map) {
          return data['detail'] ?? data['message'] ?? 'Server error';
        }
        return 'Server error: ${error.response?.statusCode}';
      case DioExceptionType.cancel:
        return 'Request cancelled';
      default:
        return 'An unexpected error occurred';
    }
  }

  /// Clear all caches (call on logout)
  void clearCaches() {
    _futureCache.clear();
    _dio.clearCache();
  }

  /// Dispose client
  void dispose() {
    _dio.dispose();
  }
}

/// Internal future cache entry
class _FutureCacheEntry {
  final Future future;
  final DateTime expiry;

  _FutureCacheEntry({required this.future, required this.expiry});

  bool get isExpired => DateTime.now().isAfter(expiry);
}
