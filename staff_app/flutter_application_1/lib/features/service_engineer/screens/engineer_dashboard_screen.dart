import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/theme/service_engineer_theme.dart';
import '../../../core/widgets/engineer_components.dart';
import '../../../core/widgets/performance_widgets.dart';
import '../../../core/utils/animations.dart';

/// Engineer Dashboard Screen
///
/// Main dashboard for service engineers with:
/// - Personalized greeting
/// - Job statistics with animated counters
/// - Workload awareness indicators
/// - Quick navigation actions
///
/// UI Philosophy: Bold, action-oriented, state-driven
class EngineerDashboardScreen extends StatefulWidget {
  const EngineerDashboardScreen({super.key});

  @override
  State<EngineerDashboardScreen> createState() =>
      _EngineerDashboardScreenState();
}

class _EngineerDashboardScreenState extends State<EngineerDashboardScreen> {
  bool isLoading = true;
  Map<String, dynamic> stats = {};
  String? error;
  
  // Today's jobs with location data
  List<Map<String, dynamic>> todayJobs = [];

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
      final response = await ApiService.instance.get(
        '/api/service-requests/my-services',
        cacheDuration: const Duration(minutes: 3),
      );

      if (response.success && response.data != null) {
        final List services = response.data as List;

        int pending = 0;
        int inProgress = 0;
        int completed = 0;
        
        // Separate today's jobs for the route view
        final List<Map<String, dynamic>> todaysActiveJobs = [];
        final now = DateTime.now();
        final today = DateTime(now.year, now.month, now.day);

        for (var service in services) {
          final status = (service['status'] ?? '').toString().toUpperCase();
          final serviceMap = service as Map<String, dynamic>;
          
          if (status == 'PENDING' || status == 'ASSIGNED' || status == 'NEW') {
            pending++;
            todaysActiveJobs.add(serviceMap);
          } else if (status == 'IN_PROGRESS') {
            inProgress++;
            todaysActiveJobs.add(serviceMap);
          } else if (status == 'COMPLETED') {
            completed++;
            // Check if completed today
            final completedAt = serviceMap['completed_at'] ?? serviceMap['updated_at'];
            if (completedAt != null) {
              try {
                final completedDate = DateTime.parse(completedAt.toString());
                if (completedDate.isAfter(today)) {
                  todaysActiveJobs.add(serviceMap);
                }
              } catch (_) {}
            }
          }
        }

        setState(() {
          stats = {
            'total': services.length,
            'pending': pending,
            'in_progress': inProgress,
            'completed': completed,
          };
          todayJobs = todaysActiveJobs;
          isLoading = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load dashboard';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusLarge),
        ),
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Cancel',
              style: TextStyle(color: ServiceEngineerTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: ServiceEngineerTheme.statusError,
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
      backgroundColor: ServiceEngineerTheme.background,
      appBar: AppBar(
        backgroundColor: ServiceEngineerTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Dashboard',
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
          ? const ShimmerDashboard(cardCount: 4)
          : error != null
          ? _buildErrorState()
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              color: ServiceEngineerTheme.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(
                  ServiceEngineerTheme.screenPadding,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildWelcomeCard(),
                    const SizedBox(height: 24),
                    _buildStatsGrid(),
                    const SizedBox(height: 24),
                    _buildTodayJobsRoute(),
                    const SizedBox(height: 24),
                    _buildPrimaryAction(),
                    const SizedBox(height: 24),
                    _buildQuickActions(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: ServiceEngineerTheme.primary,
            ),
          ),
          const SizedBox(height: 16),
          Text('Loading dashboard...', style: ServiceEngineerTheme.bodyMedium),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return EngineerEmptyState(
      icon: Icons.error_outline,
      title: 'Unable to load',
      subtitle: error,
      action: EngineerActionButton(
        label: 'RETRY',
        icon: Icons.refresh,
        onPressed: _loadDashboardData,
      ),
    );
  }

  /// Build user avatar with profile image or fallback to initials
  Widget _buildUserAvatar(dynamic user) {
    String? imageUrl = user?.profileImage;
    final String name = user?.name ?? 'Engineer';

    // Construct full URL if it's a relative path
    if (imageUrl != null && imageUrl.isNotEmpty) {
      if (!imageUrl.startsWith('http')) {
        // It's a relative path, prepend base URL
        imageUrl = '${ApiConstants.BASE_URL}$imageUrl';
      }
    }

    // Debug print to check the URL
    if (kDebugMode) debugPrint('📷 Profile image URL: $imageUrl');

    // Get initials from name
    final initials = name
        .split(' ')
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0].toUpperCase())
        .join();

    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
        border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(
          ServiceEngineerTheme.radiusMedium - 2,
        ),
        child: imageUrl != null && imageUrl.isNotEmpty
            ? Image.network(
                imageUrl,
                fit: BoxFit.cover,
                width: 60,
                height: 60,
                errorBuilder: (context, error, stackTrace) {
                  // Fallback to initials on error
                  return _buildInitialsAvatar(initials);
                },
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white.withOpacity(0.6),
                      ),
                    ),
                  );
                },
              )
            : _buildInitialsAvatar(initials),
      ),
    );
  }

  /// Build avatar with user initials
  Widget _buildInitialsAvatar(String initials) {
    return Container(
      alignment: Alignment.center,
      color: Colors.white.withOpacity(0.15),
      child: Text(
        initials.isNotEmpty ? initials : 'E',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 22,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildWelcomeCard() {
    final user = AuthService.instance.currentUser;
    final pendingCount = stats['pending'] ?? 0;
    final inProgressCount = stats['in_progress'] ?? 0;
    final totalActive = pendingCount + inProgressCount;

    // Workload awareness
    bool isHighWorkload = totalActive > 5;
    String workloadMessage = isHighWorkload
        ? 'You have $totalActive active jobs'
        : totalActive == 0
        ? 'No pending jobs - great work!'
        : '$totalActive jobs need attention';

    return FadeIn(
      slideOffset: AnimationConstants.slideSmall,
      child: Container(
        padding: const EdgeInsets.all(ServiceEngineerTheme.cardPaddingLarge),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              ServiceEngineerTheme.primary,
              ServiceEngineerTheme.primaryDark,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusLarge),
          boxShadow: [
            BoxShadow(
              color: ServiceEngineerTheme.primary.withOpacity(0.3),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            _buildUserAvatar(user),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getGreeting(),
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    user?.name ?? 'Engineer',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isHighWorkload
                          ? ServiceEngineerTheme.statusWarning.withOpacity(0.2)
                          : Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isHighWorkload
                              ? Icons.warning_amber
                              : Icons.check_circle_outline,
                          size: 14,
                          color: isHighWorkload
                              ? ServiceEngineerTheme.statusWarning
                              : Colors.white.withOpacity(0.9),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          workloadMessage,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    final pending = stats['pending'] ?? 0;
    final inProgress = stats['in_progress'] ?? 0;
    final completed = stats['completed'] ?? 0;
    final total = stats['total'] ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FadeIn(
          delay: const Duration(milliseconds: 100),
          child: Text(
            'Today\'s Overview',
            style: ServiceEngineerTheme.titleLarge,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.2,
          children: [
            StaggeredFadeIn(
              index: 0,
              child: EngineerStatCard(
                title: 'Pending',
                value: pending.toString(),
                icon: Icons.pending_actions,
                color: ServiceEngineerTheme.statusPending,
                highlighted: pending > 0,
                subtitle: pending > 0 ? 'Awaiting action' : null,
                onTap: () => context
                    .push('/service-engineer/jobs')
                    .then((_) => _loadDashboardData()),
              ),
            ),
            StaggeredFadeIn(
              index: 1,
              child: EngineerStatCard(
                title: 'In Progress',
                value: inProgress.toString(),
                icon: Icons.engineering,
                color: ServiceEngineerTheme.statusInProgress,
                highlighted: inProgress > 0,
                subtitle: inProgress > 0 ? 'Active work' : null,
                onTap: () => context
                    .push('/service-engineer/jobs')
                    .then((_) => _loadDashboardData()),
              ),
            ),
            StaggeredFadeIn(
              index: 2,
              child: EngineerStatCard(
                title: 'Completed',
                value: completed.toString(),
                icon: Icons.check_circle,
                color: ServiceEngineerTheme.statusCompleted,
                onTap: () => context
                    .push('/service-engineer/jobs')
                    .then((_) => _loadDashboardData()),
              ),
            ),
            StaggeredFadeIn(
              index: 3,
              child: EngineerStatCard(
                title: 'Total Jobs',
                value: total.toString(),
                icon: Icons.work,
                color: ServiceEngineerTheme.textSecondary,
                onTap: () => context
                    .push('/service-engineer/jobs')
                    .then((_) => _loadDashboardData()),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTodayJobsRoute() {
    final inProgress = stats['in_progress'] ?? 0;
    
    return FadeIn(
      delay: const Duration(milliseconds: 250),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.route,
                    color: inProgress > 0 ? ServiceEngineerTheme.statusInProgress : ServiceEngineerTheme.textMuted,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "Today's Route",
                    style: ServiceEngineerTheme.titleLarge,
                  ),
                ],
              ),
              if (inProgress > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: ServiceEngineerTheme.statusInProgress.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.engineering,
                        size: 14,
                        color: ServiceEngineerTheme.statusInProgress,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$inProgress Active',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: ServiceEngineerTheme.statusInProgress,
                        ),
                      ),
                    ],
                  ),
                ),
              if (todayJobs.isNotEmpty)
                TextButton.icon(
                  onPressed: () => context.push('/service-engineer/job-route'),
                  icon: Icon(Icons.map, size: 16, color: ServiceEngineerTheme.primary),
                  label: Text('View Map', style: TextStyle(color: ServiceEngineerTheme.primary)),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    visualDensity: VisualDensity.compact,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (todayJobs.isEmpty)
            _buildEmptyJobsCard()
          else
            _buildJobsRouteList(),
        ],
      ),
    );
  }

  Widget _buildEmptyJobsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: ServiceEngineerTheme.surface,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
        border: Border.all(color: ServiceEngineerTheme.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: ServiceEngineerTheme.primarySurface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.check_circle_outline,
              color: ServiceEngineerTheme.statusCompleted,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'No active jobs today',
                  style: ServiceEngineerTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  'All caught up! Check job history for past work.',
                  style: ServiceEngineerTheme.caption,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJobsRouteList() {
    // Show max 3 jobs on dashboard
    final displayJobs = todayJobs.take(3).toList();
    
    return Column(
      children: [
        ...displayJobs.asMap().entries.map((entry) {
          final index = entry.key;
          final job = entry.value;
          return _buildJobRouteCard(job, index + 1);
        }),
        if (todayJobs.length > 3)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: TextButton(
              onPressed: () => context.push('/service-engineer/jobs'),
              child: Text(
                'View all ${todayJobs.length} jobs →',
                style: TextStyle(
                  color: ServiceEngineerTheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildJobRouteCard(Map<String, dynamic> job, int sequenceNumber) {
    final customerName = job['customer_name'] ?? job['customername'] ?? 'Customer';
    final status = (job['status'] ?? '').toString().toUpperCase();
    final address = job['address'] ?? job['location'] ?? '';
    final serviceType = job['service_type'] ?? job['type'] ?? 'Service';
    
    Color statusColor;
    String statusText;
    IconData statusIcon;
    
    switch (status) {
      case 'IN_PROGRESS':
        statusColor = ServiceEngineerTheme.statusInProgress;
        statusText = 'Active';
        statusIcon = Icons.engineering;
        break;
      case 'PENDING':
      case 'ASSIGNED':
        statusColor = ServiceEngineerTheme.statusPending;
        statusText = 'Pending';
        statusIcon = Icons.pending_actions;
        break;
      case 'COMPLETED':
        statusColor = ServiceEngineerTheme.statusCompleted;
        statusText = 'Done';
        statusIcon = Icons.check_circle;
        break;
      default:
        statusColor = ServiceEngineerTheme.textMuted;
        statusText = status;
        statusIcon = Icons.help_outline;
    }

    return GestureDetector(
      onTap: () {
        final jobId = job['id'];
        if (jobId != null) {
          context.push('/service-engineer/jobs/$jobId');
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: ServiceEngineerTheme.surface,
          borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
          border: Border.all(
            color: status == 'IN_PROGRESS' 
              ? statusColor.withOpacity(0.3) 
              : ServiceEngineerTheme.border,
          ),
          boxShadow: status == 'IN_PROGRESS' ? [
            BoxShadow(
              color: statusColor.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ] : null,
        ),
        child: Row(
          children: [
            // Sequence number
            Container(
              width: 32,
              height: 32,
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
            // Job details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    customerName,
                    style: ServiceEngineerTheme.titleMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(
                        Icons.build_circle_outlined,
                        size: 12,
                        color: ServiceEngineerTheme.textMuted,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          serviceType,
                          style: ServiceEngineerTheme.caption,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (address.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 12,
                          color: ServiceEngineerTheme.textMuted,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            address,
                            style: ServiceEngineerTheme.caption,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            // Status badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(statusIcon, size: 12, color: statusColor),
                  const SizedBox(width: 4),
                  Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrimaryAction() {
    final pending = stats['pending'] ?? 0;
    final inProgress = stats['in_progress'] ?? 0;
    final hasActiveJobs = pending > 0 || inProgress > 0;

    return FadeIn(
      delay: const Duration(milliseconds: 300),
      slideOffset: AnimationConstants.slideSmall,
      child: EngineerActionButton(
        label: hasActiveJobs ? 'VIEW TODAY\'S JOBS' : 'VIEW ALL JOBS',
        icon: Icons.list_alt,
        onPressed: () => context
            .push('/service-engineer/jobs')
            .then((_) => _loadDashboardData()),
      ),
    );
  }

  Widget _buildQuickActions() {
    return FadeIn(
      delay: const Duration(milliseconds: 350),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Actions', style: ServiceEngineerTheme.titleLarge),
          const SizedBox(height: 12),
          _QuickActionTile(
            icon: Icons.history,
            title: 'Job History',
            subtitle: 'View completed services',
            onTap: () => context
                .push('/service-engineer/jobs')
                .then((_) => _loadDashboardData()),
          ),
          const SizedBox(height: 12),
          _QuickActionTile(
            icon: Icons.check_circle_outline,
            title: 'Attendance',
            subtitle: 'Mark your attendance',
            onTap: () => context
                .push('/service-engineer/attendance')
                .then((_) => _loadDashboardData()),
          ),
        ],
      ),
    );
  }
}

/// Quick action tile
class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _QuickActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ServiceEngineerTheme.surface,
      borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
        child: Container(
          padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(
              ServiceEngineerTheme.radiusMedium,
            ),
            border: Border.all(color: ServiceEngineerTheme.border),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: ServiceEngineerTheme.primarySurface,
                  borderRadius: BorderRadius.circular(
                    ServiceEngineerTheme.radiusSmall,
                  ),
                ),
                child: Icon(
                  icon,
                  color: ServiceEngineerTheme.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: ServiceEngineerTheme.titleMedium),
                    const SizedBox(height: 2),
                    Text(subtitle, style: ServiceEngineerTheme.caption),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: ServiceEngineerTheme.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
