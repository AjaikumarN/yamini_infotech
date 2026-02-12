import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/reception_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/auth_service.dart';
import '../widgets/reception_ui_components.dart';

/// Reception Dashboard Screen
///
/// RECEPTION UI IDEOLOGY:
/// - Fast data entry, continuous task switching
/// - Light, Fast, Clear, Unobtrusive
/// - Feel like a well-organized front desk
///
/// Animation specs:
/// - Cards: slide up 8px + fade in, 180-200ms, 40ms stagger
/// - Numbers: cross-fade on refresh, no counting animation
/// - No bouncing, spinning, or pulsing effects
///
/// KPI Cards:
/// - New Requests (Today)
/// - Unassigned Requests (with warning accent)
/// - Assigned Requests
/// - Closed Requests
class ReceptionDashboardScreen extends StatefulWidget {
  const ReceptionDashboardScreen({super.key});

  @override
  State<ReceptionDashboardScreen> createState() =>
      _ReceptionDashboardScreenState();
}

class _ReceptionDashboardScreenState extends State<ReceptionDashboardScreen> {
  bool isLoading = true;
  String? error;
  bool _isRefreshing = false;

  // Stats
  int newEnquiriesToday = 0;
  int newServiceRequestsToday = 0;
  int unassignedEnquiries = 0;
  int unassignedServiceRequests = 0;
  int assignedEnquiries = 0;
  int assignedServiceRequests = 0;
  int closedEnquiries = 0;
  int closedServiceRequests = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    if (_isRefreshing) return;

    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      await Future.wait([_fetchEnquiryStats(), _fetchServiceRequestStats()]);
      setState(() {
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> _refreshData() async {
    if (_isRefreshing) return;

    setState(() => _isRefreshing = true);
    HapticFeedback.lightImpact();

    try {
      await Future.wait([_fetchEnquiryStats(), _fetchServiceRequestStats()]);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Refresh failed: ${e.toString()}'),
            backgroundColor: ReceptionAnimationConstants.danger,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isRefreshing = false);
      }
    }
  }

  Future<void> _fetchEnquiryStats() async {
    try {
      final response = await ApiService.instance.get('/api/enquiries');
      if (response.success && response.data != null) {
        final List data = response.data as List;
        final today = DateTime.now();

        setState(() {
          newEnquiriesToday = data.where((e) {
            final createdAt = e['created_at'];
            if (createdAt == null) return false;
            try {
              final date = DateTime.parse(createdAt);
              return date.year == today.year &&
                  date.month == today.month &&
                  date.day == today.day;
            } catch (_) {
              return false;
            }
          }).length;

          unassignedEnquiries = data
              .where(
                (e) =>
                    e['assigned_to'] == null &&
                    e['status']?.toString().toUpperCase() != 'CLOSED' &&
                    e['status']?.toString().toUpperCase() != 'CANCELLED' &&
                    e['status']?.toString().toUpperCase() != 'CONVERTED',
              )
              .length;

          assignedEnquiries = data
              .where(
                (e) =>
                    e['assigned_to'] != null &&
                    e['status']?.toString().toUpperCase() != 'CLOSED' &&
                    e['status']?.toString().toUpperCase() != 'CANCELLED' &&
                    e['status']?.toString().toUpperCase() != 'CONVERTED',
              )
              .length;

          closedEnquiries = data.where((e) {
            final status = e['status']?.toString().toUpperCase() ?? '';
            return status == 'CLOSED' ||
                status == 'CONVERTED' ||
                status == 'CANCELLED';
          }).length;
        });
      }
    } catch (e) {
      debugPrint('Enquiry stats error: $e');
    }
  }

