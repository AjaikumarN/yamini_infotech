import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/salesman_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/salesman_ui_components.dart';
import 'followup_details_screen.dart';

/// Follow-ups Screen
///
/// Display sales calls/follow-ups from backend
/// Uses /api/sales/my-calls endpoint - NO mock fallbacks
///
/// Note: This uses 'calls' from backend which represent follow-ups/visits
class FollowupsScreen extends StatefulWidget {
  const FollowupsScreen({super.key});

  @override
  State<FollowupsScreen> createState() => _FollowupsScreenState();
}

class _FollowupsScreenState extends State<FollowupsScreen> {
  bool isLoading = true;
  List<dynamic> followups = [];
  String? error;

  @override
  void initState() {
    super.initState();
    _fetchFollowups();
  }

  Future<void> _fetchFollowups() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      // Use correct endpoint: /api/sales/my-calls
      print('📞 Fetching follow-ups from ${ApiConstants.SALESMAN_CALLS}');
      final response = await ApiService.instance.get(
        ApiConstants.SALESMAN_CALLS,
      );
      print(
        '📥 Response: success=${response.success}, data type=${response.data.runtimeType}',
      );

      if (response.success && response.data != null) {
        setState(() {
          if (response.data is List) {
            followups = response.data as List<dynamic>;
            print('✅ Loaded ${followups.length} follow-ups');
          } else {
            followups = [];
            print('⚠️ Data is not a list: ${response.data}');
          }
          isLoading = false;
        });
      } else {
        final errorMsg = response.message ?? 'Failed to load follow-ups';
        print('❌ Follow-ups error: $errorMsg');
        setState(() {
          error = errorMsg;
          followups = [];
          isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Follow-ups exception: $e');
      setState(() {
        error = e.toString();
        followups = [];
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Follow-ups'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchFollowups,
          ),
        ],
      ),
      body: isLoading
          ? const SalesmanLoadingState()
          : error != null
          ? _buildErrorState()
          : followups.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _fetchFollowups,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: followups.length,
                itemBuilder: (context, index) {
                  return SalesmanListItem(
                    staggerIndex: index,
                    child: _buildFollowupCard(followups[index]),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildErrorState() {
    return SalesmanEmptyState(
      icon: Icons.error_outline,
      title: 'Error Loading Follow-ups',
      subtitle: error ?? 'Something went wrong',
      action: SalesmanActionButton(
        label: 'Retry',
        icon: Icons.refresh,
        onPressed: _fetchFollowups,
      ),
    );
  }

  Widget _buildEmptyState() {
    return SalesmanEmptyState(
      icon: Icons.event_available,
      title: 'No Follow-ups',
      subtitle: 'No pending follow-ups scheduled',
    );
  }

  Widget _buildFollowupCard(Map<String, dynamic> followup) {
    final customerName = followup['customer_name'] ?? 'Unknown Customer';
    final scheduledDate = followup['scheduled_date'] ?? '';
    final status = followup['status'] ?? 'pending';
    final priority = followup['priority'] ?? 'normal';
    final notes = followup['notes'] ?? '';

    final statusColor = SalesmanAnimationConstants.getFollowupStatusColor(
      status,
    );

    // Check if overdue or due today
    bool isOverdue = status.toLowerCase() == 'overdue';
    bool isDueToday = false;
    if (scheduledDate.isNotEmpty && !isOverdue) {
      try {
        final scheduled = DateTime.parse(scheduledDate);
        final today = DateTime.now();
        isDueToday =
            scheduled.year == today.year &&
            scheduled.month == today.month &&
            scheduled.day == today.day;
        if (!isOverdue && scheduled.isBefore(today)) {
          isOverdue = true;
        }
      } catch (_) {}
    }

    // Determine card border color based on urgency
    Color urgencyColor = isOverdue
        ? Colors.red
        : isDueToday
        ? Colors.orange
        : Colors.green;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => FollowupDetailsScreen(followup: followup),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border(left: BorderSide(color: urgencyColor, width: 4)),
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
                      child: Icon(
                        isOverdue
                            ? Icons.warning
                            : isDueToday
                            ? Icons.today
                            : Icons.schedule,
                        color: statusColor,
                        size: 24,
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
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.calendar_today,
                              size: 12,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              scheduledDate.split('T')[0],
                              style: TextStyle(
                                fontSize: 12,
                                color: isOverdue
                                    ? Colors.red
                                    : Colors.grey.shade600,
                                fontWeight: isOverdue
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      SalesmanOverdueBadge(
                        isOverdue: isOverdue,
                        isDueToday: isDueToday,
                      ),
                      const SizedBox(height: 4),
                      Icon(Icons.chevron_right, color: Colors.grey.shade400),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  SalesmanStatusChip(status: status, type: 'followup'),
                  if (priority.toLowerCase() == 'high') ...[
                    const SizedBox(width: 8),
                    SalesmanPriorityChip(priority: 'HOT'),
                  ],
                ],
              ),
              if (notes.isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    notes,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
