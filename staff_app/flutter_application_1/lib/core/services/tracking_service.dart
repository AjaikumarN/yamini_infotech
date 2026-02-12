import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'api_service.dart';

/// Enterprise Salesman Tracking Service
///
/// CORE RULES (MUST NEVER CHANGE):
/// 1. Routes are based on VISIT HISTORY, not live GPS alone
/// 2. Visit points are meaningful stops (customer, area, job)
/// 3. Live location is separate from visit points
///
/// DATA FLOW:
/// - saveVisitPoint() → POST /api/salesman/visits (creates route point)
/// - updateLiveLocation() → POST /api/salesman/location/update (for admin map)
/// - getMyRoute() → GET /api/salesman/visits/today (view own route)
/// - getSalesmanRoute() → GET /api/admin/salesmen/{id}/route (admin view)
class TrackingService {
  static TrackingService? _instance;
  final ApiService _api = ApiService.instance;

  // Live location tracking
  StreamSubscription<Position>? _locationSubscription;
  Position? _lastPosition;
  bool _isTracking = false;

  // Callbacks
  void Function(Position)? onLocationUpdate;
  void Function(String error)? onError;

  TrackingService._();

  static TrackingService get instance {
    _instance ??= TrackingService._();
    return _instance!;
  }

  bool get isTracking => _isTracking;
  Position? get lastPosition => _lastPosition;

  // ============= VISIT POINT APIs =============

  /// Save a visit point (creates route point)
  ///
  /// This is the PRIMARY way routes are created.
  /// Called when:
  /// - Attendance check-in
  /// - Manual "Add Visit" button
  /// - Job completion
  /// - Customer visit check-in/out
  Future<VisitSaveResult> saveVisitPoint({
    required double latitude,
    required double longitude,
    double accuracyM = 0,
    String visitType =
        'manual', // attendance, manual, job_completion, customer_visit
    String? customerName,
    String? notes,
  }) async {
    try {
      final response = await _api.post<Map<String, dynamic>>(
        '/api/salesman/visits',
        body: {
          'latitude': latitude,
          'longitude': longitude,
          'accuracy_m': accuracyM,
          'visit_type': visitType,
          'customer_name': customerName,
          'notes': notes,
        },
        fromJson: (data) => data as Map<String, dynamic>,
      );

      if (response.success && response.data != null) {
        return VisitSaveResult(
          success: true,
          visitId: response.data!['visit_id'],
          sequenceNo: response.data!['sequence_no'],
          distanceFromPrevKm: (response.data!['distance_from_prev_km'] ?? 0)
              .toDouble(),
          message: response.data!['message'] ?? 'Visit saved',
        );
      }

      return VisitSaveResult(
        success: false,
        message: response.message ?? 'Failed to save visit',
      );
    } catch (e) {
      return VisitSaveResult(success: false, message: 'Error: $e');
    }
  }

  /// Get my visits for today (salesman's own route)
  Future<RouteData?> getMyVisitsToday() async {
    try {
      final response = await _api.get<Map<String, dynamic>>(
        '/api/salesman/visits/today',
        fromJson: (data) => data as Map<String, dynamic>,
      );

      if (response.success && response.data != null) {
        return RouteData.fromJson(response.data!);
      }
      return null;
    } catch (e) {
      print('❌ Get my visits error: $e');
      return null;
    }
  }

  // ============= LIVE LOCATION APIs =============

  /// Update live location (for admin map marker)
  ///
  /// This does NOT create a visit point.
  /// Used only for real-time tracking display.
  Future<bool> updateLiveLocation({
    required double latitude,
    required double longitude,
    double accuracyM = 0,
  }) async {
    try {
      final response = await _api.post<Map<String, dynamic>>(
        '/api/salesman/location/update',
        body: {
          'latitude': latitude,
          'longitude': longitude,
          'accuracy_m': accuracyM,
        },
        fromJson: (data) => data as Map<String, dynamic>,
      );

      return response.success;
    } catch (e) {
      print('❌ Live location update error: $e');
      return false;
    }
  }

  /// Stop live tracking
  Future<bool> stopLiveTracking() async {
    try {
      await stopLocationStream();

      final response = await _api.post<Map<String, dynamic>>(
        '/api/salesman/location/stop',
        fromJson: (data) => data as Map<String, dynamic>,
      );

      return response.success;
    } catch (e) {
      print('❌ Stop tracking error: $e');
      return false;
    }
  }

  // ============= ADMIN APIs =============

