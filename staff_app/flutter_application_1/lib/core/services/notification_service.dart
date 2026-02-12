import 'dart:async';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../models/app_notification.dart';
import 'secure_storage_service.dart';
import 'storage_service.dart';
import 'auth_service.dart';
import 'navigation_service.dart';

/// Firebase Cloud Messaging Service
/// 
/// Enterprise-grade push notification handling:
/// - FCM token registration with backend
/// - Foreground, background, and terminated state handling
/// - Role-based notification routing
/// - Deep linking support
/// - Notification persistence
/// 
/// NOTIFICATION FLOW:
/// 1. Backend event triggers notification
/// 2. Backend creates notification record in database
/// 3. Backend sends FCM push with route metadata
/// 4. App receives notification
/// 5. User taps notification
/// 6. App navigates to route (if logged in) or saves for post-login
class NotificationService extends ChangeNotifier {
  static NotificationService? _instance;
  
  // Firebase messaging - lazy initialized to avoid crash when Firebase not configured
  FirebaseMessaging? _messaging;
  bool _firebaseAvailable = false;
  
  final SecureStorageService _secureStorage = SecureStorageService.instance;
  final StorageService _storage = StorageService.instance;
  
  String? _fcmToken;
  String? _pendingRoute; // Saved route for post-login navigation
  final List<AppNotification> _notifications = [];
  
  NotificationService._();
  
  /// Singleton instance
  static NotificationService get instance {
    _instance ??= NotificationService._();
    return _instance!;
  }
  
  /// Check if Firebase is available
  bool get isFirebaseAvailable => _firebaseAvailable;
  
  // ==================== GETTERS ====================
  
  String? get fcmToken => _fcmToken;
  String? get pendingRoute => _pendingRoute;
  List<AppNotification> get notifications => List.unmodifiable(_notifications);
  int get unreadCount => _notifications.where((n) => !n.isRead).length;
  
  // ==================== INITIALIZATION ====================
  
