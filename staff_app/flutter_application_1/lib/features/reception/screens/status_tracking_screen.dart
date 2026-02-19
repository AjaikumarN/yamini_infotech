import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/reception_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/reception_ui_components.dart';

/// Status Tracking Screen
///
/// Animation specs:
/// - Tab switch: slide + fade (150ms)
/// - Filter selection: chip highlight (100ms)
/// - Pull-to-refresh: standard Flutter indicator
/// - Item tap: scale 0.98 (80ms)
///
/// Features:
/// - Tab view (Enquiries/Service Requests)
/// - Status filter chips with counts
/// - Visual hierarchy (CLOSED muted, NEW highlighted)
/// - Date-based filtering
class StatusTrackingScreen extends StatefulWidget {
  const StatusTrackingScreen({super.key});

  @override
  State<StatusTrackingScreen> createState() => _StatusTrackingScreenState();
}

class _StatusTrackingScreenState extends State<StatusTrackingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Data
  List<Map<String, dynamic>> enquiries = [];
  List<Map<String, dynamic>> serviceRequests = [];

  // Loading states
  bool isLoadingEnquiries = true;
  bool isLoadingServiceRequests = true;

  // Filters
  String? enquiryStatusFilter;
  String? serviceStatusFilter;
  String dateFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) {
      HapticFeedback.selectionClick();
    }
  }

  Future<void> _loadData() async {
    await Future.wait([_loadEnquiries(), _loadServiceRequests()]);
  }

  Future<void> _loadEnquiries() async {
    setState(() => isLoadingEnquiries = true);

    try {
      final response = await ApiService.instance.get('/api/enquiries');

      if (response.success && response.data != null) {
        final data = response.data is List
            ? List<Map<String, dynamic>>.from(response.data)
            : <Map<String, dynamic>>[];

        if (mounted) {
          setState(() {
            enquiries = data;
            isLoadingEnquiries = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoadingEnquiries = false);
      }
    }
  }

  Future<void> _loadServiceRequests() async {
    setState(() => isLoadingServiceRequests = true);

    try {
      final response = await ApiService.instance.get('/api/service-requests');

      if (response.success && response.data != null) {
        final data = response.data is List
            ? List<Map<String, dynamic>>.from(response.data)
            : <Map<String, dynamic>>[];

        if (mounted) {
          setState(() {
            serviceRequests = data;
            isLoadingServiceRequests = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoadingServiceRequests = false);
      }
    }
  }

  List<Map<String, dynamic>> get _filteredEnquiries {
    var filtered = enquiries;

    // Status filter
    if (enquiryStatusFilter != null) {
      filtered = filtered
          .where((e) => e['status'] == enquiryStatusFilter)
          .toList();
    }

    // Date filter
    filtered = _applyDateFilter(filtered);

    return filtered;
  }

  List<Map<String, dynamic>> get _filteredServiceRequests {
    var filtered = serviceRequests;

    // Status filter
    if (serviceStatusFilter != null) {
      filtered = filtered
          .where((e) => e['status'] == serviceStatusFilter)
          .toList();
    }

    // Date filter
    filtered = _applyDateFilter(filtered);

    return filtered;
  }

  List<Map<String, dynamic>> _applyDateFilter(
    List<Map<String, dynamic>> items,
  ) {
    if (dateFilter == 'ALL') return items;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    return items.where((item) {
      final createdAt = item['created_at'] as String?;
      if (createdAt == null) return true;

      try {
        final date = DateTime.parse(createdAt);

        switch (dateFilter) {
          case 'TODAY':
            return date.isAfter(today);
          case 'WEEK':
            return date.isAfter(today.subtract(const Duration(days: 7)));
          case 'MONTH':
            return date.isAfter(today.subtract(const Duration(days: 30)));
          default:
            return true;
        }
      } catch (e) {
        return true;
      }
    }).toList();
  }

  Map<String, int> _getEnquiryStatusCounts() {
    final counts = <String, int>{};
    for (final e in enquiries) {
      final status = e['status'] as String? ?? 'UNKNOWN';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  Map<String, int> _getServiceStatusCounts() {
    final counts = <String, int>{};
    for (final s in serviceRequests) {
      final status = s['status'] as String? ?? 'UNKNOWN';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ReceptionAnimationConstants.neutralBg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Status Tracking',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: _buildTabBar(),
        ),
      ),
      body: Column(
        children: [
          // Date filter bar
          _buildDateFilterBar(),

          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [_buildEnquiriesTab(), _buildServiceRequestsTab()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: ReceptionAnimationConstants.border),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: ReceptionAnimationConstants.primary,
        unselectedLabelColor: Colors.grey[500],
        indicatorColor: ReceptionAnimationConstants.primary,
        indicatorWeight: 2,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        unselectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
        tabs: [
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.storefront_outlined, size: 18),
                const SizedBox(width: 8),
                Text('Enquiries (${enquiries.length})'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.build_outlined, size: 18),
                const SizedBox(width: 8),
                Text('Service (${serviceRequests.length})'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateFilterBar() {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: ReceptionAnimationConstants.spacingLg,
        vertical: ReceptionAnimationConstants.spacingMd,
      ),
      color: Colors.white,
      child: Row(
        children: [
          Icon(
            Icons.calendar_today_outlined,
            size: 16,
            color: Colors.grey[500],
          ),
          SizedBox(width: ReceptionAnimationConstants.spacingSm),
          Text(
            'Period:',
            style: TextStyle(fontSize: 13, color: Colors.grey[600]),
          ),
          SizedBox(width: ReceptionAnimationConstants.spacingMd),
          _buildDateChip('All', 'ALL'),
          SizedBox(width: ReceptionAnimationConstants.spacingSm),
          _buildDateChip('Today', 'TODAY'),
          SizedBox(width: ReceptionAnimationConstants.spacingSm),
          _buildDateChip('Week', 'WEEK'),
          SizedBox(width: ReceptionAnimationConstants.spacingSm),
          _buildDateChip('Month', 'MONTH'),
        ],
      ),
    );
  }

  Widget _buildDateChip(String label, String value) {
    final isSelected = dateFilter == value;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => dateFilter = value);
      },
      child: AnimatedContainer(
        duration: ReceptionAnimationConstants.chipTransition,
        padding: EdgeInsets.symmetric(
          horizontal: ReceptionAnimationConstants.spacingMd,
          vertical: ReceptionAnimationConstants.spacingSm,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? ReceptionAnimationConstants.primary.withOpacity(0.1)
              : Colors.grey[100],
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusSm,
          ),
          border: Border.all(
            color: isSelected
                ? ReceptionAnimationConstants.primary
                : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected
                ? ReceptionAnimationConstants.primary
                : Colors.grey[600],
          ),
        ),
      ),
    );
  }

  Widget _buildEnquiriesTab() {
    if (isLoadingEnquiries) {
      return const ReceptionSimpleLoading(message: 'Loading enquiries...');
    }

    final statusCounts = _getEnquiryStatusCounts();
    final filtered = _filteredEnquiries;

    return Column(
      children: [
        // Status filters
        _buildStatusFilterBar(
          statusCounts,
          enquiryStatusFilter,
          (status) => setState(() => enquiryStatusFilter = status),
          ReceptionAnimationConstants.typeSales,
        ),

        // List
        Expanded(
          child: filtered.isEmpty
              ? ReceptionEmptyState(
                  icon: Icons.inbox_outlined,
                  title: 'No Enquiries Found',
                  subtitle: enquiryStatusFilter != null
                      ? 'No enquiries with status "$enquiryStatusFilter"'
                      : 'No enquiries in the selected period',
                )
              : RefreshIndicator(
                  onRefresh: _loadEnquiries,
                  color: ReceptionAnimationConstants.typeSales,
                  child: ListView.builder(
                    padding: EdgeInsets.all(
                      ReceptionAnimationConstants.spacingLg,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      return _buildEnquiryItem(filtered[index]);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildServiceRequestsTab() {
    if (isLoadingServiceRequests) {
      return const ReceptionSimpleLoading(
        message: 'Loading service requests...',
      );
    }

    final statusCounts = _getServiceStatusCounts();
    final filtered = _filteredServiceRequests;

    return Column(
      children: [
        // Status filters
        _buildStatusFilterBar(
          statusCounts,
          serviceStatusFilter,
          (status) => setState(() => serviceStatusFilter = status),
          ReceptionAnimationConstants.typeService,
        ),

        // List
        Expanded(
          child: filtered.isEmpty
              ? ReceptionEmptyState(
                  icon: Icons.inbox_outlined,
                  title: 'No Service Requests Found',
                  subtitle: serviceStatusFilter != null
                      ? 'No requests with status "$serviceStatusFilter"'
                      : 'No service requests in the selected period',
                )
              : RefreshIndicator(
                  onRefresh: _loadServiceRequests,
                  color: ReceptionAnimationConstants.typeService,
                  child: ListView.builder(
                    padding: EdgeInsets.all(
                      ReceptionAnimationConstants.spacingLg,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      return _buildServiceItem(filtered[index]);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildStatusFilterBar(
    Map<String, int> counts,
    String? selected,
    void Function(String?) onSelect,
    Color accentColor,
  ) {
    final statuses = counts.keys.toList()..sort();

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: ReceptionAnimationConstants.spacingLg,
        vertical: ReceptionAnimationConstants.spacingMd,
      ),
      color: ReceptionAnimationConstants.neutralBg,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildStatusFilterChip(
              'All',
              counts.values.fold(0, (a, b) => a + b),
              selected == null,
              () => onSelect(null),
              accentColor,
            ),
            ...statuses.map(
              (status) => Padding(
                padding: EdgeInsets.only(
                  left: ReceptionAnimationConstants.spacingSm,
                ),
                child: _buildStatusFilterChip(
                  _formatStatus(status),
                  counts[status] ?? 0,
                  selected == status,
                  () => onSelect(status),
                  accentColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusFilterChip(
    String label,
    int count,
    bool isSelected,
    VoidCallback onTap,
    Color accentColor,
  ) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: ReceptionAnimationConstants.chipTransition,
        padding: EdgeInsets.symmetric(
          horizontal: ReceptionAnimationConstants.spacingMd,
          vertical: ReceptionAnimationConstants.spacingSm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? accentColor.withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusSm,
          ),
          border: Border.all(
            color: isSelected
                ? accentColor
                : ReceptionAnimationConstants.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? accentColor : Colors.grey[600],
              ),
            ),
            SizedBox(width: ReceptionAnimationConstants.spacingSm),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected ? accentColor : Colors.grey[200],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                count.toString(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : Colors.grey[600],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnquiryItem(Map<String, dynamic> enquiry) {
    final isClosed =
        enquiry['status'] == 'CLOSED' || enquiry['status'] == 'CONVERTED';
    final subtitle =
        enquiry['product_interest'] ?? enquiry['description'] ?? '';

    return ReceptionRequestListItem(
      customerName: enquiry['customer_name'] ?? 'Unknown',
      requestType: 'SALES',
      status: enquiry['status'] ?? 'NEW',
      subtitle: subtitle,
      assignedTo: enquiry['assigned_salesman_name'] ?? enquiry['salesman_name'],
      isMuted: isClosed,
      onTap: () => _showEnquiryDetails(enquiry),
    );
  }

  Widget _buildServiceItem(Map<String, dynamic> request) {
    final isClosed =
        request['status'] == 'CLOSED' || request['status'] == 'COMPLETED';
    final subtitle = request['fault_description'] ?? '';

    return ReceptionRequestListItem(
      customerName: request['customer_name'] ?? 'Unknown',
      requestType: 'SERVICE',
      status: request['status'] ?? 'NEW',
      subtitle: subtitle,
      assignedTo: request['engineer_name'],
      isMuted: isClosed,
      onTap: () => _showServiceDetails(request),
    );
  }

  void _showEnquiryDetails(Map<String, dynamic> enquiry) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildEnquiryDetailsSheet(enquiry),
    );
  }

  void _showServiceDetails(Map<String, dynamic> request) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildServiceDetailsSheet(request),
    );
  }

  Widget _buildEnquiryDetailsSheet(Map<String, dynamic> enquiry) {
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
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            enquiry['customer_name'] ?? 'Unknown',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[800],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            enquiry['phone'] ?? '',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    ReceptionStatusChip(status: enquiry['status'] ?? 'NEW'),
                  ],
                ),

                SizedBox(height: ReceptionAnimationConstants.spacingLg),

                // Info rows
                ReceptionInfoRow(
                  icon: Icons.shopping_bag_outlined,
                  label: 'Product Interest',
                  value: enquiry['product_interest'] ?? 'Not specified',
                ),

                if (enquiry['salesman_name'] != null)
                  ReceptionInfoRow(
                    icon: Icons.person_outline,
                    label: 'Assigned Salesman',
                    value: enquiry['salesman_name'],
                  ),

                if (enquiry['notes'] != null &&
                    enquiry['notes'].toString().isNotEmpty)
                  ReceptionInfoRow(
                    icon: Icons.notes_outlined,
                    label: 'Notes',
                    value: enquiry['notes'],
                  ),

                SizedBox(height: ReceptionAnimationConstants.spacingLg),

                // Actions
                if (enquiry['status'] != 'CLOSED' &&
                    enquiry['status'] != 'CONVERTED')
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.pop(context);
                            context.push(
                              '/reception/assign',
                              extra: {
                                'requestId': enquiry['id'].toString(),
                                'requestType': 'SALES',
                                'customerName': enquiry['customer_name'],
                                'currentAssignee': enquiry['salesman_name'],
                              },
                            );
                          },
                          icon: const Icon(
                            Icons.person_add_alt_1_outlined,
                            size: 18,
                          ),
                          label: Text(
                            enquiry['salesman_id'] == null
                                ? 'Assign'
                                : 'Reassign',
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor:
                                ReceptionAnimationConstants.typeSales,
                            side: BorderSide(
                              color: ReceptionAnimationConstants.typeSales,
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

  Widget _buildServiceDetailsSheet(Map<String, dynamic> request) {
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

                SizedBox(height: ReceptionAnimationConstants.spacingLg),

                // Actions
                if (request['status'] != 'CLOSED' &&
                    request['status'] != 'COMPLETED')
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
                            );
                          },
                          icon: const Icon(
                            Icons.person_add_alt_1_outlined,
                            size: 18,
                          ),
                          label: Text(
                            request['engineer_id'] == null
                                ? 'Assign'
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

  Widget _buildPriorityBadge(String priority) {
    Color color;
    switch (priority.toUpperCase()) {
      case 'HIGH':
        color = ReceptionAnimationConstants.warning;
        break;
      case 'CRITICAL':
        color = ReceptionAnimationConstants.danger;
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
}
