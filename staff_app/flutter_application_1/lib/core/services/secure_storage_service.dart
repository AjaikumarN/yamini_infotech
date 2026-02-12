import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart';
import 'dart:convert';
import '../models/user.dart';

/// Secure Storage Service
/// 
/// Enterprise-grade secure storage for sensitive data using flutter_secure_storage
/// - Stores tokens in device keychain (iOS) / Keystore (Android)
/// - All data encrypted at rest
/// - Used for "Keep Me Logged In" functionality
/// 
/// SECURITY:
/// - iOS: Data stored in Keychain
/// - Android: Data stored in EncryptedSharedPreferences (API 23+) or AES encryption
/// - Data survives app uninstall (configurable)
class SecureStorageService {
  static SecureStorageService? _instance;
  
  late final FlutterSecureStorage _storage;
  
  // Storage keys
  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserData = 'user_data';
  static const String _keyKeepLoggedIn = 'keep_logged_in';
  static const String _keyFcmToken = 'fcm_token';
  
  SecureStorageService._() {
    _initStorage();
  }
  
  /// Singleton instance
  static SecureStorageService get instance {
    _instance ??= SecureStorageService._();
    return _instance!;
  }
  
  /// Initialize secure storage with platform-specific options
  void _initStorage() {
    const androidOptions = AndroidOptions(
      encryptedSharedPreferences: true,
      // Set to false if you want data to persist after uninstall
      resetOnError: true,
    );
    
    const iosOptions = IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
      // Set to false if you want data to persist after uninstall
      // accountName: 'YaminiInfotech',
    );
    
    _storage = const FlutterSecureStorage(
      aOptions: androidOptions,
      iOptions: iosOptions,
    );
  }
  
  // ==================== TOKEN MANAGEMENT ====================
  
  /// Save access token securely
  Future<void> saveAccessToken(String token) async {
    try {
      await _storage.write(key: _keyAccessToken, value: token);
      debugPrint('🔐 Access token saved securely');
    } catch (e) {
      debugPrint('❌ Error saving access token: $e');
      rethrow;
    }
  }
  
  /// Get access token
  Future<String?> getAccessToken() async {
    try {
      return await _storage.read(key: _keyAccessToken);
    } catch (e) {
      debugPrint('❌ Error reading access token: $e');
      return null;
    }
  }
  
  /// Save refresh token securely
  Future<void> saveRefreshToken(String token) async {
    try {
      await _storage.write(key: _keyRefreshToken, value: token);
      debugPrint('🔐 Refresh token saved securely');
    } catch (e) {
      debugPrint('❌ Error saving refresh token: $e');
      rethrow;
    }
  }
  
  /// Get refresh token
  Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _keyRefreshToken);
    } catch (e) {
      debugPrint('❌ Error reading refresh token: $e');
      return null;
    }
  }
  
  /// Delete all tokens
  Future<void> deleteTokens() async {
    try {
      await _storage.delete(key: _keyAccessToken);
      await _storage.delete(key: _keyRefreshToken);
      debugPrint('🗑️ Tokens deleted');
    } catch (e) {
      debugPrint('❌ Error deleting tokens: $e');
      rethrow;
    }
  }
  
  // ==================== USER DATA MANAGEMENT ====================
  
  /// Save user data securely
  Future<void> saveUser(User user) async {
    try {
      final userJson = jsonEncode(user.toJson());
      await _storage.write(key: _keyUserData, value: userJson);
      debugPrint('🔐 User data saved securely');
    } catch (e) {
      debugPrint('❌ Error saving user data: $e');
      rethrow;
    }
  }
  
  /// Get user data
  Future<User?> getUser() async {
    try {
      final userJson = await _storage.read(key: _keyUserData);
      if (userJson == null) return null;
      
      final Map<String, dynamic> userData = jsonDecode(userJson);
      return User.fromJson(userData);
    } catch (e) {
      debugPrint('❌ Error reading user data: $e');
      return null;
    }
  }
  
  /// Delete user data
  Future<void> deleteUser() async {
    try {
      await _storage.delete(key: _keyUserData);
      debugPrint('🗑️ User data deleted');
    } catch (e) {
      debugPrint('❌ Error deleting user data: $e');
      rethrow;
    }
  }
  
  // ==================== KEEP ME LOGGED IN ====================
  
  /// Save "Keep Me Logged In" preference
  Future<void> setKeepLoggedIn(bool value) async {
    try {
      await _storage.write(key: _keyKeepLoggedIn, value: value.toString());
      debugPrint('🔐 Keep logged in: $value');
    } catch (e) {
      debugPrint('❌ Error saving keep logged in: $e');
      rethrow;
    }
  }
  
  /// Get "Keep Me Logged In" preference
  Future<bool> getKeepLoggedIn() async {
    try {
      final value = await _storage.read(key: _keyKeepLoggedIn);
      return value == 'true';
    } catch (e) {
      debugPrint('❌ Error reading keep logged in: $e');
      return false;
    }
  }
  
  // ==================== FCM TOKEN MANAGEMENT ====================
  
  /// Save FCM token
  Future<void> saveFcmToken(String token) async {
    try {
      await _storage.write(key: _keyFcmToken, value: token);
      debugPrint('🔐 FCM token saved securely');
    } catch (e) {
      debugPrint('❌ Error saving FCM token: $e');
      rethrow;
    }
  }
  
  /// Get FCM token
  Future<String?> getFcmToken() async {
    try {
      return await _storage.read(key: _keyFcmToken);
    } catch (e) {
      debugPrint('❌ Error reading FCM token: $e');
      return null;
    }
  }
  
  // ==================== COMPLETE LOGOUT ====================
  
  /// Clear ALL secure data (complete logout)
  /// 
  /// Use this for logout to ensure no residual data remains
  Future<void> clearAll() async {
    try {
      await _storage.deleteAll();
      debugPrint('🗑️ All secure data cleared');
    } catch (e) {
      debugPrint('❌ Error clearing all data: $e');
      rethrow;
    }
  }
  
  // ==================== UTILITY ====================
  
  /// Check if user has valid session (tokens exist)
  Future<bool> hasValidSession() async {
    final accessToken = await getAccessToken();
    final user = await getUser();
    final keepLoggedIn = await getKeepLoggedIn();
    
    return accessToken != null && user != null && keepLoggedIn;
  }
  
  /// Get all keys (for debugging only)
  Future<Map<String, String>> getAllSecureData() async {
    if (kDebugMode) {
      return await _storage.readAll();
    }
    throw Exception('getAllSecureData() only available in debug mode');
  }
}
