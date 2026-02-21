import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:dio_smart_retry/dio_smart_retry.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import 'secure_storage_service.dart';
import 'storage_service.dart';
import 'response_cache.dart';

/// High-performance Dio HTTP client with:
/// - Connection pooling & keep-alive
/// - Gzip compression
/// - Automatic retry (max 2)
/// - Request deduplication
/// - Response caching
/// - Auth token injection
/// - Request timing logs
class DioClient {
  static DioClient? _instance;
  late final Dio _dio;
  final StorageService _storage = StorageService.instance;
  final SecureStorageService _secureStorage = SecureStorageService.instance;
  final ResponseCache _cache = ResponseCache.instance;

  // Track in-flight requests to cancel duplicates
  final Map<String, CancelToken> _inflightRequests = {};

  String? _cachedToken;

  DioClient._() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.BASE_URL,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    ));

    // Auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _cachedToken ?? _storage.getToken();
        if (token != null && options.headers['skipAuth'] != true) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        options.headers.remove('skipAuth');

        // Timing
        options.extra['_startTime'] = DateTime.now().millisecondsSinceEpoch;
        if (kDebugMode) {
          debugPrint('⏱️ [${options.method}] ${options.path}');
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        final startTime = response.requestOptions.extra['_startTime'] as int?;
        if (startTime != null && kDebugMode) {
          final duration = DateTime.now().millisecondsSinceEpoch - startTime;
          debugPrint(
              '✅ [${response.requestOptions.method}] ${response.requestOptions.path} → ${response.statusCode} (${duration}ms)');
        }
        handler.next(response);
      },
      onError: (error, handler) {
        final startTime =
            error.requestOptions.extra['_startTime'] as int?;
        if (startTime != null && kDebugMode) {
          final duration = DateTime.now().millisecondsSinceEpoch - startTime;
          debugPrint(
              '❌ [${error.requestOptions.method}] ${error.requestOptions.path} → ${error.response?.statusCode ?? 'TIMEOUT'} (${duration}ms)');
        }
        handler.next(error);
      },
    ));

    // Retry interceptor - max 2 retries on network errors
    _dio.interceptors.add(RetryInterceptor(
      dio: _dio,
      logPrint: (msg) {
        if (kDebugMode) debugPrint('🔄 $msg');
      },
      retries: 2,
      retryDelays: const [
        Duration(milliseconds: 500),
        Duration(seconds: 1),
      ],
    ));
  }

  static DioClient get instance {
    _instance ??= DioClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  /// Initialize - cache the auth token
  Future<void> init() async {
    _cachedToken = await _secureStorage.getAccessToken();
    _cachedToken ??= _storage.getToken();
  }

  /// Update cached token after login
  void updateToken(String? token) {
    _cachedToken = token;
  }

  /// Cancel duplicate request for the same key
  CancelToken _deduplicateRequest(String key) {
    // Cancel previous in-flight request with the same key
    _inflightRequests[key]?.cancel('Superseded by new request');
    final token = CancelToken();
    _inflightRequests[key] = token;
    return token;
  }

  void _cleanupRequest(String key) {
    _inflightRequests.remove(key);
  }

  /// GET with optional caching and deduplication
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Duration? cacheDuration,
    bool deduplicate = true,
    CancelToken? cancelToken,
  }) async {
    final cacheKey = '$path${queryParameters ?? ''}';

    // Check cache first
    if (cacheDuration != null) {
      final cached = _cache.get(cacheKey);
      if (cached != null) {
        if (kDebugMode) debugPrint('📦 CACHE HIT: $path');
        return Response(
          requestOptions: RequestOptions(path: path),
          data: cached,
          statusCode: 200,
        );
      }
    }

    final ct = deduplicate ? _deduplicateRequest(cacheKey) : (cancelToken ?? CancelToken());

    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        cancelToken: ct,
      );

      // Cache successful response
      if (cacheDuration != null && response.statusCode == 200) {
        _cache.put(cacheKey, response.data, cacheDuration);
      }

      _cleanupRequest(cacheKey);
      return response;
    } on DioException catch (e) {
      _cleanupRequest(cacheKey);
      if (e.type == DioExceptionType.cancel) {
        // Return empty cancelled response - don't propagate
        throw e;
      }
      rethrow;
    }
  }

  /// POST request
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.post(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  /// PUT request
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.put(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  /// PATCH request (partial update)
  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.patch(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  /// DELETE request
  Future<Response> delete(
    String path, {
    dynamic data,
    CancelToken? cancelToken,
  }) async {
    return _dio.delete(path, data: data, cancelToken: cancelToken);
  }

  /// Multipart upload (for photos etc)
  Future<Response> upload(
    String path, {
    required FormData formData,
    void Function(int, int)? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    return _dio.post(
      path,
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
        sendTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
      ),
      onSendProgress: onSendProgress,
      cancelToken: cancelToken,
    );
  }

  /// Invalidate cache for a path pattern
  void invalidateCache(String pathPattern) {
    _cache.invalidate(pathPattern);
  }

  /// Clear all caches
  void clearCache() {
    _cache.clear();
  }

  void dispose() {
    for (final token in _inflightRequests.values) {
      token.cancel('Client disposed');
    }
    _inflightRequests.clear();
    _dio.close();
  }
}
