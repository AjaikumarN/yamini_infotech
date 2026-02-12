import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../models/user_role.dart';
import '../constants/route_constants.dart';

/// Route Guard / Middleware
/// 
/// Handles authorization checks before allowing navigation to protected routes
/// - Checks if user is authenticated
/// - Validates user role for role-specific routes
/// - Redirects to login or unauthorized page as needed
class RouteGuard {
  final AuthService _authService = AuthService.instance;
  
  /// Check if route is accessible based on authentication and role
  /// 
  /// Returns null if access is granted, or a redirect path if denied
  String? canAccess(BuildContext context, GoRouterState state) {
    final isAuthenticated = _authService.isAuthenticated;
    final currentUser = _authService.currentUser;
    final path = state.uri.path;
    
    // Public routes (accessible without authentication)
    final publicRoutes = [
      RouteConstants.LOGIN,
      RouteConstants.SPLASH,
    ];
    
    // If route is public, allow access
    if (publicRoutes.contains(path)) {
      // If already logged in and trying to access login, redirect to role home
      if (isAuthenticated && path == RouteConstants.LOGIN) {
        return _getRoleHomePath(currentUser!.role);
      }
      return null;
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      return RouteConstants.LOGIN;
    }
    
    // Check role-based access
    if (currentUser != null) {
      final userRole = currentUser.role;
      
      // Admin routes - only accessible by Admin
      if (path.startsWith('/admin')) {
        if (userRole != UserRole.admin) {
          return RouteConstants.UNAUTHORIZED;
        }
      }
      
      // Reception routes - only accessible by Reception
      else if (path.startsWith('/reception')) {
        if (userRole != UserRole.reception) {
          return RouteConstants.UNAUTHORIZED;
        }
      }
      
      // Salesman routes - only accessible by Salesman
      else if (path.startsWith('/salesman')) {
        if (userRole != UserRole.salesman) {
          return RouteConstants.UNAUTHORIZED;
        }
      }
      
      // Service Engineer routes - only accessible by Service Engineer
      else if (path.startsWith('/service-engineer') || path.startsWith('/service')) {
        if (userRole != UserRole.serviceEngineer) {
          return RouteConstants.UNAUTHORIZED;
        }
      }
      
      // Shared routes are accessible by all authenticated users
      // (profile, notifications, settings, help)
    }
    
    // Access granted
    return null;
  }
  
  /// Get home path based on user role
  String _getRoleHomePath(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return RouteConstants.ADMIN_DASHBOARD;
      case UserRole.reception:
        return RouteConstants.RECEPTION_DASHBOARD;
      case UserRole.salesman:
        return RouteConstants.SALESMAN_DASHBOARD;
      case UserRole.serviceEngineer:
        return RouteConstants.SERVICE_ENGINEER_DASHBOARD;
    }
  }
  
  /// Determine initial route based on authentication status
  String getInitialRoute() {
    if (_authService.isAuthenticated && _authService.currentUser != null) {
      return _getRoleHomePath(_authService.currentUser!.role);
    }
    return RouteConstants.SPLASH;
  }
}