  /// Get all live locations (admin only)
  Future<List<LiveLocation>> getAllLiveLocations() async {
    try {
      final response = await _api.get<Map<String, dynamic>>(
        '/api/tracking/live/locations',
        fromJson: (data) => data as Map<String, dynamic>,
      );

      if (response.success && response.data != null) {
        final locations = response.data!['locations'] as List? ?? [];
        return locations
            .map((loc) => LiveLocation.fromJson(loc as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      print('❌ Get live locations error: $e');
      return [];
    }
  }

  /// Get salesman route (admin only)
  ///
  /// Returns route built from VISIT HISTORY, not live GPS.
  Future<SalesmanRouteData?> getSalesmanRoute(
    int salesmanId, {
    DateTime? date,
  }) async {
    try {
      final dateStr = date != null
          ? '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}'
          : null;

      final response = await _api.get<Map<String, dynamic>>(
        '/api/admin/salesmen/$salesmanId/route',
        queryParams: dateStr != null ? {'date': dateStr} : null,
        fromJson: (data) => data as Map<String, dynamic>,
      );

      if (response.success && response.data != null) {
        return SalesmanRouteData.fromJson(response.data!);
      }
      return null;
    } catch (e) {
      print('❌ Get salesman route error: $e');
      return null;
    }
  }

  /// Get all routes summary for today (admin only)
  Future<List<RouteSummary>> getAllRoutesToday() async {
    try {
      final response = await _api.get<Map<String, dynamic>>(
        '/api/admin/salesmen/routes/today',
        fromJson: (data) => data as Map<String, dynamic>,
      );

      if (response.success && response.data != null) {
        final routes = response.data!['routes'] as List? ?? [];
        return routes
            .map((r) => RouteSummary.fromJson(r as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      print('❌ Get all routes error: $e');
      return [];
    }
  }

  // ============= GPS LOCATION STREAM =============

  /// Start continuous location tracking
  Future<bool> startLocationStream({
    bool saveAsVisits = false,
    Duration interval = const Duration(seconds: 30),
  }) async {
    if (_isTracking) return true;

    try {
      // Check permissions
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        final requested = await Geolocator.requestPermission();
        if (requested == LocationPermission.denied ||
            requested == LocationPermission.deniedForever) {
          onError?.call('Location permission denied');
          return false;
        }
      }

      // Check if service enabled
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        onError?.call('Location services disabled');
        return false;
      }

      _isTracking = true;

      // Start listening
      _locationSubscription =
          Geolocator.getPositionStream(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.high,
              distanceFilter: 10, // Update every 10 meters
            ),
          ).listen(
            (position) async {
              _lastPosition = position;
              onLocationUpdate?.call(position);

              // Update live location for admin map
              await updateLiveLocation(
                latitude: position.latitude,
                longitude: position.longitude,
                accuracyM: position.accuracy,
              );
            },
            onError: (error) {
              onError?.call('Location error: $error');
            },
          );

      return true;
    } catch (e) {
      _isTracking = false;
      onError?.call('Failed to start tracking: $e');
      return false;
    }
  }

  /// Stop location stream
  Future<void> stopLocationStream() async {
    await _locationSubscription?.cancel();
    _locationSubscription = null;
    _isTracking = false;
  }

  /// Get current position (one-time)
  Future<Position?> getCurrentPosition() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      print('❌ Get position error: $e');
      return null;
    }
  }

  /// Quick save current location as visit point
  Future<VisitSaveResult> saveCurrentLocationAsVisit({
    String visitType = 'manual',
    String? customerName,
    String? notes,
  }) async {
    final position = await getCurrentPosition();
    if (position == null) {
      return VisitSaveResult(
        success: false,
        message: 'Could not get current location',
      );
    }

    return saveVisitPoint(
      latitude: position.latitude,
      longitude: position.longitude,
      accuracyM: position.accuracy,
      visitType: visitType,
      customerName: customerName,
      notes: notes,
    );
  }

  void dispose() {
    stopLocationStream();
  }
}

// ============= DATA MODELS =============

class VisitSaveResult {
  final bool success;
  final int? visitId;
  final int? sequenceNo;
  final double? distanceFromPrevKm;
  final String message;

  VisitSaveResult({
    required this.success,
    this.visitId,
    this.sequenceNo,
    this.distanceFromPrevKm,
    required this.message,
  });
}

class RouteData {
  final String date;
  final int totalVisits;
  final double totalDistanceKm;
  final List<VisitPoint> visits;

  RouteData({
    required this.date,
    required this.totalVisits,
    required this.totalDistanceKm,
    required this.visits,
  });

  factory RouteData.fromJson(Map<String, dynamic> json) {
    final visitsList = (json['visits'] as List? ?? [])
        .map((v) => VisitPoint.fromJson(v as Map<String, dynamic>))
        .toList();

    return RouteData(
      date: json['date'] ?? '',
      totalVisits: json['total_visits'] ?? 0,
      totalDistanceKm: (json['total_distance_km'] ?? 0).toDouble(),
      visits: visitsList,
    );
  }
}

class VisitPoint {
  final int sequence;
  final double lat;
  final double lng;
  final double? accuracyM;
  final String? address;
  final String? visitType;
  final String? customerName;
  final String? notes;
  final double? distanceKm;
  final String? time;
  final String? visitedAt;

  VisitPoint({
    required this.sequence,
    required this.lat,
    required this.lng,
    this.accuracyM,
    this.address,
    this.visitType,
    this.customerName,
    this.notes,
    this.distanceKm,
    this.time,
    this.visitedAt,
  });

