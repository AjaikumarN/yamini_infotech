import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Navigation Service
/// 
/// Provides global navigation capabilities without BuildContext
/// Used by NotificationService for deep linking
class NavigationService {
  static final NavigationService _instance = NavigationService._();
  static NavigationService get instance => _instance;
  
  NavigationService._();
  
  /// Global navigator key
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  
  /// Get current context
  BuildContext? get context => navigatorKey.currentContext;
  
  /// Navigate to route using GoRouter
  void navigateTo(String route) {
    final ctx = context;
    if (ctx != null) {
      ctx.go(route);
    }
  }
  
  /// Push route using GoRouter
  void push(String route) {
    final ctx = context;
    if (ctx != null) {
      ctx.push(route);
    }
  }
  
  /// Pop current route
  void pop() {
    final ctx = context;
    if (ctx != null) {
      ctx.pop();
    }
  }
  
  /// Replace current route
  void replace(String route) {
    final ctx = context;
    if (ctx != null) {
      ctx.replace(route);
    }
  }
}
