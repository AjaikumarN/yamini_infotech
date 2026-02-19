import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/service_engineer_theme.dart';
import '../../../core/widgets/engineer_components.dart';
import '../../../core/utils/animations.dart';
import '../models/service_job.dart';
import 'job_details_screen.dart';

/// Jobs List Screen
/// 
/// Display all service jobs with:
/// - Smart grouping (Today, Upcoming, Completed)
/// - Status filter chips
/// - Staggered list animations
/// - Large touch targets for field use
class JobsListScreen extends StatefulWidget {
  const JobsListScreen({super.key});

  @override
  State<JobsListScreen> createState() => _JobsListScreenState();
}

class _JobsListScreenState extends State<JobsListScreen> {
  bool isLoading = true;
  List<ServiceJob> jobs = [];
  String? error;
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchJobs();
  }

  Future<void> _fetchJobs() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await ApiService.instance.get('/api/service-requests/my-services');

      if (response.success && response.data != null) {
        final List<dynamic> data = response.data as List<dynamic>;
        setState(() {
          jobs = data.map((json) => ServiceJob.fromJson(json)).toList();
          isLoading = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load jobs';
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

  List<ServiceJob> get _filteredJobs {
    if (_statusFilter == 'all') return jobs;
    // Group related statuses together for better filtering
    if (_statusFilter == 'PENDING') {
      return jobs.where((j) {
        final s = j.status.toUpperCase();
        return s == 'PENDING' || s == 'ASSIGNED' || s == 'NEW';
      }).toList();
    }
    return jobs.where((j) => 
      j.status.toUpperCase() == _statusFilter.toUpperCase()
    ).toList();
  }

  /// Group jobs by category (Today/In Progress, Upcoming/Pending, Completed)
  Map<String, List<ServiceJob>> get _groupedJobs {
    final filtered = _filteredJobs;
    final Map<String, List<ServiceJob>> groups = {
      'active': [],
      'pending': [],
      'completed': [],
    };

    for (var job in filtered) {
      final status = job.status.toUpperCase();
      if (status == 'IN_PROGRESS') {
        groups['active']!.add(job);
      } else if (status == 'PENDING' || status == 'ASSIGNED') {
        groups['pending']!.add(job);
      } else if (status == 'COMPLETED') {
        groups['completed']!.add(job);
      }
    }

    return groups;
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
          'My Jobs',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchJobs,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterChips(),
          Expanded(
            child: isLoading
                ? const EngineerLoadingSkeleton(itemCount: 4)
                : error != null
                    ? _buildErrorState()
                    : _filteredJobs.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: _fetchJobs,
                            color: ServiceEngineerTheme.primary,
                            child: _buildJobsList(),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    return FadeIn(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: ServiceEngineerTheme.surface,
          border: Border(
            bottom: BorderSide(color: ServiceEngineerTheme.border),
          ),
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: ServiceEngineerTheme.screenPadding),
          child: Row(
            children: [
              _buildChip('All', 'all', null),
              _buildChip('In Progress', 'IN_PROGRESS', ServiceEngineerTheme.statusInProgress),
              _buildChip('Pending', 'PENDING', ServiceEngineerTheme.statusPending),
              _buildChip('Completed', 'COMPLETED', ServiceEngineerTheme.statusCompleted),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChip(String label, String value, Color? color) {
    final isSelected = _statusFilter == value;
    final chipColor = color ?? ServiceEngineerTheme.textSecondary;
    
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => _statusFilter = value);
        },
        child: AnimatedContainer(
          duration: AnimationConstants.fast,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? chipColor.withOpacity(0.15) : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? chipColor : ServiceEngineerTheme.border,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? chipColor : ServiceEngineerTheme.textSecondary,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return EngineerEmptyState(
      icon: Icons.error_outline,
      title: 'Unable to load jobs',
      subtitle: error,
      action: EngineerActionButton(
        label: 'RETRY',
        icon: Icons.refresh,
        onPressed: _fetchJobs,
      ),
    );
  }

  Widget _buildEmptyState() {
    return EngineerEmptyState(
      icon: Icons.work_off,
      title: 'No Jobs Found',
      subtitle: _statusFilter == 'all'
          ? 'No jobs assigned to you yet'
          : 'No jobs with status: ${_statusFilter.replaceAll('_', ' ')}',
    );
  }

  Widget _buildJobsList() {
    final groups = _groupedJobs;
    int globalIndex = 0;

    return ListView(
      padding: const EdgeInsets.all(ServiceEngineerTheme.screenPadding),
      children: [
        // Active / In Progress
        if (groups['active']!.isNotEmpty) ...[
          _buildSectionHeader(
            'In Progress',
            groups['active']!.length,
            ServiceEngineerTheme.statusInProgress,
            Icons.engineering,
          ),
          const SizedBox(height: 12),
          ...groups['active']!.map((job) {
            final index = globalIndex++;
            return _buildJobCard(job, index);
          }),
          const SizedBox(height: 20),
        ],

        // Pending / Assigned
        if (groups['pending']!.isNotEmpty) ...[
          _buildSectionHeader(
            'Pending',
            groups['pending']!.length,
            ServiceEngineerTheme.statusPending,
            Icons.pending_actions,
          ),
          const SizedBox(height: 12),
          ...groups['pending']!.map((job) {
            final index = globalIndex++;
            return _buildJobCard(job, index);
          }),
          const SizedBox(height: 20),
        ],

        // Completed
        if (groups['completed']!.isNotEmpty) ...[
          _buildSectionHeader(
            'Completed',
            groups['completed']!.length,
            ServiceEngineerTheme.statusCompleted,
            Icons.check_circle,
          ),
          const SizedBox(height: 12),
          ...groups['completed']!.map((job) {
            final index = globalIndex++;
            return _buildJobCard(job, index);
          }),
        ],
      ],
    );
  }

  Widget _buildSectionHeader(String title, int count, Color color, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: color),
        const SizedBox(width: 8),
        Text(
          title,
          style: ServiceEngineerTheme.titleMedium.copyWith(color: color),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            count.toString(),
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildJobCard(ServiceJob job, int index) {
    return EngineerJobCard(
      ticketNumber: job.ticketNumber ?? '#${job.id}',
      customerName: job.customerName,
      description: job.description,
      status: job.status,
      priority: job.priority,
      slaText: job.status.toUpperCase() != 'COMPLETED' ? job.slaRemainingText : null,
      isSlaBreached: job.isSlaBreached,
      isSlaWarning: job.isSlaWarning,
      animationIndex: index,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => JobDetailsScreen(job: job),
          ),
        ).then((_) => _fetchJobs());
      },
    );
  }
}
