import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/route_constants.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/salesman_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/widgets/performance_widgets.dart';
import '../widgets/salesman_ui_components.dart';

/// Salesman Dashboard Screen
///
/// Main dashboard for Salesman role
/// Shows real-time stats from backend API
class SalesmanDashboardScreen extends StatefulWidget {
  const SalesmanDashboardScreen({super.key});

  @override
  State<SalesmanDashboardScreen> createState() =>
      _SalesmanDashboardScreenState();
}

class _SalesmanDashboardScreenState extends State<SalesmanDashboardScreen> {
  bool isLoading = true;
  Map<String, dynamic>? stats;
  bool? attendanceMarked;
  String? error;
  
  // Today's visits data
  List<Map<String, dynamic>> todayVisits = [];
  bool hasActiveVisit = false;

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
      // Fetch attendance status, dashboard stats, and today's visits in parallel
      final results = await Future.wait([
        ApiService.instance.get(ApiConstants.ATTENDANCE_TODAY, cacheDuration: const Duration(minutes: 2)),
        ApiService.instance.get(ApiConstants.DASHBOARD_STATS, cacheDuration: const Duration(minutes: 2)),
        ApiService.instance.get(ApiConstants.TRACKING_VISIT_HISTORY, cacheDuration: const Duration(minutes: 2)),
        ApiService.instance.get(ApiConstants.TRACKING_ACTIVE_VISIT, cacheDuration: const Duration(minutes: 1)),
      ]);

      final attendanceResponse = results[0];
      final analyticsResponse = results[1];
      final visitsResponse = results[2];
      final activeVisitResponse = results[3];

