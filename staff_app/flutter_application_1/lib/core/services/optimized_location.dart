import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

/// Optimized location helper that never blocks the UI thread
///
/// Key improvements:
/// - Uses last-known-location FIRST, then updates async
/// - 5-second timeout fallback
/// - Does NOT block check-in button waiting for GPS lock
/// - Caches last good position for instant access
class OptimizedLocation {
  static OptimizedLocation? _instance;
  static OptimizedLocation get instance {
    _instance ??= OptimizedLocation._();
    return _instance!;
  }

  Position? _lastKnownPosition;
  DateTime? _lastFetchTime;
  bool _isFetching = false;

  OptimizedLocation._();

  Position? get lastKnown => _lastKnownPosition;
  bool get hasPosition => _lastKnownPosition != null;
  bool get isFetching => _isFetching;

  /// Check if cached position is still fresh (< 2 minutes)
  bool get _isFresh {
    if (_lastFetchTime == null) return false;
    return DateTime.now().difference(_lastFetchTime!).inSeconds < 120;
  }

  /// Get position fast - returns cached instantly, updates in background
  ///
  /// Returns: position immediately if cached, or waits max 5 seconds
  /// The callback [onUpdate] fires when a more accurate position arrives
  Future<Position?> getPositionFast({
    void Function(Position)? onUpdate,
  }) async {
    // Return cached if fresh
    if (_lastKnownPosition != null && _isFresh) {
      // Still update in background for accuracy
      _fetchInBackground(onUpdate);
      return _lastKnownPosition;
    }

    // Try last known position from OS (instant, no GPS needed)
    try {
      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null) {
        _lastKnownPosition = lastKnown;
        _lastFetchTime = DateTime.now();
        // Update with fresh position in background
        _fetchInBackground(onUpdate);
        return lastKnown;
      }
    } catch (e) {
      if (kDebugMode) debugPrint('⚠️ Last known position unavailable: $e');
    }

    // No cached position - wait for GPS with timeout
    return _fetchWithTimeout(onUpdate: onUpdate);
  }

  /// Get current position with 5-second timeout
  Future<Position?> _fetchWithTimeout({
    void Function(Position)? onUpdate,
  }) async {
    if (_isFetching) {
      // Already fetching, wait for result
      await Future.delayed(const Duration(milliseconds: 500));
      return _lastKnownPosition;
    }

    _isFetching = true;

    try {
      // Check permissions first
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _isFetching = false;
        return _lastKnownPosition;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied ||
            permission == LocationPermission.deniedForever) {
          _isFetching = false;
          return _lastKnownPosition;
        }
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 5),
        ),
      );

      _lastKnownPosition = position;
      _lastFetchTime = DateTime.now();
      _isFetching = false;
      onUpdate?.call(position);
      return position;
    } on TimeoutException {
      _isFetching = false;
      if (kDebugMode) debugPrint('⚠️ GPS timeout - using last known');
      return _lastKnownPosition;
    } catch (e) {
      _isFetching = false;
      if (kDebugMode) debugPrint('❌ Location error: $e');
      return _lastKnownPosition;
    }
  }

  /// Background fetch for accuracy update
  void _fetchInBackground(void Function(Position)? onUpdate) {
    if (_isFetching) return;
    _isFetching = true;

    Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 5),
      ),
    ).then((position) {
      _lastKnownPosition = position;
      _lastFetchTime = DateTime.now();
      _isFetching = false;
      onUpdate?.call(position);
    }).catchError((e) {
      _isFetching = false;
    });
  }

  /// Check and request permissions (call once on app start)
  Future<bool> ensurePermissions() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }
}
