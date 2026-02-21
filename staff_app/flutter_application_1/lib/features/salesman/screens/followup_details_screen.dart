import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/api_service.dart';

/// Followup Details Screen
///
/// Shows complete details of a follow-up including:
/// - Customer information (name, phone, email)
/// - Follow-up details (date, status, priority)
/// - Enquiry reference
/// - Notes and action items
class FollowupDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> followup;

  const FollowupDetailsScreen({super.key, required this.followup});

  @override
  State<FollowupDetailsScreen> createState() => _FollowupDetailsScreenState();
}

class _FollowupDetailsScreenState extends State<FollowupDetailsScreen> {
  bool _isLoading = false;
  late Map<String, dynamic> followup;

  @override
  void initState() {
    super.initState();
    followup = Map<String, dynamic>.from(widget.followup);
  }

  Future<void> _markComplete() async {
    final followupId = followup['id'] ?? followup['followup_id'];
    if (followupId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Follow-up ID not found'), backgroundColor: Colors.red),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as Complete?'),
        content: const Text('This follow-up will be marked as completed. This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Complete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);
    try {
      final response = await ApiService.instance.put(
        '/api/sales/calls/$followupId/complete',
      );
      if (response.success) {
        setState(() {
          followup['status'] = 'Completed';
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Follow-up marked as complete!'), backgroundColor: Colors.green),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response.message ?? 'Failed to complete'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _reschedule() async {
    final followupId = followup['id'] ?? followup['followup_id'];
    if (followupId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Follow-up ID not found'), backgroundColor: Colors.red),
      );
      return;
    }

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: 'Select new follow-up date',
    );

    if (picked == null) return;

    setState(() => _isLoading = true);
    try {
      final dateStr = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      final response = await ApiService.instance.put(
        '/api/sales/calls/$followupId/reschedule',
        body: {'new_date': dateStr},
      );
      if (response.success) {
        setState(() {
          followup['scheduled_date'] = dateStr;
          followup['status'] = 'Pending';
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Rescheduled to $dateStr'), backgroundColor: Colors.blue),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response.message ?? 'Failed to reschedule'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final customerName = followup['customer_name'] ?? 'Unknown Customer';
    final phone = followup['phone'] ?? 'N/A';
    final email = followup['email'] ?? 'N/A';
    final scheduledDate = followup['scheduled_date'] ?? '';
    final scheduledTime = followup['scheduled_time'] ?? '';
    final status = followup['status'] ?? 'pending';
    final priority = followup['priority'] ?? 'normal';
    final notes = followup['notes'] ?? '';
    final type = followup['type'] ?? 'call';
    final enquiryId = followup['enquiry_id'] ?? '';
    final productInterest = followup['product_interest'] ?? 'N/A';
    final createdAt = followup['created_at'] ?? '';
    final address = followup['address'] ?? '';

    Color statusColor;
    IconData statusIcon;
    switch (status.toLowerCase()) {
      case 'completed':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        break;
      case 'overdue':
        statusColor = Colors.red;
        statusIcon = Icons.warning;
        break;
      case 'pending':
        statusColor = Colors.orange;
        statusIcon = Icons.schedule;
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.help_outline;
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Follow-up Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone),
            onPressed: () async {
              if (phone != 'N/A' && phone.isNotEmpty) {
                final uri = Uri.parse('tel:$phone');
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri);
                } else {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Could not launch phone dialer')),
                    );
                  }
                }
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('No phone number available')),
                );
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: statusColor.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(statusIcon, color: statusColor, size: 32),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        status.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      if (priority.toLowerCase() == 'high')
                        Row(
                          children: [
                            Icon(
                              Icons.priority_high,
                              size: 14,
                              color: Colors.red,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'HIGH PRIORITY',
                              style: TextStyle(
                                color: Colors.red,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const Spacer(),
                  _buildTypeChip(type),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Customer Information
            _buildSectionHeader(context, 'Customer Information', Icons.person),
            const SizedBox(height: 12),
            _buildInfoCard([
              _buildInfoRow(Icons.person, 'Name', customerName),
              _buildInfoRow(Icons.phone, 'Phone', phone),
              _buildInfoRow(Icons.email, 'Email', email),
              if (address.isNotEmpty)
                _buildInfoRow(Icons.location_on, 'Address', address),
            ]),

            const SizedBox(height: 24),

            // Schedule Details
            _buildSectionHeader(context, 'Schedule', Icons.calendar_today),
            const SizedBox(height: 12),
            _buildInfoCard([
              _buildInfoRow(Icons.calendar_today, 'Date', scheduledDate),
              if (scheduledTime.isNotEmpty)
                _buildInfoRow(Icons.access_time, 'Time', scheduledTime),
              if (createdAt.isNotEmpty)
                _buildInfoRow(Icons.history, 'Created', createdAt),
            ]),

            const SizedBox(height: 24),

            // Enquiry Information
            if (enquiryId.isNotEmpty || productInterest != 'N/A') ...[
              _buildSectionHeader(context, 'Enquiry Details', Icons.assignment),
              const SizedBox(height: 12),
              _buildInfoCard([
                if (enquiryId.isNotEmpty)
                  _buildInfoRow(Icons.tag, 'Enquiry ID', enquiryId),
                _buildInfoRow(
                  Icons.shopping_bag,
                  'Product Interest',
                  productInterest,
                ),
              ]),
              const SizedBox(height: 24),
            ],

            // Notes
            if (notes.isNotEmpty) ...[
              _buildSectionHeader(context, 'Notes', Icons.note),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  notes,
                  style: const TextStyle(fontSize: 14, height: 1.5),
                ),
              ),
            ],

            const SizedBox(height: 32),

            // Action Buttons
            if (_isLoading)
              const Center(child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ))
            else if (status.toLowerCase() != 'completed')
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _reschedule,
                      icon: const Icon(Icons.event),
                      label: const Text('Reschedule'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _markComplete,
                      icon: const Icon(Icons.check),
                      label: const Text('Complete'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_circle, color: Colors.green),
                    SizedBox(width: 8),
                    Text('This follow-up is completed',
                      style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeChip(String type) {
    IconData icon;
    String label;
    switch (type.toLowerCase()) {
      case 'call':
        icon = Icons.phone;
        label = 'Call';
        break;
      case 'visit':
        icon = Icons.directions_walk;
        label = 'Visit';
        break;
      case 'email':
        icon = Icons.email;
        label = 'Email';
        break;
      case 'meeting':
        icon = Icons.groups;
        label = 'Meeting';
        break;
      default:
        icon = Icons.event;
        label = type;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.blue.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.blue),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.blue,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context,
    String title,
    IconData icon,
  ) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Theme.of(context).primaryColor),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: children),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
