import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/theme/admin_theme.dart';
import '../../../core/widgets/admin_components.dart';
import '../../../core/widgets/performance_widgets.dart';

/// Admin Dashboard Screen - Control Panel Design
///
/// A calm, professional monitoring interface showing:
/// - Live operational overview
/// - KPI cards with status awareness
/// - Quick navigation to detailed views
///
/// UI Philosophy: Stable, authoritative, data-confident
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  bool isLoading = true;
  String? error;
  DateTime? lastRefresh;

  // Stats data
  int totalSalesmen = 0;
  int checkedInSalesmen = 0;
  int notCheckedInSalesmen = 0;
  int activeSalesmen = 0;
  int openEnquiries = 0;
  int openOrders = 0;
  int openServiceJobs = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      await Future.wait([
        _fetchAttendanceStats(),
        _fetchLiveLocationCount(),
        _fetchBusinessMetrics(),
      ]);

      setState(() {
        isLoading = false;
        lastRefresh = DateTime.now();
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> _fetchAttendanceStats() async {
    try {
      // Use backend-driven summary endpoint — single source of truth
      final response = await ApiService.instance.get(
        '/api/attendance/admin/summary',
        cacheDuration: const Duration(minutes: 2),
      );
      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        setState(() {
          totalSalesmen = data['total_salesmen'] ?? 0;
          checkedInSalesmen = data['by_role']?['SALESMAN']?['checked_in'] ?? 0;
          notCheckedInSalesmen = totalSalesmen - checkedInSalesmen;
        });
      }
    } catch (e) {
      // Fallback to old endpoint if summary not available
      try {
        final response = await ApiService.instance.get(
          '/api/attendance/all/today',
          cacheDuration: const Duration(minutes: 2),
        );
        if (response.success && response.data != null) {
          final List data = response.data as List;
          final salesmen = data
              .where(
                (e) =>
                    e['role']?.toString().toUpperCase().contains('SALESMAN') ??
                    false,
              )
              .toList();

          setState(() {
            totalSalesmen = salesmen.length;
            checkedInSalesmen = salesmen
                .where((e) => e['checked_in'] == true)
                .length;
            notCheckedInSalesmen = totalSalesmen - checkedInSalesmen;
          });
        }
      } catch (_) {}
    }
  }

  Future<void> _fetchLiveLocationCount() async {
    try {
      final response = await ApiService.instance.get(
        '/api/tracking/live/locations',
        cacheDuration: const Duration(minutes: 1),
      );
      if (response.success && response.data != null) {
        setState(() {
          activeSalesmen = response.data['active_count'] ?? 0;
        });
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Live location fetch error: $e');
    }
  }

  Future<void> _fetchBusinessMetrics() async {
    try {
      // Use backend-driven counts — single source of truth
      final response = await ApiService.instance.get(
        '/api/analytics/dashboard-counts',
        cacheDuration: const Duration(minutes: 3),
      );
      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        setState(() {
          openEnquiries = data['open_enquiries'] ?? 0;
          openOrders = data['open_orders'] ?? 0;
          openServiceJobs = data['active_service_jobs'] ?? 0;
        });
        return;
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Dashboard counts error: $e');
    }

    // Fallback: fetch from individual endpoints if counts endpoint not available
    await Future.wait([
      _fetchEnquiriesCountFallback(),
      _fetchOrdersCountFallback(),
      _fetchServiceJobsCountFallback(),
    ]);
  }

  Future<void> _fetchEnquiriesCountFallback() async {
    try {
      final response = await ApiService.instance.get('/api/enquiries', cacheDuration: const Duration(minutes: 3));
      if (response.success && response.data != null) {
        final List data = response.data as List;
        setState(() {
          openEnquiries = data.where((e) {
            final status = e['status']?.toString().toUpperCase() ?? '';
            return status != 'CONVERTED' &&
                status != 'CANCELLED' &&
                status != 'CLOSED';
          }).length;
        });
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Enquiries fetch error: $e');
    }
  }

  Future<void> _fetchOrdersCountFallback() async {
    try {
      final response = await ApiService.instance.get('/api/orders', cacheDuration: const Duration(minutes: 3));
      if (response.success && response.data != null) {
        final List data = response.data as List;
        setState(() {
          openOrders = data.where((e) {
            final status = e['status']?.toString().toUpperCase() ?? '';
            return status == 'PENDING' ||
                status == 'PROCESSING' ||
                status == 'CONFIRMED';
          }).length;
        });
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Orders fetch error: $e');
    }
  }

  Future<void> _fetchServiceJobsCountFallback() async {
    try {
      final response = await ApiService.instance.get('/api/service-requests', cacheDuration: const Duration(minutes: 3));
      if (response.success && response.data != null) {
        final List data = response.data as List;
        setState(() {
          openServiceJobs = data.where((e) {
            final status = e['status']?.toString().toUpperCase() ?? '';
            return status == 'PENDING' ||
                status == 'ASSIGNED' ||
                status == 'IN_PROGRESS';
          }).length;
        });
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Service jobs fetch error: $e');
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
        ),
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Cancel',
              style: TextStyle(color: AdminTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AdminTheme.statusError,
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await AuthService.instance.logout();
      if (mounted) {
        context.go('/login');
      }
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        backgroundColor: AdminTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Admin Dashboard',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Logout',
          ),
        ],
      ),
      body: isLoading
          ? const ShimmerDashboard(cardCount: 5)
          : error != null
          ? _buildErrorState()
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              color: AdminTheme.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AdminTheme.screenPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(),
                    const SizedBox(height: 24),
                    _buildKPISection(),
                    const SizedBox(height: 28),
                    _buildQuickActionsSection(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildErrorState() {
    return AdminEmptyState(
      icon: Icons.error_outline,
      title: 'Unable to load dashboard',
      subtitle: error,
      action: ElevatedButton.icon(
        onPressed: _loadDashboardData,
        icon: const Icon(Icons.refresh),
        label: const Text('Retry'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AdminTheme.primary,
          foregroundColor: Colors.white,
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final user = AuthService.instance.currentUser;
    final photoUrl = user?.profileImage;
    return AdminFadeIn(
      child: Row(
        children: [
          if (photoUrl != null && photoUrl.isNotEmpty) ...[
            CircleAvatar(
              radius: 24,
              backgroundImage: NetworkImage(
                photoUrl.startsWith('http') ? photoUrl : '${ApiConstants.BASE_URL}$photoUrl',
              ),
              onBackgroundImageError: (_, __) {},
            ),
            const SizedBox(width: 12),
          ] else ...[
            CircleAvatar(
              radius: 24,
              backgroundColor: AdminTheme.primary.withValues(alpha: 0.1),
              child: Icon(Icons.person, color: AdminTheme.primary),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_getGreeting()}, ${user?.name ?? 'Admin'}',
                  style: AdminTheme.headingLarge,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text('Live operational overview', style: AdminTheme.bodyMedium),
                    if (lastRefresh != null) ...[
                      const SizedBox(width: 12),
                      AdminInfoBar(
                        text: 'Updated ${_formatLastRefresh()}',
                        icon: Icons.access_time,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatLastRefresh() {
    if (lastRefresh == null) return '';
    final diff = DateTime.now().difference(lastRefresh!);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }

  Widget _buildKPISection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AdminFadeIn(
          delay: const Duration(milliseconds: 40),
          child: const AdminSectionHeader(
            title: 'Team Overview',
            subtitle: 'Salesman status today',
          ),
        ),
        // Team Overview - 2x2 grid using Row + Column
        Row(
          children: [
            Expanded(
              child: AdminFadeIn(
                delay: const Duration(milliseconds: 80),
                child: _buildCompactKPICard(
                  icon: Icons.groups,
                  label: 'Total Salesmen',
                  value: totalSalesmen.toString(),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AdminFadeIn(
                delay: const Duration(milliseconds: 120),
                child: _buildCompactKPICard(
                  icon: Icons.login,
                  label: 'Checked In',
                  value: checkedInSalesmen.toString(),
                  isPositive: checkedInSalesmen > 0,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: AdminFadeIn(
                delay: const Duration(milliseconds: 160),
                child: _buildCompactKPICard(
                  icon: Icons.location_on,
                  label: 'Active (Live)',
                  value: activeSalesmen.toString(),
                  isPositive: activeSalesmen > 0,
                  accentColor: activeSalesmen > 0
                      ? AdminTheme.statusActive
                      : null,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AdminFadeIn(
                delay: const Duration(milliseconds: 200),
                child: _buildCompactKPICard(
                  icon: Icons.logout,
                  label: 'Not Checked In',
                  value: notCheckedInSalesmen.toString(),
                  accentColor: notCheckedInSalesmen > 0
                      ? AdminTheme.statusWarning
                      : null,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        AdminFadeIn(
          delay: const Duration(milliseconds: 240),
          child: const AdminSectionHeader(
            title: 'Business Metrics',
            subtitle: 'Open items requiring attention',
          ),
        ),
        // Business Metrics - 3 cards in a row
        Row(
          children: [
            Expanded(
              child: AdminFadeIn(
                delay: const Duration(milliseconds: 280),
                child: _buildCompactKPICard(
                  icon: Icons.question_answer,
                  label: 'Open Enquiries',
                  value: openEnquiries.toString(),
                  isPositive: openEnquiries > 0,
                  compact: true,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AdminFadeIn(
                delay: const Duration(milliseconds: 320),
                child: _buildCompactKPICard(
                  icon: Icons.shopping_cart,
                  label: 'Open Orders',
                  value: openOrders.toString(),
                  isPositive: openOrders > 0,
                  compact: true,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AdminFadeIn(
                delay: const Duration(milliseconds: 360),
                child: _buildCompactKPICard(
                  icon: Icons.build,
                  label: 'Service Jobs',
                  value: openServiceJobs.toString(),
                  isPositive: openServiceJobs > 0,
                  compact: true,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCompactKPICard({
    required IconData icon,
    required String label,
    required String value,
    bool isPositive = false,
    Color? accentColor,
    bool compact = false,
  }) {
    final hasValue = value != '0' && value != '-';
    final cardColor = accentColor != null
        ? accentColor.withOpacity(0.15)
        : (hasValue && isPositive
              ? AdminTheme.accentPositive
              : AdminTheme.surface);
    final iconColor =
        accentColor ??
        (hasValue && isPositive
            ? AdminTheme.statusSuccess
            : AdminTheme.textSecondary);

    return Container(
      padding: EdgeInsets.all(compact ? 10 : 12),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
        boxShadow: AdminTheme.cardShadow,
        border: Border.all(
          color: hasValue && isPositive
              ? AdminTheme.statusSuccess.withOpacity(0.15)
              : Colors.transparent,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: EdgeInsets.all(compact ? 4 : 6),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AdminTheme.radiusSmall),
            ),
            child: Icon(icon, size: compact ? 16 : 18, color: iconColor),
          ),
          SizedBox(height: compact ? 6 : 8),
          Text(
            value,
            style: TextStyle(
              fontSize: compact ? 22 : 26,
              fontWeight: FontWeight.w700,
              color: hasValue ? AdminTheme.textPrimary : AdminTheme.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: compact ? 10 : 11,
              color: AdminTheme.textSecondary,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AdminFadeIn(
          delay: const Duration(milliseconds: 400),
          child: const AdminSectionHeader(title: 'Quick Access'),
        ),
        AdminStaggeredList(
          baseDelay: const Duration(milliseconds: 440),
          children: [
            AdminActionTile(
              icon: Icons.location_on,
              title: 'Live Salesman Location',
              subtitle: '$activeSalesmen active now',
              onTap: () => context
                  .push('/admin/live-location')
                  .then((_) => _loadDashboardData()),
            ),
            const SizedBox(height: 12),
            AdminActionTile(
              icon: Icons.map,
              title: 'Today\'s Field Overview',
              subtitle: 'All staff routes and visits',
              onTap: () => context
                  .push('/admin/field-overview')
                  .then((_) => _loadDashboardData()),
            ),
            const SizedBox(height: 12),
            AdminActionTile(
              icon: Icons.fact_check,
              title: 'Attendance Overview',
              subtitle: '$checkedInSalesmen checked in today',
              onTap: () => context
                  .push('/admin/attendance')
                  .then((_) => _loadDashboardData()),
            ),
          ],
        ),
      ],
    );
  }
}
