import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../constants/route_constants.dart';
import 'route_guard.dart';

// Import screens
import '../../features/auth/screens/login_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/auth/screens/unauthorized_screen.dart';

import '../../features/admin/screens/admin_dashboard_screen.dart';
import '../../features/admin/screens/live_location_screen.dart';
import '../../features/admin/screens/attendance_overview_screen.dart';
import '../../features/admin/screens/field_overview_screen.dart';
import '../../features/reception/screens/reception_dashboard_screen.dart';
import '../../features/reception/screens/create_request_screen.dart';
import '../../features/reception/screens/enquiries_list_screen.dart';
import '../../features/reception/screens/service_requests_list_screen.dart';
import '../../features/reception/screens/assignment_screen.dart';
import '../../features/reception/screens/status_tracking_screen.dart';
import '../../features/salesman/screens/salesman_dashboard_screen.dart';
import '../../features/salesman/screens/enquiries_screen.dart';
import '../../features/salesman/screens/simple_attendance_screen.dart';
import '../../features/salesman/screens/followups_screen.dart';
import '../../features/salesman/screens/orders_screen.dart';
import '../../features/salesman/screens/daily_report_screen.dart';
import '../../features/salesman/screens/customer_visit_screen.dart';
import '../../features/salesman/screens/visit_overview_screen.dart';
import '../../features/service/screens/service_dashboard_screen.dart';
import '../../features/service_engineer/screens/engineer_dashboard_screen.dart';
import '../../features/service_engineer/screens/jobs_list_screen.dart';
import '../../features/service_engineer/screens/job_route_screen.dart';
import '../../features/service_engineer/screens/job_details_wrapper.dart';

import '../../features/shared/screens/profile_screen.dart';
import '../../features/shared/screens/notifications_screen.dart';

/// App Router Configuration
///
/// Central routing configuration using go_router package
/// - Defines all application routes
/// - Implements route guards for authentication and authorization
/// - Supports deep linking
/// - Handles navigation transitions
class AppRouter {
  static final RouteGuard _routeGuard = RouteGuard();