      setState(() {
        // Attendance: null means not marked, object means marked
        attendanceMarked = attendanceResponse.data != null;

        // Analytics data
        if (analyticsResponse.success && analyticsResponse.data != null) {
          stats = analyticsResponse.data as Map<String, dynamic>;
        } else {
          stats = {};
        }
        
        // Today's visits
        if (visitsResponse.success && visitsResponse.data != null) {
          final data = visitsResponse.data as Map<String, dynamic>;
          final visits = data['visits'] as List? ?? [];
          todayVisits = visits.map((v) => v as Map<String, dynamic>).toList();
        }
        
        // Active visit status
        if (activeVisitResponse.success && activeVisitResponse.data != null) {
          final data = activeVisitResponse.data as Map<String, dynamic>;
          hasActiveVisit = data['status'] == 'active_visit';
        }
        
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load dashboard: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  void _logout() async {
    await AuthService.instance.logout();
    if (mounted) {
      context.go(RouteConstants.LOGIN);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Salesman Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
          ),
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: isLoading
          ? const ShimmerDashboard(cardCount: 4)
          : error != null
          ? _buildErrorState()
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Greeting with photo
                    _SalesmanGreeting(
                      greeting: _getGreeting(),
                      photoUrl: AuthService.instance.currentUser?.profileImage,
                    ),
                    const SizedBox(height: 16),

                    // Attendance Banner
                    if (attendanceMarked == false) _buildAttendanceBanner(),

                    Text(
                      'Today\'s Stats',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 16),
                    _buildStatsCard(
                      'Assigned Enquiries',
                      stats?['assigned_enquiries']?.toString() ?? '0',
                      Icons.question_answer,
                      Colors.blue,
                      0,
                    ),
                    _buildStatsCard(
                      'Today\'s Calls',
                      stats?['today_calls']?.toString() ?? '0',
                      Icons.phone,
                      Colors.green,
                      1,
                    ),
                    _buildStatsCard(
                      'Pending Follow-ups',
                      stats?['pending_followups']?.toString() ?? '0',
                      Icons.schedule,
                      Colors.orange,
                      2,
                    ),
                    _buildStatsCard(
                      'Orders This Month',
                      stats?['orders_this_month']?.toString() ?? '0',
                      Icons.shopping_cart,
                      Colors.purple,
                      3,
                    ),
                    const SizedBox(height: 24),
                    
                    // Today's Visits Section
                    _buildTodayVisitsSection(),
                    
                    const SizedBox(height: 32),
                    const Divider(),
                    const SizedBox(height: 16),
                    Text(
                      'Quick Navigation',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 16),
                    _buildNavigationGrid(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildErrorState() {
    return SalesmanEmptyState(
      icon: Icons.error_outline,
      title: 'Error Loading Dashboard',
      subtitle: error ?? 'Something went wrong. Please try again.',
      action: SalesmanActionButton(
        label: 'Retry',
        icon: Icons.refresh,
        onPressed: _loadDashboardData,
      ),
    );
  }

  Widget _buildAttendanceBanner() {
    return SalesmanAttendanceBanner(
      isCheckedIn: attendanceMarked ?? false,
      isLate: _isLateForWork(),
      onMarkAttendance: () => context
          .push(RouteConstants.SALESMAN_ATTENDANCE)
          .then((_) => _loadDashboardData()),
    );
  }

  bool _isLateForWork() {
    final now = DateTime.now();
    // Consider late if after 10 AM and not checked in
    return now.hour >= 10 && attendanceMarked == false;
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  Widget _buildNavigationGrid() {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      alignment: WrapAlignment.center,
      children: [
        _buildNavButton(
          'Attendance',
          Icons.fingerprint,
          RouteConstants.SALESMAN_ATTENDANCE,
          Colors.teal,
        ),
        _buildNavButton(
          'Customer Visit',
          Icons.location_on,
          RouteConstants.SALESMAN_CUSTOMER_VISIT,
          Colors.green,
        ),
        _buildNavButton(
          'Enquiries',
          Icons.question_answer,
          RouteConstants.SALESMAN_ENQUIRIES,
          Colors.blue,
        ),
        _buildNavButton(
          'Follow-ups',
          Icons.schedule,
          RouteConstants.SALESMAN_FOLLOWUPS,
          Colors.orange,
        ),
        _buildNavButton(
          'Orders',
          Icons.shopping_cart,
          RouteConstants.SALESMAN_ORDERS,
          Colors.purple,
        ),
        _buildNavButton(
          'Daily Report',
          Icons.summarize,
          RouteConstants.SALESMAN_DAILY_REPORT,
          Colors.indigo,
        ),
      ],
    );
  }

  Widget _buildTodayVisitsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  Icons.route,
                  color: hasActiveVisit ? Colors.green : Colors.grey[600],
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  "Today's Visits",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            if (hasActiveVisit)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.location_on, size: 14, color: Colors.green),
                    SizedBox(width: 4),
                    Text(
                      'Live',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
              ),
            if (todayVisits.isNotEmpty)
              TextButton.icon(
                onPressed: () => context.push(RouteConstants.SALESMAN_VISIT_OVERVIEW),
                icon: const Icon(Icons.map, size: 16),
                label: const Text('View Map'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  visualDensity: VisualDensity.compact,
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (todayVisits.isEmpty)
          _buildEmptyVisitsCard()
        else
          _buildVisitsList(),
      ],
    );
  }

  Widget _buildEmptyVisitsCard() {
    return GestureDetector(
      onTap: () => context.push(RouteConstants.SALESMAN_CUSTOMER_VISIT),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.add_location_alt,
                color: Colors.green[600],
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'No visits yet today',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tap to start your first customer visit',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Widget _buildVisitsList() {
    // Show max 3 recent visits
    final recentVisits = todayVisits.take(3).toList();
    
    return Column(
      children: [
        ...recentVisits.asMap().entries.map((entry) {
          final index = entry.key;
          final visit = entry.value;
          return _buildVisitCard(visit, index + 1);
        }),
        if (todayVisits.length > 3)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: TextButton(
              onPressed: () => context.push(RouteConstants.SALESMAN_CUSTOMER_VISIT),
              child: Text(
                'View all ${todayVisits.length} visits →',
                style: TextStyle(
                  color: Colors.blue[600],
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildVisitCard(Map<String, dynamic> visit, int sequenceNumber) {
    final customerName = visit['customername'] ?? visit['customer_name'] ?? 'Customer';
    final status = visit['status'] ?? 'completed';
    final checkinTime = visit['checkintime'] ?? visit['checkin_time'] ?? '';
    final checkoutTime = visit['checkouttime'] ?? visit['checkout_time'];
    
    final isActive = status == 'active' || checkoutTime == null;
    final statusColor = isActive ? Colors.green : Colors.blue;
    
    String timeText = '';
    if (checkinTime.isNotEmpty) {
      try {
        final time = DateTime.parse(checkinTime);
        timeText = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
        if (checkoutTime != null && checkoutTime.toString().isNotEmpty) {
          final endTime = DateTime.parse(checkoutTime);
          timeText += ' - ${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}';
        } else {
          timeText += ' - Now';
        }
      } catch (_) {}
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? Colors.green.withOpacity(0.3) : Colors.grey[200]!,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Sequence number
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '$sequenceNumber',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: statusColor,
                  fontSize: 14,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Visit details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  customerName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (timeText.isNotEmpty)
                  Text(
                    timeText,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ),
          // Status indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              isActive ? 'Active' : 'Done',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: statusColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavButton(
    String label,
    IconData icon,
    String route,
    Color color,
  ) {
    return GestureDetector(
      onTap: () => context.push(route).then((_) => _loadDashboardData()),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.43,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color.withOpacity(0.15), color.withOpacity(0.05)],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: color.withOpacity(0.9),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsCard(
    String title,
    String value,
    IconData icon,
    Color color,
    int index,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SalesmanDashboardCard(
        title: title,
        value: value,
        icon: icon,
        color: color,
        staggerIndex: index,
      ),
    );
  }
}

/// Animated greeting widget with fade + slide
class _SalesmanGreeting extends StatefulWidget {
  final String greeting;
  final String? photoUrl;

  const _SalesmanGreeting({required this.greeting, this.photoUrl});

  @override
  State<_SalesmanGreeting> createState() => _SalesmanGreetingState();
}

class _SalesmanGreetingState extends State<_SalesmanGreeting>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: SalesmanAnimationConstants.slide,
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.entryCurve,
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, -0.1), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _controller,
            curve: SalesmanAnimationConstants.entryCurve,
          ),
        );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Row(
          children: [
            if (widget.photoUrl != null && widget.photoUrl!.isNotEmpty) ...[
              CircleAvatar(
                radius: 24,
                backgroundImage: NetworkImage(widget.photoUrl!),
                onBackgroundImageError: (_, __) {},
                child: widget.photoUrl == null ? const Icon(Icons.person) : null,
              ),
              const SizedBox(width: 12),
            ] else ...[
              CircleAvatar(
                radius: 24,
                backgroundColor: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                child: Icon(Icons.person, color: Theme.of(context).primaryColor),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Text(
                '${widget.greeting}! 👋',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