  Future<void> _fetchServiceRequestStats() async {
    try {
      final response = await ApiService.instance.get('/api/service-requests');
      if (response.success && response.data != null) {
        final List data = response.data as List;
        final today = DateTime.now();

        setState(() {
          newServiceRequestsToday = data.where((e) {
            final createdAt = e['created_at'];
            if (createdAt == null) return false;
            try {
              final date = DateTime.parse(createdAt);
              return date.year == today.year &&
                  date.month == today.month &&
                  date.day == today.day;
            } catch (_) {
              return false;
            }
          }).length;

          unassignedServiceRequests = data
              .where(
                (e) =>
                    e['assigned_to'] == null &&
                    e['status']?.toString().toUpperCase() != 'CLOSED' &&
                    e['status']?.toString().toUpperCase() != 'COMPLETED' &&
                    e['status']?.toString().toUpperCase() != 'CANCELLED',
              )
              .length;

          assignedServiceRequests = data
              .where(
                (e) =>
                    e['assigned_to'] != null &&
                    e['status']?.toString().toUpperCase() != 'CLOSED' &&
                    e['status']?.toString().toUpperCase() != 'COMPLETED' &&
                    e['status']?.toString().toUpperCase() != 'CANCELLED',
              )
              .length;

          closedServiceRequests = data.where((e) {
            final status = e['status']?.toString().toUpperCase() ?? '';
            return status == 'CLOSED' ||
                status == 'COMPLETED' ||
                status == 'CANCELLED';
          }).length;
        });
      }
    } catch (e) {
      debugPrint('Service request stats error: $e');
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusLg,
          ),
        ),
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: TextStyle(color: Colors.grey[600])),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: ReceptionAnimationConstants.danger,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ReceptionAnimationConstants.neutralBg,
      appBar: _buildAppBar(),
      body: _buildBody(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Reception',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          Text(
            _getGreeting(),
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[500],
              fontWeight: FontWeight.normal,
            ),
          ),
        ],
      ),
      actions: [
        // Refresh button
        IconButton(
          icon: AnimatedSwitcher(
            duration: ReceptionAnimationConstants.fade,
            child: _isRefreshing
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: ReceptionAnimationConstants.primary,
                    ),
                  )
                : Icon(Icons.refresh_rounded, color: Colors.grey[700]),
          ),
          onPressed: _isRefreshing ? null : _refreshData,
          tooltip: 'Refresh',
        ),
        // Logout button
        IconButton(
          icon: Icon(Icons.logout_rounded, color: Colors.grey[700]),
          onPressed: _logout,
          tooltip: 'Logout',
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  Widget _buildBody() {
    if (isLoading) {
      return _buildLoadingState();
    }

    if (error != null) {
      return _buildErrorState();
    }

    return RefreshIndicator(
      onRefresh: _refreshData,
      color: ReceptionAnimationConstants.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildWelcomeHeader(),
            SizedBox(height: ReceptionAnimationConstants.spacingXl),
            _buildTodayStats(),
            SizedBox(height: ReceptionAnimationConstants.spacingSection),
            _buildStatusOverview(),
            SizedBox(height: ReceptionAnimationConstants.spacingXl),
            _buildQuickActions(),
            SizedBox(height: ReceptionAnimationConstants.spacingSection),
            _buildNavigationCards(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: ReceptionAnimationConstants.primary,
            ),
          ),
          SizedBox(height: ReceptionAnimationConstants.spacingLg),
          Text(
            'Loading dashboard...',
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(ReceptionAnimationConstants.spacingXl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: ReceptionAnimationConstants.danger.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: ReceptionAnimationConstants.danger,
              ),
            ),
            SizedBox(height: ReceptionAnimationConstants.spacingLg),
            Text(
              'Unable to load data',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
            SizedBox(height: ReceptionAnimationConstants.spacingSm),
            Text(
              error!,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
            ),
            SizedBox(height: ReceptionAnimationConstants.spacingXl),
            ReceptionSubmitButton(
              label: 'Try Again',
              icon: Icons.refresh_rounded,
              onPressed: _loadDashboardData,
              width: 160,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader() {
    final user = AuthService.instance.currentUser;
    final now = DateTime.now();
    final dateStr =
        '${_getWeekday(now.weekday)}, ${now.day} ${_getMonth(now.month)} ${now.year}';

    return _FadeSlideEntry(
      staggerIndex: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back, ${user?.name ?? 'Reception'}',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          SizedBox(height: ReceptionAnimationConstants.spacingXs),
          Text(
            dateStr,
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  String _getWeekday(int day) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[day - 1];
  }

  String _getMonth(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1];
  }

  Widget _buildTodayStats() {
    final totalToday = newEnquiriesToday + newServiceRequestsToday;

    return _FadeSlideEntry(
      staggerIndex: 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ReceptionSectionHeader(
            title: "Today's Activity",
            subtitle:
                '$totalToday new request${totalToday == 1 ? '' : 's'} today',
          ),
          Row(
            children: [
              Expanded(
                child: ReceptionDashboardCard(
                  title: 'New Enquiries',
                  value: newEnquiriesToday,
                  icon: Icons.storefront_outlined,
                  color: ReceptionAnimationConstants.typeSales,
                  staggerIndex: 2,
                  onTap: () => context.push('/reception/enquiries').then((_) => _refreshData()),
                ),
              ),
              SizedBox(width: ReceptionAnimationConstants.spacingMd),
              Expanded(
                child: ReceptionDashboardCard(
                  title: 'Service Requests',
                  value: newServiceRequestsToday,
                  icon: Icons.build_outlined,
                  color: ReceptionAnimationConstants.typeService,
                  staggerIndex: 3,
                  onTap: () => context.push('/reception/service-requests').then((_) => _refreshData()),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusOverview() {
    final totalUnassigned = unassignedEnquiries + unassignedServiceRequests;
    final totalAssigned = assignedEnquiries + assignedServiceRequests;

    return _FadeSlideEntry(
      staggerIndex: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ReceptionSectionHeader(
            title: 'Status Overview',
            subtitle: totalUnassigned > 0
                ? '$totalUnassigned awaiting assignment'
                : 'All requests assigned',
          ),
          Row(
            children: [
              Expanded(
                child: ReceptionDashboardCard(
                  title: 'Unassigned',
                  value: totalUnassigned,
                  icon: Icons.pending_actions_outlined,
                  color: ReceptionAnimationConstants.warning,
                  staggerIndex: 5,
                  hasWarning: true, // Amber accent when > 0
                ),
              ),
              SizedBox(width: ReceptionAnimationConstants.spacingMd),
              Expanded(
                child: ReceptionDashboardCard(
                  title: 'Assigned',
                  value: totalAssigned,
                  icon: Icons.assignment_ind_outlined,
                  color: ReceptionAnimationConstants.success,
                  staggerIndex: 6,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return _FadeSlideEntry(
      staggerIndex: 7,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ReceptionSectionHeader(title: 'Quick Actions'),
          ReceptionSubmitButton(
            label: 'Create New Request',
            icon: Icons.add_circle_outline,
            onPressed: () => context.push('/reception/create-request').then((_) => _refreshData()),
            backgroundColor: ReceptionAnimationConstants.primary,
            width: double.infinity,
          ),
          SizedBox(height: ReceptionAnimationConstants.spacingSm),
          ReceptionSubmitButton(
            label: 'Mark Attendance',
            icon: Icons.check_circle_outline,
            onPressed: () => context.push('/reception/attendance').then((_) => _refreshData()),
            backgroundColor: ReceptionAnimationConstants.statusInProgress,
            width: double.infinity,
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationCards() {
    return _FadeSlideEntry(
      staggerIndex: 8,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ReceptionSectionHeader(title: 'Navigate'),
          ReceptionNavCard(
            icon: Icons.storefront_outlined,
            iconColor: ReceptionAnimationConstants.typeSales,
            title: 'Enquiries',
            subtitle:
                '$unassignedEnquiries unassigned, $assignedEnquiries assigned',
            onTap: () => context.push('/reception/enquiries').then((_) => _refreshData()),
          ),
          SizedBox(height: ReceptionAnimationConstants.spacingSm),
          ReceptionNavCard(
            icon: Icons.build_outlined,
            iconColor: ReceptionAnimationConstants.typeService,
            title: 'Service Requests',
            subtitle:
                '$unassignedServiceRequests unassigned, $assignedServiceRequests assigned',
            onTap: () => context.push('/reception/service-requests').then((_) => _refreshData()),
          ),
          SizedBox(height: ReceptionAnimationConstants.spacingSm),
          ReceptionNavCard(
            icon: Icons.track_changes_outlined,
            iconColor: ReceptionAnimationConstants.statusInProgress,
            title: 'Status Tracking',
            subtitle: 'Monitor all requests',
            onTap: () => context.push('/reception/tracking').then((_) => _refreshData()),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FADE SLIDE ENTRY - Section entry animation
// ═══════════════════════════════════════════════════════════════════════════════

class _FadeSlideEntry extends StatefulWidget {
  final Widget child;
  final int staggerIndex;

  const _FadeSlideEntry({required this.child, this.staggerIndex = 0});

  @override
  State<_FadeSlideEntry> createState() => _FadeSlideEntryState();
}

class _FadeSlideEntryState extends State<_FadeSlideEntry>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.slide,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: ReceptionAnimationConstants.entryCurve,
      ),
    );

    _slideAnimation =
        Tween<Offset>(
          begin: const Offset(0, 0.06), // ~8px
          end: Offset.zero,
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: ReceptionAnimationConstants.entryCurve,
          ),
        );

    Future.delayed(
      ReceptionAnimationConstants.getStaggerDelay(widget.staggerIndex),
      () {
        if (mounted) _controller.forward();
      },
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(opacity: _fadeAnimation, child: widget.child),
    );
  }
}
