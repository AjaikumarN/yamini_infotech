import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/storage_service.dart';

/// Attendance Data Model
class AttendanceData {
  final int? id;
  final int? employeeId;
  final String? attendanceDate;
  final String? time;
  final String? status;
  final String? location;
  final double? latitude;
  final double? longitude;
  final String? photoPath;
  final bool isCheckedIn;
  final bool isCheckedOut;

  AttendanceData({
    this.id,
    this.employeeId,
    this.attendanceDate,
    this.time,
    this.status,
    this.location,
    this.latitude,
    this.longitude,
    this.photoPath,
    this.isCheckedIn = false,
    this.isCheckedOut = false,
  });

  factory AttendanceData.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return AttendanceData(isCheckedIn: false);
    }
    return AttendanceData(
      id: json['id'],
      employeeId: json['employee_id'],
      attendanceDate: json['attendance_date'],
      time: json['time'],
      status: json['status'],
      location: json['location'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      photoPath: json['photo_path'],
      isCheckedIn: json['id'] != null,
      isCheckedOut: json['check_out_time'] != null,
    );
  }

  factory AttendanceData.notCheckedIn() {
    return AttendanceData(isCheckedIn: false);
  }
}

/// Attendance Service Result
class AttendanceResult {
  final bool success;
  final String? message;
  final AttendanceData? data;

  AttendanceResult({
    required this.success,
    this.message,
    this.data,
  });
}

/// Attendance Service
/// 
/// Handles all attendance-related API calls:
/// - Check-in with photo upload (multipart)
/// - Check-out
/// - Get today's status
class AttendanceService {
  static AttendanceService? _instance;
  final StorageService _storage = StorageService.instance;

  AttendanceService._();

  static AttendanceService get instance {
    _instance ??= AttendanceService._();
    return _instance!;
  }

  /// Get authorization headers
  Map<String, String> _getAuthHeaders() {
    final token = _storage.getToken();
    return {
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
    };
  }

  /// Get today's attendance status
  Future<AttendanceResult> getTodayAttendance() async {
    try {
      final uri = Uri.parse('${ApiConstants.BASE_URL}${ApiConstants.ATTENDANCE_TODAY}');
      
      final response = await http.get(
        uri,
        headers: _getAuthHeaders(),
      ).timeout(ApiConstants.TIMEOUT_DURATION);

      if (response.statusCode == 200) {
        final body = response.body;
        if (body.isEmpty || body == 'null') {
          return AttendanceResult(
            success: true,
            data: AttendanceData.notCheckedIn(),
          );
        }
        
        final json = jsonDecode(body);
        if (json == null) {
          return AttendanceResult(
            success: true,
            data: AttendanceData.notCheckedIn(),
          );
        }
        
        return AttendanceResult(
          success: true,
          data: AttendanceData.fromJson(json as Map<String, dynamic>),
        );
      } else {
        final error = _parseError(response);
        return AttendanceResult(success: false, message: error);
      }
    } catch (e) {
      debugPrint('❌ getTodayAttendance error: $e');
      return AttendanceResult(
        success: false,
        message: _handleException(e),
      );
    }
  }

