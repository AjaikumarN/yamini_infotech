/// In-memory response cache with TTL
///
/// Used by DioClient for caching GET responses
/// Automatically evicts expired entries
class ResponseCache {
  static final ResponseCache _instance = ResponseCache._();
  static ResponseCache get instance => _instance;

  final Map<String, _CacheEntry> _cache = {};

  ResponseCache._();

  /// Get cached data if not expired
  dynamic get(String key) {
    final entry = _cache[key];
    if (entry == null) return null;
    if (entry.isExpired) {
      _cache.remove(key);
      return null;
    }
    return entry.data;
  }

  /// Store data with TTL
  void put(String key, dynamic data, Duration ttl) {
    _cache[key] = _CacheEntry(
      data: data,
      expiry: DateTime.now().add(ttl),
    );
    // Lazy cleanup: remove expired entries if cache grows large
    if (_cache.length > 100) {
      _evictExpired();
    }
  }

  /// Invalidate entries matching a path pattern
  void invalidate(String pattern) {
    _cache.removeWhere((key, _) => key.contains(pattern));
  }

  /// Clear all cache
  void clear() {
    _cache.clear();
  }

  void _evictExpired() {
    _cache.removeWhere((_, entry) => entry.isExpired);
  }
}

class _CacheEntry {
  final dynamic data;
  final DateTime expiry;

  _CacheEntry({required this.data, required this.expiry});

  bool get isExpired => DateTime.now().isAfter(expiry);
}