  /// Initialize FCM and request permissions
  /// 
  /// Call this in main.dart after Firebase.initializeApp()
  Future<void> initialize() async {
    try {
      // Initialize Firebase Messaging
      _messaging = FirebaseMessaging.instance;
      _firebaseAvailable = true;
      
      // Request notification permissions (iOS)
      final settings = await _messaging!.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );
      
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('✅ Notification permission granted');
      } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
        debugPrint('⚠️ Notification permission granted (provisional)');
      } else {
        debugPrint('❌ Notification permission denied');
        return;
      }
      
      // Get FCM token
      _fcmToken = await _messaging!.getToken();
      
      if (_fcmToken != null) {
        debugPrint('🔔 FCM Token: $_fcmToken');
        await _secureStorage.saveFcmToken(_fcmToken!);
        
        // Register token with backend (if user is logged in)
        final user = AuthService.instance.currentUser;
        if (user != null) {
          await registerTokenWithBackend(_fcmToken!);
        }
      }
      
      // Listen for token refresh
      _messaging!.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        _secureStorage.saveFcmToken(newToken);
        registerTokenWithBackend(newToken);
      });
      
      // Set up message handlers
      _setupMessageHandlers();
      
      debugPrint('✅ FCM initialized successfully');
    } catch (e) {
      _firebaseAvailable = false;
      debugPrint('❌ FCM initialization error: $e');
    }
  }
  
  /// Set up handlers for different notification states
  void _setupMessageHandlers() {
    // Foreground messages (app is open)
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Background messages (app in background, notification tapped)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
    
    // Check for initial notification (app opened from terminated state)
    _messaging?.getInitialMessage().then((message) {
      if (message != null) {
        _handleNotificationTap(message);
      }
    });
  }
  
  // ==================== MESSAGE HANDLERS ====================
  
  /// Handle notification when app is in FOREGROUND
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📨 Foreground notification received');
    debugPrint('Title: ${message.notification?.title}');
    debugPrint('Body: ${message.notification?.body}');
    debugPrint('Data: ${message.data}');
    
    // Convert to AppNotification
    final notification = AppNotification.fromFcmPayload(message.data);
    
    // Add to in-memory list
    _notifications.insert(0, notification);
    notifyListeners();
    
    // Show in-app notification banner (optional)
    // You can use a package like 'overlay_support' or custom implementation
  }
  
  /// Handle notification TAP (background or terminated)
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('👆 Notification tapped');
    debugPrint('Data: ${message.data}');
    
    final route = message.data['route'] as String?;
    
    if (route == null || route.isEmpty) {
      debugPrint('⚠️ No route in notification payload');
      return;
    }
    
    // Check if user is logged in
    final isLoggedIn = AuthService.instance.isAuthenticated;
    
    if (isLoggedIn) {
      // Navigate immediately
      _navigateToRoute(route);
    } else {
      // Save route for post-login navigation
      _pendingRoute = route;
      debugPrint('💾 Route saved for post-login navigation: $route');
    }
  }
  
  /// Navigate to route using GoRouter
  void _navigateToRoute(String route) {
    debugPrint('🧭 Navigating to: $route');
    NavigationService.instance.navigateTo(route);
  }
  
  // ==================== BACKEND INTEGRATION ====================
  
  /// Register FCM token with backend
  /// 
  /// Backend stores token for sending targeted notifications
  Future<void> registerTokenWithBackend(String token) async {
    try {
      final user = AuthService.instance.currentUser;
      if (user == null) {
        debugPrint('⚠️ Cannot register FCM token: user not logged in');
        return;
      }
      
      final accessToken = await _secureStorage.getAccessToken() ?? 
                         _storage.getToken();
      
      if (accessToken == null) {
        debugPrint('⚠️ Cannot register FCM token: no access token');
        return;
      }
      
      // Call backend API to register FCM token
      final uri = Uri.parse('${ApiConstants.BASE_URL}/api/notifications/register-token');
      
      final response = await http.post(
        uri,
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'fcm_token': token,
          'user_id': user.id,
          'role': user.role.value,
        }),
      ).timeout(ApiConstants.TIMEOUT_DURATION);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('✅ FCM token registered with backend');
      } else {
        debugPrint('❌ Failed to register FCM token: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('❌ Error registering FCM token: $e');
    }
  }
  
  /// Fetch notifications from backend
  Future<List<AppNotification>> fetchNotifications() async {
    try {
      final accessToken = await _secureStorage.getAccessToken() ?? 
                         _storage.getToken();
      
      if (accessToken == null) {
        debugPrint('⚠️ Cannot fetch notifications: no access token');
        return [];
      }
      
      final uri = Uri.parse('${ApiConstants.BASE_URL}${ApiConstants.NOTIFICATIONS}');
      
      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Accept': 'application/json',
        },
      ).timeout(ApiConstants.TIMEOUT_DURATION);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List<dynamic> data = jsonDecode(response.body);
        final notifications = data
            .map((json) => AppNotification.fromJson(json))
            .toList();
        
        _notifications.clear();
        _notifications.addAll(notifications);
        notifyListeners();
        
        debugPrint('✅ Fetched ${notifications.length} notifications');
        return notifications;
      } else {
        debugPrint('❌ Failed to fetch notifications: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      debugPrint('❌ Error fetching notifications: $e');
      return [];
    }
  }
  
  /// Mark notification as read
  Future<bool> markAsRead(int notificationId) async {
    try {
      final accessToken = await _secureStorage.getAccessToken() ?? 
                         _storage.getToken();
      
      if (accessToken == null) return false;
      
      final uri = Uri.parse('${ApiConstants.BASE_URL}${ApiConstants.NOTIFICATIONS}/$notificationId/read');
      
      final response = await http.patch(
        uri,
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Accept': 'application/json',
        },
      ).timeout(ApiConstants.TIMEOUT_DURATION);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Update local notification
        final index = _notifications.indexWhere((n) => n.id == notificationId);
        if (index != -1) {
          _notifications[index] = _notifications[index].copyWith(isRead: true);
          notifyListeners();
        }
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('❌ Error marking notification as read: $e');
      return false;
    }
  }
  
  // ==================== PENDING ROUTE MANAGEMENT ====================
  
  /// Clear pending route after navigation
  void clearPendingRoute() {
    _pendingRoute = null;
  }
  
  /// Check and navigate to pending route (call after login)
  String? getPendingRouteAndClear() {
    final route = _pendingRoute;
    _pendingRoute = null;
    return route;
  }
}

/// Background message handler (must be top-level function)
/// 
/// This function handles notifications when app is TERMINATED
/// Called by Firebase before app starts
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📨 Background notification received (terminated state)');
  debugPrint('Title: ${message.notification?.title}');
  debugPrint('Data: ${message.data}');
  
  // Note: You can't navigate here, only process data
  // Navigation happens when user taps notification
}
