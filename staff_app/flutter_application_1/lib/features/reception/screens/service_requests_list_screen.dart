import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/reception_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/reception_ui_components.dart';

/// Service Requests List Screen
///
/// Animation specs:
/// - Filter chip selection: background color transition (100ms)
/// - List item tap: scale 0.98 (80ms)
/// - Pull-to-refresh: standard Flutter indicator
/// - Priority badges: subtle pulse for CRITICAL
///
/// Features:
/// - Filter chips with counts
/// - Priority badges (HIGH, CRITICAL)
/// - Machine model display
/// - Quick assign action
class ServiceRequestsListScreen extends StatefulWidget {
  const ServiceRequestsListScreen({super.key});

  @override
  State<ServiceRequestsListScreen> createState() =>
      _ServiceRequestsListScreenState();
}

class _ServiceRequestsListScreenState extends State<ServiceRequestsListScreen> {
  List<Map<String, dynamic>> serviceRequests = [];
  bool isLoading = true;
  String? errorMessage;

  // Filters
  String? statusFilter;
  String? priorityFilter;

  @override
  void initState() {
    super.initState();
    _loadServiceRequests();
  }

  Future<void> _loadServiceRequests() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response = await ApiService.instance.get('/api/service-requests/');

      if (response.success && response.data != null) {
        final data = response.data is List
            ? List<Map<String, dynamic>>.from(response.data)
            : <Map<String, dynamic>>[];

        if (mounted) {
          setState(() {
            serviceRequests = data;
            isLoading = false;
          });
        }
      } else {
        throw Exception(response.message ?? 'Failed to load service requests');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoading = false;
          errorMessage = 'Unable to load service requests: $e';
        });
      }
    }
  }

  List<Map<String, dynamic>> get _filteredRequests {
    var filtered = serviceRequests;

    // Status filter
    if (statusFilter != null) {
      filtered = filtered.where((r) => r['status'] == statusFilter).toList();
    }

    // Priority filter
    if (priorityFilter != null) {
      filtered = filtered
          .where((r) => r['priority'] == priorityFilter)
          .toList();
    }

    // Sort: unassigned first, then by priority, then by date
    filtered.sort((a, b) {
      // Unassigned first
      final aUnassigned = a['engineer_id'] == null;
      final bUnassigned = b['engineer_id'] == null;
      if (aUnassigned != bUnassigned) {
        return aUnassigned ? -1 : 1;
      }

      // Priority (CRITICAL > HIGH > NORMAL > LOW)
      final priorityOrder = {'CRITICAL': 0, 'HIGH': 1, 'NORMAL': 2, 'LOW': 3};
      final aPriority = priorityOrder[a['priority']] ?? 2;
      final bPriority = priorityOrder[b['priority']] ?? 2;
      if (aPriority != bPriority) {
        return aPriority.compareTo(bPriority);
      }

      // Date (newest first)
      final aDate = a['created_at'] as String?;
      final bDate = b['created_at'] as String?;
      if (aDate != null && bDate != null) {
        return bDate.compareTo(aDate);
      }
      return 0;
    });

    return filtered;
  }

  Map<String, int> get _statusCounts {
    final counts = <String, int>{};
    for (final r in serviceRequests) {
      final status = r['status'] as String? ?? 'UNKNOWN';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  Map<String, int> get _priorityCounts {
    final counts = <String, int>{};
    for (final r in serviceRequests) {
      final priority = r['priority'] as String? ?? 'NORMAL';
      counts[priority] = (counts[priority] ?? 0) + 1;
    }
    return counts;
  }

  int get _unassignedCount {
    return serviceRequests.where((r) => r['engineer_id'] == null).length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ReceptionAnimationConstants.neutralBg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Service Requests',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.add_rounded,
              color: ReceptionAnimationConstants.typeService,
            ),
            onPressed: () => context.push('/reception/create-request').then((_) => _loadServiceRequests()),
            tooltip: 'Create Request',
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats summary
          _buildStatsSummary(),

          // Filters
          _buildFilters(),

          // List
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildStatsSummary() {
    final totalRequests = serviceRequests.length;
    final unassigned = _unassignedCount;
    final highPriority =
        (_priorityCounts['HIGH'] ?? 0) + (_priorityCounts['CRITICAL'] ?? 0);

    return Container(
      padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
      color: Colors.white,
      child: Row(
        children: [
          _buildStatCard(
            'Total',
            totalRequests.toString(),
            Icons.build_outlined,
            ReceptionAnimationConstants.typeService,
          ),
          SizedBox(width: ReceptionAnimationConstants.spacingMd),
          _buildStatCard(
            'Unassigned',
            unassigned.toString(),
            Icons.person_off_outlined,
            unassigned > 0 ? ReceptionAnimationConstants.warning : Colors.grey,
          ),
          SizedBox(width: ReceptionAnimationConstants.spacingMd),
          _buildStatCard(
            'High Priority',
            highPriority.toString(),
            Icons.priority_high_rounded,
            highPriority > 0 ? ReceptionAnimationConstants.danger : Colors.grey,
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.all(ReceptionAnimationConstants.spacingMd),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusMd,
          ),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            SizedBox(height: ReceptionAnimationConstants.spacingSm),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: ReceptionAnimationConstants.spacingLg,
        vertical: ReceptionAnimationConstants.spacingMd,
      ),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ReceptionFilterChip(
                  label: 'All',
                  count: serviceRequests.length,
                  isSelected: statusFilter == null,
                  onTap: () => setState(() => statusFilter = null),
                  selectedColor: ReceptionAnimationConstants.typeService,
                ),
                ..._statusCounts.entries.map(
                  (entry) => Padding(
                    padding: EdgeInsets.only(
                      left: ReceptionAnimationConstants.spacingSm,
                    ),
                    child: ReceptionFilterChip(
                      label: _formatStatus(entry.key),
                      count: entry.value,
                      isSelected: statusFilter == entry.key,
                      onTap: () => setState(() => statusFilter = entry.key),
                      selectedColor: ReceptionAnimationConstants.typeService,
                    ),
                  ),
                ),
              ],
            ),
          ),

          SizedBox(height: ReceptionAnimationConstants.spacingSm),

          // Priority filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                Text(
                  'Priority:',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
                SizedBox(width: ReceptionAnimationConstants.spacingSm),
                _buildPriorityChip('All', null),
                _buildPriorityChip('Critical', 'CRITICAL'),
                _buildPriorityChip('High', 'HIGH'),
                _buildPriorityChip('Normal', 'NORMAL'),
                _buildPriorityChip('Low', 'LOW'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriorityChip(String label, String? value) {
    final isSelected = priorityFilter == value;
    final count = value == null
        ? serviceRequests.length
        : _priorityCounts[value] ?? 0;

    Color chipColor;
    switch (value) {
      case 'CRITICAL':
        chipColor = ReceptionAnimationConstants.danger;
        break;
      case 'HIGH':
        chipColor = ReceptionAnimationConstants.warning;
        break;
      case 'LOW':
        chipColor = ReceptionAnimationConstants.success;
        break;
      default:
        chipColor = Colors.grey;
    }

    return Padding(
      padding: EdgeInsets.only(left: ReceptionAnimationConstants.spacingSm),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => priorityFilter = value);
        },
        child: AnimatedContainer(
          duration: ReceptionAnimationConstants.chipTransition,
          padding: EdgeInsets.symmetric(
            horizontal: ReceptionAnimationConstants.spacingMd,
            vertical: ReceptionAnimationConstants.spacingSm,
          ),
          decoration: BoxDecoration(
            color: isSelected
                ? (value == null
                          ? ReceptionAnimationConstants.typeService
                          : chipColor)
                      .withOpacity(0.1)
                : Colors.grey[100],
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusSm,
            ),
            border: Border.all(
              color: isSelected
                  ? (value == null
                        ? ReceptionAnimationConstants.typeService
                        : chipColor)
                  : Colors.transparent,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected
                      ? (value == null
                            ? ReceptionAnimationConstants.typeService
                            : chipColor)
                      : Colors.grey[600],
                ),
              ),
              if (count > 0) ...[
                SizedBox(width: ReceptionAnimationConstants.spacingSm),
                Text(
                  '($count)',
                  style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (isLoading) {
      return const ReceptionSimpleLoading(
        message: 'Loading service requests...',
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(ReceptionAnimationConstants.spacingXl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: ReceptionAnimationConstants.danger,
              ),
              SizedBox(height: ReceptionAnimationConstants.spacingMd),
              Text(
                'Unable to Load Data',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
              SizedBox(height: ReceptionAnimationConstants.spacingSm),
              Text(
                errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
              SizedBox(height: ReceptionAnimationConstants.spacingLg),
              ElevatedButton.icon(
                onPressed: _loadServiceRequests,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: ReceptionAnimationConstants.typeService,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final filtered = _filteredRequests;

    if (filtered.isEmpty) {
      return ReceptionEmptyState(
        icon: Icons.build_circle_outlined,
        title: 'No Service Requests Found',
        subtitle: statusFilter != null || priorityFilter != null
            ? 'No requests match the selected filters'
            : 'No service requests yet. Create one to get started.',
        action: OutlinedButton.icon(
          onPressed: () => context.push('/reception/create-request').then((_) => _loadServiceRequests()),
          icon: const Icon(Icons.add_rounded),
          label: const Text('Create Request'),
          style: OutlinedButton.styleFrom(
            foregroundColor: ReceptionAnimationConstants.typeService,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadServiceRequests,
      color: ReceptionAnimationConstants.typeService,
      child: ListView.builder(
        padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
        itemCount: filtered.length,
        itemBuilder: (context, index) {
          return _buildServiceRequestItem(filtered[index]);
        },
      ),
    );
  }

  Widget _buildServiceRequestItem(Map<String, dynamic> request) {
    final isClosed =
        request['status'] == 'CLOSED' || request['status'] == 'COMPLETED';
    final isUnassigned = request['engineer_id'] == null;
    final isCritical = request['priority'] == 'CRITICAL';
    final isHigh = request['priority'] == 'HIGH';

    return Padding(
      padding: EdgeInsets.only(bottom: ReceptionAnimationConstants.spacingMd),
      child: GestureDetector(
        onTap: () => _showRequestDetails(request),
        child: AnimatedContainer(
          duration: ReceptionAnimationConstants.fade,
          curve: ReceptionAnimationConstants.defaultCurve,
          padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
          decoration: BoxDecoration(
            color: isClosed
                ? Colors.grey[50]
                : isUnassigned
                ? ReceptionAnimationConstants.warning.withOpacity(0.03)
                : Colors.white,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
            border: Border.all(
              color: isCritical && !isClosed
                  ? ReceptionAnimationConstants.danger.withOpacity(0.5)
                  : isHigh && !isClosed
                  ? ReceptionAnimationConstants.warning.withOpacity(0.5)
                  : isUnassigned && !isClosed
                  ? ReceptionAnimationConstants.warning.withOpacity(0.3)
                  : ReceptionAnimationConstants.border,
              width: isCritical || isHigh ? 1.5 : 1,
            ),
            boxShadow: isClosed
                ? null
                : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  // Customer info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          request['customer_name'] ?? 'Unknown',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: isClosed
                                ? Colors.grey[500]
                                : Colors.grey[800],
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Icon(
                              Icons.phone_outlined,
                              size: 12,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(width: 4),
                            Text(
                              request['phone'] ?? '',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Status and priority
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      ReceptionStatusChip(status: request['status'] ?? 'NEW'),
                      if ((isCritical || isHigh) && !isClosed) ...[
                        SizedBox(height: ReceptionAnimationConstants.spacingSm),
                        _buildPriorityBadge(request['priority']),
                      ],
                    ],
                  ),
                ],
              ),

              SizedBox(height: ReceptionAnimationConstants.spacingMd),

              // Machine model
              if (request['machine_model'] != null) ...[
                Row(
                  children: [
                    Icon(
                      Icons.precision_manufacturing_outlined,
                      size: 14,
                      color: isClosed
                          ? Colors.grey[400]
                          : ReceptionAnimationConstants.typeService,
                    ),
                    SizedBox(width: ReceptionAnimationConstants.spacingSm),
                    Text(
                      request['machine_model'],
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isClosed ? Colors.grey[500] : Colors.grey[700],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: ReceptionAnimationConstants.spacingSm),
              ],

              // Fault description
              if (request['fault_description'] != null) ...[
                Text(
                  request['fault_description'],
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    color: isClosed ? Colors.grey[400] : Colors.grey[600],
                  ),
                ),
                SizedBox(height: ReceptionAnimationConstants.spacingMd),
              ],

              // Footer row
              Row(
                children: [
                  // Assignment status
                  if (request['engineer_name'] != null)
                    Row(
                      children: [
                        Icon(
                          Icons.engineering_outlined,
                          size: 14,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          request['engineer_name'],
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    )
                  else if (!isClosed)
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: ReceptionAnimationConstants.spacingSm,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: ReceptionAnimationConstants.warning.withOpacity(
                          0.1,
                        ),
                        borderRadius: BorderRadius.circular(
                          ReceptionAnimationConstants.radiusSm,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.warning_amber_rounded,
                            size: 12,
                            color: ReceptionAnimationConstants.warning,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Unassigned',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: ReceptionAnimationConstants.warning,
                            ),
                          ),
                        ],
                      ),
                    ),

                  const Spacer(),

                  // Date
                  if (request['created_at'] != null)
                    Text(
                      _formatDate(request['created_at']),
                      style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    Color color;
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        color = ReceptionAnimationConstants.danger;
        break;
      case 'HIGH':
        color = ReceptionAnimationConstants.warning;
        break;
      case 'LOW':
        color = ReceptionAnimationConstants.success;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: ReceptionAnimationConstants.spacingSm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(
          ReceptionAnimationConstants.radiusSm,
        ),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        priority.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  void _showRequestDetails(Map<String, dynamic> request) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildDetailsSheet(request),
    );
  }

  Widget _buildDetailsSheet(Map<String, dynamic> request) {
    final isClosed =
        request['status'] == 'CLOSED' || request['status'] == 'COMPLETED';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(ReceptionAnimationConstants.radiusLg),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: EdgeInsets.only(top: ReceptionAnimationConstants.spacingMd),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          Padding(
            padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: EdgeInsets.all(
                        ReceptionAnimationConstants.spacingMd,
                      ),
                      decoration: BoxDecoration(
                        color: ReceptionAnimationConstants.typeService
                            .withOpacity(0.1),
                        borderRadius: BorderRadius.circular(
                          ReceptionAnimationConstants.radiusMd,
                        ),
                      ),
                      child: Icon(
                        Icons.build_outlined,
                        color: ReceptionAnimationConstants.typeService,
                      ),
                    ),
                    SizedBox(width: ReceptionAnimationConstants.spacingMd),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            request['customer_name'] ?? 'Unknown',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[800],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            request['phone'] ?? '',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        ReceptionStatusChip(status: request['status'] ?? 'NEW'),
                        if (request['priority'] != null &&
                            request['priority'] != 'NORMAL')
                          Padding(
                            padding: EdgeInsets.only(
                              top: ReceptionAnimationConstants.spacingSm,
                            ),
                            child: _buildPriorityBadge(request['priority']),
                          ),
                      ],
                    ),
                  ],
                ),

                SizedBox(height: ReceptionAnimationConstants.spacingLg),

                // Info rows
                if (request['machine_model'] != null)
                  ReceptionInfoRow(
                    icon: Icons.precision_manufacturing_outlined,
                    label: 'Machine Model',
                    value: request['machine_model'],
                  ),

                ReceptionInfoRow(
                  icon: Icons.error_outline,
                  label: 'Fault Description',
                  value: request['fault_description'] ?? 'Not specified',
                ),

                if (request['engineer_name'] != null)
                  ReceptionInfoRow(
                    icon: Icons.engineering_outlined,
                    label: 'Assigned Engineer',
                    value: request['engineer_name'],
                  ),

                if (request['address'] != null)
                  ReceptionInfoRow(
                    icon: Icons.location_on_outlined,
                    label: 'Address',
                    value: request['address'],
                  ),

                if (request['email'] != null)
                  ReceptionInfoRow(
                    icon: Icons.email_outlined,
                    label: 'Email',
                    value: request['email'],
                  ),

                SizedBox(height: ReceptionAnimationConstants.spacingLg),

                // Actions
                if (!isClosed)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            context.push(
                              '/reception/assign',
                              extra: {
                                'requestId': request['id'].toString(),
                                'requestType': 'SERVICE',
                                'customerName': request['customer_name'],
                                'currentAssignee': request['engineer_name'],
                              },
                            ).then((_) => _loadServiceRequests());
                          },
                          icon: const Icon(
                            Icons.person_add_alt_1_outlined,
                            size: 18,
                          ),
                          label: Text(
                            request['engineer_id'] == null
                                ? 'Assign Engineer'
                                : 'Reassign',
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor:
                                ReceptionAnimationConstants.typeService,
                            side: BorderSide(
                              color: ReceptionAnimationConstants.typeService,
                            ),
                            minimumSize: Size(
                              0,
                              ReceptionAnimationConstants.minTouchTarget,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                SizedBox(height: ReceptionAnimationConstants.spacingLg),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatStatus(String status) {
    return status
        .replaceAll('_', ' ')
        .split(' ')
        .map((word) {
          if (word.isEmpty) return word;
          return word[0].toUpperCase() + word.substring(1).toLowerCase();
        })
        .join(' ');
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 60) {
        return '${diff.inMinutes}m ago';
      } else if (diff.inHours < 24) {
        return '${diff.inHours}h ago';
      } else if (diff.inDays < 7) {
        return '${diff.inDays}d ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return dateStr;
    }
  }
}