  /// GoRouter instance
  static final GoRouter router = GoRouter(
    initialLocation: RouteConstants.SPLASH,
    debugLogDiagnostics: true, // Set to false in production
    // Global redirect logic for authentication/authorization
    redirect: (BuildContext context, GoRouterState state) {
      return _routeGuard.canAccess(context, state);
    },

    routes: [
      // ==================== AUTH ROUTES ====================
      GoRoute(
        path: RouteConstants.SPLASH,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),

      GoRoute(
        path: RouteConstants.LOGIN,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      GoRoute(
        path: RouteConstants.UNAUTHORIZED,
        name: 'unauthorized',
        builder: (context, state) => const UnauthorizedScreen(),
      ),

      // ==================== ADMIN ROUTES ====================
      GoRoute(
        path: RouteConstants.ADMIN_DASHBOARD,
        name: 'admin_dashboard',
        builder: (context, state) => const AdminDashboardScreen(),
      ),

      GoRoute(
        path: RouteConstants.ADMIN_LIVE_LOCATION,
        name: 'admin_live_location',
        builder: (context, state) => const LiveLocationScreen(),
      ),

      GoRoute(
        path: RouteConstants.ADMIN_ATTENDANCE,
        name: 'admin_attendance',
        builder: (context, state) => const AttendanceOverviewScreen(),
      ),

      GoRoute(
        path: RouteConstants.ADMIN_FIELD_OVERVIEW,
        name: 'admin_field_overview',
        builder: (context, state) => const FieldOverviewScreen(),
      ),

      // TODO: Add more admin routes
      // GoRoute(
      //   path: RouteConstants.ADMIN_USERS,
      //   name: 'admin_users',
      //   builder: (context, state) => const AdminUsersScreen(),
      // ),

      // ==================== RECEPTION ROUTES ====================
      GoRoute(
        path: RouteConstants.RECEPTION_DASHBOARD,
        name: 'reception_dashboard',
        builder: (context, state) => const ReceptionDashboardScreen(),
      ),

      GoRoute(
        path: RouteConstants.RECEPTION_CREATE_REQUEST,
        name: 'reception_create_request',
        builder: (context, state) => const CreateRequestScreen(),
      ),

      GoRoute(
        path: RouteConstants.RECEPTION_ENQUIRIES,
        name: 'reception_enquiries',
        builder: (context, state) => const EnquiriesListScreen(),
      ),

      GoRoute(
        path: RouteConstants.RECEPTION_SERVICE_REQUESTS,
        name: 'reception_service_requests',
        builder: (context, state) => const ServiceRequestsListScreen(),
      ),

      GoRoute(
        path: RouteConstants.RECEPTION_ASSIGN,
        name: 'reception_assign',
        builder: (context, state) {
          final data = state.extra as Map<String, dynamic>?;
          return AssignmentScreen(data: data);
        },
      ),

      GoRoute(
        path: RouteConstants.RECEPTION_TRACKING,
        name: 'reception_tracking',
        builder: (context, state) => const StatusTrackingScreen(),
      ),

      GoRoute(
        path: RouteConstants.RECEPTION_ATTENDANCE,
        name: 'reception_attendance',
        builder: (context, state) => const SimpleAttendanceScreen(),
      ),

      // ==================== SALESMAN ROUTES ====================
      GoRoute(
        path: RouteConstants.SALESMAN_DASHBOARD,
        name: 'salesman_dashboard',
        builder: (context, state) => const SalesmanDashboardScreen(),
      ),

      GoRoute(
        path: RouteConstants.SALESMAN_ENQUIRIES,
        name: 'salesman_enquiries',
        builder: (context, state) => const EnquiriesScreen(),
      ),

      GoRoute(
        path: RouteConstants.SALESMAN_ATTENDANCE,
        name: 'salesman_attendance',
        builder: (context, state) => const SimpleAttendanceScreen(),
      ),

      GoRoute(
        path: RouteConstants.SALESMAN_CUSTOMER_VISIT,
        name: 'salesman_customer_visit',
        builder: (context, state) => const CustomerVisitScreen(),
      ),

      GoRoute(
        path: RouteConstants.SALESMAN_FOLLOWUPS,
        name: 'salesman_followups',
        builder: (context, state) => const FollowupsScreen(),
      ),

      GoRoute(
        path: RouteConstants.SALESMAN_ORDERS,
        name: 'salesman_orders',
        builder: (context, state) => const OrdersScreen(),
      ),

      GoRoute(
        path: RouteConstants.SALESMAN_DAILY_REPORT,
        name: 'salesman_daily_report',
        builder: (context, state) => const DailyReportScreen(),
      ),

      // Location sharing screen removed — tracking is automatic on attendance
      
      GoRoute(
        path: RouteConstants.SALESMAN_VISIT_OVERVIEW,
        name: 'salesman_visit_overview',
        builder: (context, state) => const VisitOverviewScreen(),
      ),

      // TODO: Add more salesman routes
      // GoRoute(
      //   path: RouteConstants.SALESMAN_LEADS,
      //   name: 'salesman_leads',
      //   builder: (context, state) => const SalesmanLeadsScreen(),
      // ),

      // ==================== SERVICE ENGINEER ROUTES ====================
      GoRoute(
        path: RouteConstants.SERVICE_DASHBOARD,
        name: 'service_dashboard',
        builder: (context, state) => const ServiceDashboardScreen(),
      ),

      // New Service Engineer routes
      GoRoute(
        path: RouteConstants.SERVICE_ENGINEER_DASHBOARD,
        name: 'service_engineer_dashboard',
        builder: (context, state) => const EngineerDashboardScreen(),
      ),

      GoRoute(
        path: RouteConstants.SERVICE_ENGINEER_JOBS,
        name: 'service_engineer_jobs',
        builder: (context, state) => const JobsListScreen(),
      ),

      GoRoute(
        path: RouteConstants.SERVICE_ENGINEER_JOB_DETAILS,
        name: 'service_engineer_job_details',
        builder: (context, state) {
          final jobId = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return JobDetailsWrapper(jobId: jobId);
        },
      ),

      GoRoute(
        path: RouteConstants.SERVICE_ENGINEER_ATTENDANCE,
        name: 'service_engineer_attendance',
        builder: (context, state) => const SimpleAttendanceScreen(),
      ),

      GoRoute(
        path: RouteConstants.SERVICE_ENGINEER_JOB_ROUTE,
        name: 'service_engineer_job_route',
        builder: (context, state) => const JobRouteScreen(),
      ),

      // TODO: Add more service engineer routes
      // GoRoute(
      //   path: RouteConstants.SERVICE_TICKETS,
      //   name: 'service_tickets',
      //   builder: (context, state) => const ServiceTicketsScreen(),
      // ),

      // ==================== SHARED ROUTES ====================
      GoRoute(
        path: RouteConstants.PROFILE,
        name: 'profile',
        builder: (context, state) => const ProfileScreen(),
      ),

      GoRoute(
        path: RouteConstants.NOTIFICATIONS,
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),

      // TODO: Add more shared routes (settings, help, etc.)
    ],

    // Error handling
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text('Path: ${state.uri.path}'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(RouteConstants.LOGIN),
              child: const Text('Go to Login'),
            ),
          ],
        ),
      ),
    ),
  );
}
