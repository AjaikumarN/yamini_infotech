import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/dio_client.dart';
/// Live Tracking Service
/// 
/// Handles background GPS tracking for salesman:
/// - Starts after check-in
/// - Sends location updates every 15-30 seconds
/// - Stops on check-out or logout
/// 
/// RULES:
/// - Only ONE instance should run at a time
/// - Must check permissions before starting
/// - Must handle app lifecycle (pause/resume)
class LiveTrackingService extends ChangeNotifier {
  static LiveTrackingService? _instance;
  
  Timer? _trackingTimer;
  bool _isTracking = false;
  Position? _lastPosition;
  DateTime? _lastUpdateTime;
  String? _error;
  
  // Tracking interval in seconds
  static const int _trackingIntervalSeconds = 15;
  
  LiveTrackingService._();

  static LiveTrackingService get instance {
    _instance ??= LiveTrackingService._();
    return _instance!;
  }

  // ==================== GETTERS ====================
  
  bool get isTracking => _isTracking;
  Position? get lastPosition => _lastPosition;
  DateTime? get lastUpdateTime => _lastUpdateTime;
  String? get error => _error;

  // ==================== PERMISSION CHECKING ====================

  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Check and request location permission
  Future<LocationPermission> checkAndRequestPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();
    
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    
    return permission;
  }

  /// Get current position with high accuracy
  Future<Position?> getCurrentPosition() async {
    try {
      // Check if location service is enabled
      final serviceEnabled = await isLocationServiceEnabled();
      if (!serviceEnabled) {
        _error = 'Location services are disabled. Please enable GPS.';
        notifyListeners();
        return null;
      }
      
      // Check permission
      final permission = await checkAndRequestPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        _error = 'Location permission denied. Please allow location access.';
        notifyListeners();
        return null;
      }
      
      // Get position
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10, // Minimum distance (meters) before update
        ),
      );
      
      _lastPosition = position;
      _error = null;
      notifyListeners();
      
      if (kDebugMode) debugPrint('📍 Got position: ${position.latitude}, ${position.longitude}');
      return position;
    } catch (e) {
      if (kDebugMode) debugPrint('❌ getCurrentPosition error: $e');
      _error = 'Failed to get location: ${e.toString()}';
      notifyListeners();
      return null;
    }
  }

  // ==================== TRACKING CONTROL ====================

  /// Start live tracking
  /// Call this after successful check-in
  Future<bool> startTracking() async {
    if (_isTracking) {
      if (kDebugMode) debugPrint('⚠️ Tracking already active');
      return true;
    }
    
    if (kDebugMode) debugPrint('🚀 Starting live tracking...');
    
    // Get initial position
    final position = await getCurrentPosition();
    if (position == null) {
      return false;
    }
    
    // Send initial location
    await _sendLocationUpdate(position);
    
    // Start periodic updates
    _trackingTimer = Timer.periodic(
      Duration(seconds: _trackingIntervalSeconds),
      (_) => _onTrackingTick(),
    );
    
    _isTracking = true;
    _error = null;
    notifyListeners();
    
    if (kDebugMode) debugPrint('✅ Live tracking started (interval: ${_trackingIntervalSeconds}s)');
    return true;
  }

  /// Stop live tracking
  /// Call this on check-out or logout
  Future<void> stopTracking() async {
    if (!_isTracking) {
      return;
    }
    
    if (kDebugMode) debugPrint('🛑 Stopping live tracking...');
    
    // Cancel timer
    _trackingTimer?.cancel();
    _trackingTimer = null;
    
    // Send final location update
    if (_lastPosition != null) {
      await _sendLocationUpdate(_lastPosition!, isFinal: true);
    }
    
    _isTracking = false;
    notifyListeners();
    
    if (kDebugMode) debugPrint('✅ Live tracking stopped');
  }

  /// Handle tracking tick
  Future<void> _onTrackingTick() async {
    if (!_isTracking) return;
    
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      );
      
      _lastPosition = position;
      _lastUpdateTime = DateTime.now();
      
      await _sendLocationUpdate(position);
      
      notifyListeners();
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Tracking tick error: $e');
      _error = 'Location update failed';
      notifyListeners();
    }
  }

  // ==================== API COMMUNICATION ====================

  /// Send location update to backend
  Future<bool> _sendLocationUpdate(Position position, {bool isFinal = false}) async {
    try {
      final response = await DioClient.instance.dio.post(
        ApiConstants.TRACKING_LOCATION_UPDATE,
        data: {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'timestamp': DateTime.now().toIso8601String(),
          'is_final': isFinal,
        },
      );

      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        _lastUpdateTime = DateTime.now();
        if (kDebugMode) debugPrint('📤 Location sent: ${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}');
        return true;
      } else {
        if (kDebugMode) debugPrint('❌ Location update failed: ${response.statusCode}');
        return false;
      }
    } on DioException catch (e) {
      if (kDebugMode) debugPrint('❌ _sendLocationUpdate error: ${e.message}');
      return false;
    } catch (e) {
      if (kDebugMode) debugPrint('❌ _sendLocationUpdate error: $e');
      return false;
    }
  }

  // ==================== LIFECYCLE ====================

  /// Pause tracking (app in background)
  void pauseTracking() {
    if (!_isTracking) return;
    if (kDebugMode) debugPrint('⏸️ Pausing tracking (app backgrounded)');
    _trackingTimer?.cancel();
    _trackingTimer = null;
  }

  /// Resume tracking (app in foreground)
  void resumeTracking() {
    if (!_isTracking) return;
    if (_trackingTimer != null) return;
    
    if (kDebugMode) debugPrint('▶️ Resuming tracking');
    _trackingTimer = Timer.periodic(
      Duration(seconds: _trackingIntervalSeconds),
      (_) => _onTrackingTick(),
    );
    
    // Immediately get position
    _onTrackingTick();
  }

  /// Dispose service
  @override
  void dispose() {
    stopTracking();
    super.dispose();
  }

  /// Get formatted last update time
  String get lastUpdateTimeFormatted {
    if (_lastUpdateTime == null) return 'Never';
    final diff = DateTime.now().difference(_lastUpdateTime!);
    if (diff.inSeconds < 60) {
      return '${diff.inSeconds}s ago';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else {
      return '${diff.inHours}h ago';
    }
  }
}