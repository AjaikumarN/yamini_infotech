import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/reception_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/reception_ui_components.dart';

/// Enquiries List Screen
///
/// Animation specs:
/// - List item: fade + slide (170ms), no animation during scroll
/// - Status chip: color transition only (120ms)
/// - Filter change: cross-fade (160ms)
/// - Pull to refresh: standard material only
///
/// Features:
/// - Quick visual scan with Sales tags
/// - Clear empty states
/// - Large touch targets
class EnquiriesListScreen extends StatefulWidget {
  const EnquiriesListScreen({super.key});

  @override
  State<EnquiriesListScreen> createState() => _EnquiriesListScreenState();
}

class _EnquiriesListScreenState extends State<EnquiriesListScreen> {
  bool isLoading = true;
  String? error;
  List<Map<String, dynamic>> enquiries = [];
  String filter = 'ALL';
  bool _isInitialLoad = true;

  @override
  void initState() {
    super.initState();
    _fetchEnquiries();
  }

  Future<void> _fetchEnquiries() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await ApiService.instance.get('/api/enquiries');
      if (response.success && response.data != null) {
        setState(() {
          enquiries = List<Map<String, dynamic>>.from(response.data as List);
          isLoading = false;
          _isInitialLoad = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load enquiries';
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

  List<Map<String, dynamic>> get filteredEnquiries {
    // Filter out closed/cancelled/converted
    final openEnquiries = enquiries.where((e) {
      final status = e['status']?.toString().toUpperCase() ?? '';
      return status != 'CLOSED' &&
          status != 'CANCELLED' &&
          status != 'CONVERTED';
    }).toList();

    switch (filter) {
      case 'UNASSIGNED':
        return openEnquiries.where((e) => e['assigned_to'] == null).toList();
      case 'ASSIGNED':
        return openEnquiries.where((e) => e['assigned_to'] != null).toList();
      default:
        return openEnquiries;
    }
  }

  int get unassignedCount => enquiries.where((e) {
    final status = e['status']?.toString().toUpperCase() ?? '';
    return e['assigned_to'] == null &&
        status != 'CLOSED' &&
        status != 'CANCELLED' &&
        status != 'CONVERTED';
  }).length;

  int get assignedCount => enquiries.where((e) {
    final status = e['status']?.toString().toUpperCase() ?? '';
    return e['assigned_to'] != null &&
        status != 'CLOSED' &&
        status != 'CANCELLED' &&
        status != 'CONVERTED';
  }).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ReceptionAnimationConstants.neutralBg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Enquiries',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: Colors.grey[700]),
            onPressed: _fetchEnquiries,
            tooltip: 'Refresh',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          HapticFeedback.lightImpact();
          await context.push('/reception/create-request');
          _fetchEnquiries();
        },
        backgroundColor: ReceptionAnimationConstants.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(
            child: ReceptionLoadingState(
              isLoading: isLoading,
              child: error != null
                  ? _buildErrorState()
                  : filteredEnquiries.isEmpty
                  ? _buildEmptyState()
                  : ReceptionFilterCrossFade(
                      filterKey: filter,
                      child: RefreshIndicator(
                        onRefresh: _fetchEnquiries,
                        color: ReceptionAnimationConstants.primary,
                        child: ListView.builder(
                          padding: EdgeInsets.all(
                            ReceptionAnimationConstants.spacingLg,
                          ),
                          itemCount: filteredEnquiries.length,
                          itemBuilder: (context, index) {
                            return _buildEnquiryCard(
                              filteredEnquiries[index],
                              index,
                            );
                          },
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: EdgeInsets.all(ReceptionAnimationConstants.spacingMd),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: ReceptionAnimationConstants.border),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            ReceptionFilterChip(
              label: 'All',
              isSelected: filter == 'ALL',
              onTap: () => setState(() => filter = 'ALL'),
              count: unassignedCount + assignedCount,
            ),
            SizedBox(width: ReceptionAnimationConstants.spacingSm),
            ReceptionFilterChip(
              label: 'Unassigned',
              isSelected: filter == 'UNASSIGNED',
              onTap: () => setState(() => filter = 'UNASSIGNED'),
              count: unassignedCount,
              selectedColor: ReceptionAnimationConstants.warning,
            ),
            SizedBox(width: ReceptionAnimationConstants.spacingSm),
            ReceptionFilterChip(
              label: 'Assigned',
              isSelected: filter == 'ASSIGNED',
              onTap: () => setState(() => filter = 'ASSIGNED'),
              count: assignedCount,
              selectedColor: ReceptionAnimationConstants.success,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return ReceptionEmptyState(
      icon: Icons.error_outline_rounded,
      title: 'Error loading enquiries',
      subtitle: error,
      action: ReceptionSubmitButton(
        label: 'Retry',
        icon: Icons.refresh_rounded,
        onPressed: _fetchEnquiries,
        width: 140,
      ),
    );
  }

  Widget _buildEmptyState() {
    String title;
    String subtitle;

    switch (filter) {
      case 'UNASSIGNED':
        title = 'No unassigned enquiries';
        subtitle = 'All enquiries have been assigned';
        break;
      case 'ASSIGNED':
        title = 'No assigned enquiries';
        subtitle = 'No enquiries have been assigned yet';
        break;
      default:
        title = 'No enquiries found';
        subtitle = 'Pull down to refresh or create a new enquiry';
    }

    return ReceptionEmptyState(
      icon: Icons.inbox_outlined,
      title: title,
      subtitle: subtitle,
    );
  }

  Widget _buildEnquiryCard(Map<String, dynamic> enquiry, int index) {
    final isAssigned = enquiry['assigned_to'] != null;
    final status = isAssigned ? 'ASSIGNED' : 'NEW';

    return ReceptionRequestListItem(
      customerName: enquiry['customer_name'] ?? 'Unknown',
      requestType: 'SALES',
      status: status,
      subtitle: enquiry['phone'] ?? '',
      assignedTo: isAssigned ? _getAssignedName(enquiry) : null,
      staggerIndex: index,
      animateEntry: _isInitialLoad && index < 5,
      onTap: () => _showEnquiryDetails(enquiry),
    );
  }

  String? _getAssignedName(Map<String, dynamic> enquiry) {
    final assignedTo = enquiry['assigned_to'];
    if (assignedTo == null) return null;
    if (assignedTo is Map) {
      return assignedTo['full_name'] ?? assignedTo['name'] ?? 'Assigned';
    }
    return 'Assigned';
  }

  void _showEnquiryDetails(Map<String, dynamic> enquiry) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _EnquiryDetailsSheet(
        enquiry: enquiry,
        onAssign: () {
          Navigator.pop(context);
          _navigateToAssign(enquiry);
        },
      ),
    ).then((_) => _fetchEnquiries());
  }

  void _navigateToAssign(Map<String, dynamic> enquiry) {
    context
        .push(
          '/reception/assign',
          extra: {
            'requestId': enquiry['id'].toString(),
            'requestType': 'SALES',
            'customerName': enquiry['customer_name'],
            'currentAssignee': enquiry['salesman_name'],
          },
        )
        .then((_) => _fetchEnquiries());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENQUIRY DETAILS SHEET
// ═══════════════════════════════════════════════════════════════════════════════

class _EnquiryDetailsSheet extends StatelessWidget {
  final Map<String, dynamic> enquiry;
  final VoidCallback onAssign;

  const _EnquiryDetailsSheet({required this.enquiry, required this.onAssign});

  @override
  Widget build(BuildContext context) {
    final isAssigned = enquiry['assigned_to'] != null;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(ReceptionAnimationConstants.radiusLg),
          ),
        ),
        child: Column(
          children: [
            // Handle
            Padding(
              padding: EdgeInsets.only(
                top: ReceptionAnimationConstants.spacingMd,
              ),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Content
            Expanded(
              child: SingleChildScrollView(
                controller: scrollController,
                padding: EdgeInsets.all(ReceptionAnimationConstants.spacingXl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: ReceptionAnimationConstants.typeSales
                                .withOpacity(0.1),
                            borderRadius: BorderRadius.circular(
                              ReceptionAnimationConstants.radiusSm,
                            ),
                          ),
                          child: Icon(
                            Icons.storefront_outlined,
                            color: ReceptionAnimationConstants.typeSales,
                            size: 24,
                          ),
                        ),
                        SizedBox(width: ReceptionAnimationConstants.spacingMd),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Sales Enquiry',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: ReceptionAnimationConstants.typeSales,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                enquiry['customer_name'] ?? 'Unknown',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        ReceptionStatusChip(
                          status: isAssigned ? 'ASSIGNED' : 'NEW',
                        ),
                      ],
                    ),
                    SizedBox(height: ReceptionAnimationConstants.spacingXl),

                    // Details
                    _buildDetailItem(
                      'Phone',
                      enquiry['phone'] ?? '-',
                      Icons.phone_outlined,
                    ),
                    _buildDetailItem(
                      'Email',
                      enquiry['email'] ?? '-',
                      Icons.email_outlined,
                    ),
                    _buildDetailItem(
                      'Address',
                      enquiry['address'] ?? enquiry['notes'] ?? '-',
                      Icons.location_on_outlined,
                    ),
                    _buildDetailItem(
                      'Requirement',
                      enquiry['product_interest'] ??
                          enquiry['requirement'] ??
                          enquiry['description'] ??
                          '-',
                      Icons.description_outlined,
                    ),
                    _buildDetailItem(
                      'Created',
                      _formatDate(enquiry['created_at']),
                      Icons.schedule_outlined,
                    ),

                    if (isAssigned)
                      _buildDetailItem(
                        'Assigned To',
                        _getAssignedName() ?? 'Unknown',
                        Icons.person_outline,
                      ),

                    SizedBox(height: ReceptionAnimationConstants.spacingXl),

                    // Action
                    if (!isAssigned)
                      ReceptionSubmitButton(
                        label: 'Assign to Salesman',
                        icon: Icons.assignment_ind_outlined,
                        onPressed: onAssign,
                        backgroundColor: ReceptionAnimationConstants.typeSales,
                        width: double.infinity,
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Padding(
      padding: EdgeInsets.only(bottom: ReceptionAnimationConstants.spacingMd),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Colors.grey[400]),
          SizedBox(width: ReceptionAnimationConstants.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(fontSize: 14, color: Colors.grey[800]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year} at ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateStr;
    }
  }

  String? _getAssignedName() {
    final assignedTo = enquiry['assigned_to'];
    if (assignedTo == null) return null;
    if (assignedTo is Map) {
      return assignedTo['full_name'] ?? assignedTo['name'];
    }
    return 'Assigned';
  }
}
