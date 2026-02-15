import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/routing/app_router.dart';
import 'core/services/storage_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/navigation_service.dart';
import 'core/services/dio_client.dart';
import 'core/services/offline_queue.dart';
import 'core/theme/app_theme.dart';

/// Main entry point of the Staff ERP application
/// 
/// Initialization sequence:
/// 1. Initialize Flutter bindings
/// 2. Initialize Firebase (for FCM) - OPTIONAL, app works without it
/// 3. Set up background message handler
/// 4. Initialize StorageService (for local data persistence)
/// 5. Initialize AuthService (check existing session, auto-login)
/// 6. Initialize NotificationService (FCM, permissions, handlers) - OPTIONAL
/// 7. Launch app with GoRouter for navigation
void main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Global error handling for release builds
  FlutterError.onError = (FlutterErrorDetails details) {
    if (kDebugMode) {
      // In debug mode, print errors to console
      FlutterError.presentError(details);
    } else {
      // In release mode, silently log (or send to crash reporting service)
      // TODO: Integrate with Firebase Crashlytics or Sentry
    }
  };
  
  // Initialize Firebase (OPTIONAL - app works without it)
  bool firebaseInitialized = false;
  try {
    await Firebase.initializeApp();
    
    // Set up background message handler (must be top-level function)
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    
    firebaseInitialized = true;
    if (kDebugMode) debugPrint('✅ Firebase initialized successfully');
  } catch (e) {
    if (kDebugMode) {
      debugPrint('⚠️ Firebase not configured - Notifications disabled');
      debugPrint('   To enable: See FIREBASE_SETUP.md');
      debugPrint('   Error: $e');
    }
  }
  
  // Initialize services
  await _initializeServices(firebaseEnabled: firebaseInitialized);
  
  // Run the app
  runApp(const StaffERPApp());
}

/// Initialize all core services before app starts
Future<void> _initializeServices({bool firebaseEnabled = false}) async {
  try {
    // 1. Initialize storage service (required for auth service)
    await StorageService.instance.init();
    if (kDebugMode) debugPrint('✅ StorageService initialized');
    
    // 1.5. Initialize Dio HTTP client (uses storage for auth token)
    DioClient.instance;
    if (kDebugMode) debugPrint('✅ DioClient initialized');
    
    // 1.6. Initialize offline queue (auto-syncs when connectivity returns)
    await OfflineQueue.instance.init();
    if (kDebugMode) debugPrint('✅ OfflineQueue initialized');
    
    // 2. Initialize auth service (checks for existing session, auto-login)
    await AuthService.instance.init();
    if (kDebugMode) debugPrint('✅ AuthService initialized');
    
    // 3. Initialize notification service (FCM) - only if Firebase is available
    if (firebaseEnabled) {
      await NotificationService.instance.initialize();
      if (kDebugMode) debugPrint('✅ NotificationService initialized');
    } else {
      if (kDebugMode) debugPrint('⚠️ NotificationService skipped - Firebase not available');
    }
    
  } catch (e) {
    // Handle initialization errors
    if (kDebugMode) debugPrint('❌ Service initialization error: $e');
    // You may want to show an error screen or retry logic here
  }
}

/// Root application widget
class StaffERPApp extends StatelessWidget {
  const StaffERPApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      // App configuration
      title: 'Yamini Infotech',
      debugShowCheckedModeBanner: false,
      
      // Theme configuration using centralized AppTheme
      theme: AppTheme.lightTheme,
      
      // Router configuration using GoRouter with NavigationService
      routerConfig: AppRouter.router,
      
      // Global navigator key for deep linking
      // This allows NotificationService to navigate without BuildContext
      builder: (context, child) {
        return Navigator(
          key: NavigationService.navigatorKey,
          onGenerateRoute: (_) => MaterialPageRoute(
            builder: (_) => child ?? const SizedBox.shrink(),
          ),
        );
      },
    );
  }
}
