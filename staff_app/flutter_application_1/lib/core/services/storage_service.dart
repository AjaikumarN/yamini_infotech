import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../models/user.dart';

/// Local Storage Service
/// 
/// Handles all local data persistence using SharedPreferences
/// For sensitive data (tokens, passwords), consider using flutter_secure_storage
/// 
/// TODO: Replace SharedPreferences with SecureStorage for sensitive data
class StorageService {
  static StorageService? _instance;
  SharedPreferences? _preferences;
  
  StorageService._();
  
  /// Singleton instance
  static StorageService get instance {
    _instance ??= StorageService._();
    return _instance!;
  }
  
  /// Initialize storage (call this in main.dart before runApp)
  Future<void> init() async {
    _preferences = await SharedPreferences.getInstance();
  }
  
  SharedPreferences get _prefs {
    if (_preferences == null) {
      throw Exception('StorageService not initialized. Call init() first.');
    }
    return _preferences!;
  }
  
  // ==================== TOKEN MANAGEMENT ====================
  
  /// Save authentication token
  Future<bool> saveToken(String token) async {
    return await _prefs.setString(AppConstants.STORAGE_TOKEN_KEY, token);
  }
  
  /// Get authentication token
  String? getToken() {
    return _prefs.getString(AppConstants.STORAGE_TOKEN_KEY);
  }
  
  /// Save refresh token
  Future<bool> saveRefreshToken(String token) async {
    return await _prefs.setString(AppConstants.STORAGE_REFRESH_TOKEN_KEY, token);
  }
  
  /// Get refresh token
  String? getRefreshToken() {
    return _prefs.getString(AppConstants.STORAGE_REFRESH_TOKEN_KEY);
  }
  
  /// Remove tokens
  Future<bool> removeTokens() async {
    await _prefs.remove(AppConstants.STORAGE_TOKEN_KEY);
    await _prefs.remove(AppConstants.STORAGE_REFRESH_TOKEN_KEY);
    return true;
  }
  
  // ==================== USER DATA MANAGEMENT ====================
  
  /// Save user data
  Future<bool> saveUser(User user) async {
    final userJson = jsonEncode(user.toJson());
    return await _prefs.setString(AppConstants.STORAGE_USER_DATA_KEY, userJson);
  }
  
  /// Get user data
  User? getUser() {
    final userJson = _prefs.getString(AppConstants.STORAGE_USER_DATA_KEY);
    if (userJson == null) return null;
    
    try {
      final Map<String, dynamic> userData = jsonDecode(userJson);
      return User.fromJson(userData);
    } catch (e) {
      return null;
    }
  }
  
  /// Remove user data
  Future<bool> removeUser() async {
    return await _prefs.remove(AppConstants.STORAGE_USER_DATA_KEY);
  }
  
  // ==================== GENERAL STORAGE ====================
  
  /// Save string value
  Future<bool> setString(String key, String value) async {
    return await _prefs.setString(key, value);
  }
  
  /// Get string value
  String? getString(String key) {
    return _prefs.getString(key);
  }
  
  /// Save int value
  Future<bool> setInt(String key, int value) async {
    return await _prefs.setInt(key, value);
  }
  
  /// Get int value
  int? getInt(String key) {
    return _prefs.getInt(key);
  }
  
  /// Save bool value
  Future<bool> setBool(String key, bool value) async {
    return await _prefs.setBool(key, value);
  }
  
  /// Get bool value
  bool? getBool(String key) {
    return _prefs.getBool(key);
  }
  
  /// Remove specific key
  Future<bool> remove(String key) async {
    return await _prefs.remove(key);
  }
  
  /// Clear all data (use with caution)
  Future<bool> clearAll() async {
    return await _prefs.clear();
  }
  
  /// Check if key exists
  bool containsKey(String key) {
    return _prefs.containsKey(key);
  }
}
