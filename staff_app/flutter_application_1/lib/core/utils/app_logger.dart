import 'package:flutter/foundation.dart';

/// Production-safe logger
/// 
/// All log output is suppressed in release builds via kDebugMode check.
/// This prevents leaking tokens, user data, or internal URLs in production.
class AppLogger {
  /// Log a debug message (suppressed in release builds)
  static void debug(String message) {
    if (kDebugMode) {
      debugPrint(message);
    }
  }

  /// Log an error message (suppressed in release builds)
  static void error(String message) {
    if (kDebugMode) {
      debugPrint('❌ $message');
    }
  }

  /// Log a warning message (suppressed in release builds)
  static void warn(String message) {
    if (kDebugMode) {
      debugPrint('⚠️ $message');
    }
  }

  /// Log a success message (suppressed in release builds)
  static void success(String message) {
    if (kDebugMode) {
      debugPrint('✅ $message');
    }
  }
}
