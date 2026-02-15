import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/salesman_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/salesman_ui_components.dart';
import 'enquiry_details_screen.dart';
import 'create_enquiry_screen.dart';

/// Enquiries Screen
///
/// Display and manage customer enquiries assigned to salesman
/// Uses real backend data - NO mock fallbacks
class EnquiriesScreen extends StatefulWidget {
  const EnquiriesScreen({super.key});

  @override
  State<EnquiriesScreen> createState() => _EnquiriesScreenState();
}

class _EnquiriesScreenState extends State<EnquiriesScreen> {
  bool isLoading = true;
  List<dynamic> enquiries = [];
  String? error;
  String _statusFilter = 'all';

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
      // Use correct endpoint: /api/enquiries
      if (kDebugMode) print('📞 Fetching enquiries from ${ApiConstants.ENQUIRIES}');
      final response = await ApiService.instance.get(ApiConstants.ENQUIRIES);
      if (kDebugMode) print(
        '📥 Response: success=${response.success}, data type=${response.data.runtimeType}',
      );

      if (response.success && response.data != null) {
        setState(() {
          if (response.data is List) {
            enquiries = response.data as List<dynamic>;
            if (kDebugMode) print('✅ Loaded ${enquiries.length} enquiries');
          } else {
            enquiries = [];
            if (kDebugMode) print('⚠️ Data is not a list: ${response.data}');
          }
          isLoading = false;
        });
      } else {
        final errorMsg = response.message ?? 'Failed to load enquiries';
        if (kDebugMode) print('❌ Enquiries error: $errorMsg');
        setState(() {
          error = errorMsg;
          enquiries = [];
          isLoading = false;
        });
      }
    } catch (e) {
      if (kDebugMode) print('❌ Enquiries exception: $e');
      setState(() {
        error = e.toString();
        enquiries = [];
        isLoading = false;
      });
    }
  }

  List<dynamic> get _filteredEnquiries {
    if (_statusFilter == 'all') return enquiries;
    return enquiries
        .where(
          (e) =>
              (e['status']?.toString().toLowerCase() ?? '') ==
              _statusFilter.toLowerCase(),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Enquiries'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchEnquiries,
          ),
        ],
      ),
      floatingActionButton: Container(
        margin: const EdgeInsets.only(bottom: 20, left: 24, right: 24),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CreateEnquiryScreen(),
                ),
              );
              if (result == true) {
                _fetchEnquiries();
              }
            },
            borderRadius: BorderRadius.circular(28),
            child: Ink(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF3D9085),
                    Color(0xFF2E7D6F),
                    Color(0xFF256B5F),
                  ],
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2E7D6F).withOpacity(0.35),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                  BoxShadow(
                    color: const Color(0xFF2E7D6F).withOpacity(0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Container(
                height: 56,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.add_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Text(
                      'New Enquiry',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: Colors.white.withOpacity(0.7),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      body: Column(
        children: [
          // Status filter chips
          _buildFilterChips(),

          // Content
          Expanded(
            child: isLoading
                ? const SalesmanLoadingState()
                : error != null
                ? _buildErrorState()
                : _filteredEnquiries.isEmpty
                ? _buildEmptyState()
                : RefreshIndicator(
                    onRefresh: _fetchEnquiries,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _filteredEnquiries.length,
                      itemBuilder: (context, index) {
                        final enquiry = _filteredEnquiries[index];
                        return SalesmanListItem(
                          staggerIndex: index,
                          child: _buildEnquiryCard(enquiry),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          _buildChip('All', 'all'),
          _buildChip('New', 'new'),
          _buildChip('Contacted', 'contacted'),
          _buildChip('Qualified', 'qualified'),
          _buildChip('Converted', 'converted'),
          _buildChip('Lost', 'lost'),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String value) {
    final isSelected = _statusFilter == value;
    final color = _getFilterColor(value);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: SalesmanFilterChip(
        label: label,
        isSelected: isSelected,
        color: color,
        onTap: () => setState(() => _statusFilter = value),
      ),
    );
  }

  Color _getFilterColor(String value) {
    switch (value.toLowerCase()) {
      case 'new':
        return SalesmanAnimationConstants.statusNew;
      case 'contacted':
        return SalesmanAnimationConstants.statusContacted;
      case 'qualified':
        return SalesmanAnimationConstants.statusQualified;
      case 'converted':
        return SalesmanAnimationConstants.statusConverted;
      case 'lost':
        return SalesmanAnimationConstants.statusLost;
      default:
        return Colors.grey;
    }
  }

  Widget _buildErrorState() {
    return SalesmanEmptyState(
      icon: Icons.error_outline,
      title: 'Error Loading Enquiries',
      subtitle: error ?? 'Something went wrong',
      action: SalesmanActionButton(
        label: 'Retry',
        icon: Icons.refresh,
        onPressed: _fetchEnquiries,
      ),
    );
  }

  Widget _buildEmptyState() {
    return SalesmanEmptyState(
      icon: Icons.inbox,
      title: 'No Enquiries',
      subtitle: _statusFilter == 'all'
          ? 'No enquiries assigned to you yet'
          : 'No enquiries with status: $_statusFilter',
    );
  }

  Widget _buildEnquiryCard(Map<String, dynamic> enquiry) {
    final customerName = enquiry['customer_name'] ?? 'Unknown Customer';
    final status = enquiry['status'] ?? 'new';
    final priority = enquiry['priority'] ?? 'WARM';
    final productInterest = enquiry['product_interest'] ?? '';
    final phone = enquiry['phone'] ?? '';

    final statusColor = SalesmanAnimationConstants.getEnquiryStatusColor(
      status,
    );
    final priorityColor = SalesmanAnimationConstants.getPriorityColor(priority);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => EnquiryDetailsScreen(enquiry: enquiry),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border(left: BorderSide(color: priorityColor, width: 4)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          statusColor.withOpacity(0.2),
                          statusColor.withOpacity(0.1),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        customerName.isNotEmpty
                            ? customerName[0].toUpperCase()
                            : '?',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          customerName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (productInterest.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            productInterest,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: Colors.grey.shade400),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  SalesmanStatusChip(status: status, type: 'enquiry'),
                  const SizedBox(width: 8),
                  SalesmanPriorityChip(priority: priority),
                  const Spacer(),
                  if (phone.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.phone,
                            size: 14,
                            color: Colors.grey.shade600,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            phone,
                            style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
