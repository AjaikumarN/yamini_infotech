import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/dio_client.dart';

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

  AttendanceService._();

  static AttendanceService get instance {
    _instance ??= AttendanceService._();
    return _instance!;
  }

  /// Get today's attendance status
  Future<AttendanceResult> getTodayAttendance() async {
    try {
      final response = await DioClient.instance.dio.get(
        ApiConstants.ATTENDANCE_TODAY,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data == null || data == 'null' || (data is String && data.isEmpty)) {
          return AttendanceResult(
            success: true,
            data: AttendanceData.notCheckedIn(),
          );
        }
        
        final json = data is Map<String, dynamic> ? data : null;
        if (json == null) {
          return AttendanceResult(
            success: true,
            data: AttendanceData.notCheckedIn(),
          );
        }
        
        return AttendanceResult(
          success: true,
          data: AttendanceData.fromJson(json),
        );
      } else {
        return AttendanceResult(success: false, message: 'Request failed');
      }
    } on DioException catch (e) {
      if (kDebugMode) debugPrint('❌ getTodayAttendance error: $e');
      return AttendanceResult(
        success: false,
        message: _handleDioException(e),
      );
    } catch (e) {
      if (kDebugMode) debugPrint('❌ getTodayAttendance error: $e');
      return AttendanceResult(
        success: false,
        message: 'An error occurred: $e',
      );
    }
  }

  /// Check-in with photo upload
  /// 
  /// Sends multipart form data via Dio:
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
      if (kDebugMode) debugPrint('📤 ===== CHECK-IN REQUEST =====');
      
      // Verify photo file exists
      if (!await photoFile.exists()) {
        if (kDebugMode) debugPrint('❌ Photo file does not exist: ${photoFile.path}');
        return AttendanceResult(success: false, message: 'Photo file not found');
      }
      
      final photoSize = await photoFile.length();
      if (kDebugMode) debugPrint('📷 Photo size: ${(photoSize / 1024).toStringAsFixed(2)} KB');
      
      final now = DateTime.now();
      
      final formData = FormData.fromMap({
        'photo': await MultipartFile.fromFile(
          photoFile.path,
          filename: 'attendance_${now.millisecondsSinceEpoch}.jpg',
        ),
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'location': location,
        'attendance_status': 'Present',
        'time': now.toIso8601String(),
      });
      
      if (kDebugMode) debugPrint('📍 Location: $latitude, $longitude');
      if (kDebugMode) debugPrint('📍 Address: $location');
      if (kDebugMode) debugPrint('📤 Sending request...');
      
      final response = await DioClient.instance.dio.post(
        ApiConstants.ATTENDANCE_CHECK_IN,
        data: formData,
        options: Options(
          sendTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 60),
        ),
      );
      
      if (kDebugMode) debugPrint('📥 Response status: ${response.statusCode}');
      
      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        final json = response.data is Map<String, dynamic> ? response.data : <String, dynamic>{};
        if (kDebugMode) debugPrint('✅ Check-in successful!');
        return AttendanceResult(
          success: true,
          message: 'Checked in successfully',
          data: AttendanceData.fromJson(json),
        );
      } else {
        if (kDebugMode) debugPrint('❌ Check-in failed: ${response.statusCode}');
        return AttendanceResult(success: false, message: 'Check-in failed');
      }
    } on DioException catch (e) {
      if (kDebugMode) debugPrint('❌ checkIn exception: $e');
      return AttendanceResult(
        success: false,
        message: _handleDioException(e),
      );
    } catch (e) {
      if (kDebugMode) debugPrint('❌ checkIn exception: $e');
      return AttendanceResult(
        success: false,
        message: 'An error occurred: $e',
      );
    }
  }

  /// Check-out (end of day)
  Future<AttendanceResult> checkOut({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final response = await DioClient.instance.dio.post(
        '/api/attendance/check-out',
        data: {
          'latitude': latitude,
          'longitude': longitude,
        },
      );

      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300) {
        if (kDebugMode) debugPrint('✅ Check-out successful');
        return AttendanceResult(
          success: true,
          message: 'Checked out successfully',
        );
      } else {
        if (kDebugMode) debugPrint('❌ Check-out failed: ${response.statusCode}');
        return AttendanceResult(success: false, message: 'Check-out failed');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return AttendanceResult(
          success: true,
          message: 'Tracking stopped',
        );
      }
      if (kDebugMode) debugPrint('❌ checkOut error: $e');
      return AttendanceResult(
        success: true,
        message: 'Tracking stopped',
      );
    } catch (e) {
      if (kDebugMode) debugPrint('❌ checkOut error: $e');
      return AttendanceResult(
        success: true,
        message: 'Tracking stopped',
      );
    }
  }

  /// Handle Dio exceptions
  String _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionError:
      case DioExceptionType.connectionTimeout:
        return 'No internet connection';
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Request timeout. Please try again.';
      case DioExceptionType.badResponse:
        final data = e.response?.data;
        if (data is Map) {
          return data['detail'] ?? data['message'] ?? 'Request failed';
        }
        return 'Request failed: ${e.response?.statusCode}';
      default:
        return 'An error occurred: ${e.message}';
    }
  }
}