  /// Check-in with photo upload
  /// 
  /// Sends multipart form data:
  /// - photo: File (required)
  /// - latitude: double
  /// - longitude: double
  /// - location: string (address)
  /// - attendance_status: string
  /// - time: string (ISO format)
  Future<AttendanceResult> checkIn({
    required File photoFile,
    required double latitude,
    required double longitude,
    required String location,
  }) async {
    try {
      final uri = Uri.parse('${ApiConstants.BASE_URL}${ApiConstants.ATTENDANCE_CHECK_IN}');
      
      debugPrint('📤 ===== CHECK-IN REQUEST =====');
      debugPrint('📤 URL: $uri');
      
      // Verify photo file exists
      if (!await photoFile.exists()) {
        debugPrint('❌ Photo file does not exist: ${photoFile.path}');
        return AttendanceResult(success: false, message: 'Photo file not found');
      }
      
      final photoSize = await photoFile.length();
      debugPrint('📷 Photo file: ${photoFile.path}');
      debugPrint('📷 Photo size: ${(photoSize / 1024).toStringAsFixed(2)} KB');
      
      // Create multipart request
      final request = http.MultipartRequest('POST', uri);
      
      // Add auth header
      final token = _storage.getToken();
      if (token == null || token.isEmpty) {
        debugPrint('❌ No auth token found');
        return AttendanceResult(success: false, message: 'Not authenticated');
      }
      request.headers['Authorization'] = 'Bearer $token';
      
      // Add photo file
      request.files.add(await http.MultipartFile.fromPath(
        'photo',
        photoFile.path,
      ));
      
      // Add form fields
      final now = DateTime.now();
      request.fields['latitude'] = latitude.toString();
      request.fields['longitude'] = longitude.toString();
      request.fields['location'] = location;
      request.fields['attendance_status'] = 'Present';
      request.fields['time'] = now.toIso8601String();
      
      debugPrint('📍 Location: $latitude, $longitude');
      debugPrint('📍 Address: $location');
      debugPrint('🕐 Time: ${now.toIso8601String()}');
      debugPrint('📤 Sending request...');
      
      // Send request
      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 60), // Longer timeout for upload
      );
      
      final response = await http.Response.fromStream(streamedResponse);
      
      debugPrint('📥 Response status: ${response.statusCode}');
      debugPrint('📥 Response body: ${response.body}');
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        debugPrint('✅ Check-in successful!');
        return AttendanceResult(
          success: true,
          message: 'Checked in successfully',
          data: AttendanceData.fromJson(json),
        );
      } else {
        final error = _parseError(response);
        debugPrint('❌ Check-in failed: $error');
        return AttendanceResult(success: false, message: error);
      }
    } catch (e) {
      debugPrint('❌ checkIn exception: $e');
      return AttendanceResult(
        success: false,
        message: _handleException(e),
      );
    }
  }

  /// Check-out (end of day)
  /// 
  /// Currently the backend doesn't have a dedicated check-out endpoint for attendance.
  /// The tracking system has visit check-out, but attendance is a single check-in per day.
  /// This is a placeholder for when backend adds check-out support.
  Future<AttendanceResult> checkOut({
    required double latitude,
    required double longitude,
  }) async {
    try {
      // For now, we'll use the tracking check-out if there's an active visit
      // or return success as attendance doesn't require check-out
      final uri = Uri.parse('${ApiConstants.BASE_URL}/api/attendance/check-out');
      
      final response = await http.post(
        uri,
        headers: {
          ..._getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'latitude': latitude,
          'longitude': longitude,
        }),
      ).timeout(ApiConstants.TIMEOUT_DURATION);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('✅ Check-out successful');
        return AttendanceResult(
          success: true,
          message: 'Checked out successfully',
        );
      } else if (response.statusCode == 404) {
        // If endpoint doesn't exist, just mark as success locally
        // The app will stop tracking
        return AttendanceResult(
          success: true,
          message: 'Tracking stopped',
        );
      } else {
        final error = _parseError(response);
        debugPrint('❌ Check-out failed: $error');
        return AttendanceResult(success: false, message: error);
      }
    } catch (e) {
      debugPrint('❌ checkOut error: $e');
      // For attendance, check-out is optional - just stop tracking
      return AttendanceResult(
        success: true,
        message: 'Tracking stopped',
      );
    }
  }

  /// Parse error from response
  String _parseError(http.Response response) {
    try {
      final json = jsonDecode(response.body);
      return json['detail'] ?? json['message'] ?? 'Request failed';
    } catch (_) {
      return 'Request failed: ${response.reasonPhrase}';
    }
  }

  /// Handle exceptions
  String _handleException(dynamic e) {
    if (e.toString().contains('SocketException')) {
      return 'No internet connection';
    } else if (e.toString().contains('TimeoutException')) {
      return 'Request timeout. Please try again.';
    }
    return 'An error occurred: ${e.toString()}';
  }
}