  factory VisitPoint.fromJson(Map<String, dynamic> json) {
    return VisitPoint(
      sequence: json['sequence'] ?? 0,
      lat: (json['lat'] ?? 0).toDouble(),
      lng: (json['lng'] ?? 0).toDouble(),
      accuracyM: (json['accuracy_m'] ?? 0).toDouble(),
      address: json['address'],
      visitType: json['visit_type'],
      customerName: json['customer_name'],
      notes: json['notes'],
      distanceKm: (json['distance_km'] ?? 0).toDouble(),
      time: json['time'],
      visitedAt: json['visited_at'],
    );
  }
}

class LiveLocation {
  final int userId;
  final String? fullName;
  final String? photoUrl;
  final String? phone;
  final String? email;
  final String? role;
  final double latitude;
  final double longitude;
  final double? accuracyM;
  final String? updatedAt;
  final bool isActive;

  LiveLocation({
    required this.userId,
    this.fullName,
    this.photoUrl,
    this.phone,
    this.email,
    this.role,
    required this.latitude,
    required this.longitude,
    this.accuracyM,
    this.updatedAt,
    this.isActive = true,
  });

  factory LiveLocation.fromJson(Map<String, dynamic> json) {
    return LiveLocation(
      userId: json['user_id'] ?? json['salesman_id'] ?? 0,
      fullName: json['full_name'],
      photoUrl: json['photo_url'],
      phone: json['phone'],
      email: json['email'],
      role: json['role'],
      latitude: (json['latitude'] ?? 0).toDouble(),
      longitude: (json['longitude'] ?? 0).toDouble(),
      accuracyM: (json['accuracy_m'] ?? 0).toDouble(),
      updatedAt: json['updated_at'],
      isActive: json['is_active'] ?? true,
    );
  }
}

class SalesmanRouteData {
  final SalesmanInfo salesman;
  final String date;
  final RouteSummaryInfo summary;
  final List<VisitPoint> visits;
  final List<List<double>> routePath;

  SalesmanRouteData({
    required this.salesman,
    required this.date,
    required this.summary,
    required this.visits,
    required this.routePath,
  });

  factory SalesmanRouteData.fromJson(Map<String, dynamic> json) {
    final salesmanJson = json['salesman'] as Map<String, dynamic>? ?? {};
    final summaryJson = json['summary'] as Map<String, dynamic>? ?? {};
    final visitsList = (json['visits'] as List? ?? [])
        .map((v) => VisitPoint.fromJson(v as Map<String, dynamic>))
        .toList();
    final pathList = (json['route_path'] as List? ?? [])
        .map((p) => (p as List).map((c) => (c as num).toDouble()).toList())
        .toList();

    return SalesmanRouteData(
      salesman: SalesmanInfo.fromJson(salesmanJson),
      date: json['date'] ?? '',
      summary: RouteSummaryInfo.fromJson(summaryJson),
      visits: visitsList,
      routePath: pathList,
    );
  }
}

class SalesmanInfo {
  final int id;
  final String name;
  final String? username;
  final String? photoUrl;
  final String? phone;
  final String? email;

  SalesmanInfo({
    required this.id,
    required this.name,
    this.username,
    this.photoUrl,
    this.phone,
    this.email,
  });

  factory SalesmanInfo.fromJson(Map<String, dynamic> json) {
    return SalesmanInfo(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      username: json['username'],
      photoUrl: json['photo_url'],
      phone: json['phone'],
      email: json['email'],
    );
  }
}

class RouteSummaryInfo {
  final String? startTime;
  final String? endTime;
  final int totalVisits;
  final double totalDistanceKm;

  RouteSummaryInfo({
    this.startTime,
    this.endTime,
    required this.totalVisits,
    required this.totalDistanceKm,
  });

  factory RouteSummaryInfo.fromJson(Map<String, dynamic> json) {
    return RouteSummaryInfo(
      startTime: json['start_time'],
      endTime: json['end_time'],
      totalVisits: json['total_visits'] ?? 0,
      totalDistanceKm: (json['total_distance_km'] ?? 0).toDouble(),
    );
  }
}

class RouteSummary {
  final int salesmanId;
  final String name;
  final String? photoUrl;
  final int visitCount;
  final double totalDistanceKm;
  final String? startTime;
  final String? endTime;

  RouteSummary({
    required this.salesmanId,
    required this.name,
    this.photoUrl,
    required this.visitCount,
    required this.totalDistanceKm,
    this.startTime,
    this.endTime,
  });

  factory RouteSummary.fromJson(Map<String, dynamic> json) {
    return RouteSummary(
      salesmanId: json['salesman_id'] ?? 0,
      name: json['name'] ?? '',
      photoUrl: json['photo_url'],
      visitCount: json['visit_count'] ?? 0,
      totalDistanceKm: (json['total_distance_km'] ?? 0).toDouble(),
      startTime: json['start_time'],
      endTime: json['end_time'],
    );
  }
}
