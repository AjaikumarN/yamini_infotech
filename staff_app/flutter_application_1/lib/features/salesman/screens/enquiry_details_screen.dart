import 'package:flutter/material.dart';
import '../../../core/constants/salesman_animation_constants.dart';
import '../widgets/salesman_ui_components.dart';

/// Enquiry Details Screen
///
/// Display full details of an enquiry
/// - Customer name and contact details
/// - Enquiry status and priority
/// - Follow-up date
/// - Notes and history
class EnquiryDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> enquiry;

  const EnquiryDetailsScreen({super.key, required this.enquiry});

  @override
  Widget build(BuildContext context) {
    final customerName = enquiry['customer_name'] ?? 'Unknown Customer';
    final status = enquiry['status'] ?? 'pending';
    final priority = enquiry['priority'] ?? 'normal';
    final followUpDate = enquiry['follow_up_date'] ?? '';
    final enquiryId = enquiry['id']?.toString() ?? '';
    // Use empty string instead of N/A for missing values
    final phone = enquiry['phone'] ?? enquiry['contact_phone'] ?? '';
    final email = enquiry['email'] ?? enquiry['contact_email'] ?? '';
    final address = enquiry['address'] ?? '';
    // Use message field from API, fallback to notes for backward compatibility
    final message = enquiry['message'] ?? enquiry['notes'] ?? '';
    final createdAt = enquiry['created_at'] ?? enquiry['enquiry_date'] ?? '';
    final productInterest =
        enquiry['product_interest'] ?? enquiry['product'] ?? '';

    final statusColor = SalesmanAnimationConstants.getEnquiryStatusColor(
      status,
    );

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('Enquiry #$enquiryId'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Customer Info Card
            _EnquiryDetailSection(
              staggerIndex: 0,
              child: _buildSectionCard(
                context: context,
                title: 'Customer Information',
                icon: Icons.person,
                color: Colors.blue,
                children: [
                  _buildInfoRow('Name', customerName, Icons.badge),
                  _buildInfoRow('Phone', phone, Icons.phone),
                  _buildInfoRow('Email', email, Icons.email),
                  _buildInfoRow('Address', address, Icons.location_on),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Status Card
            _EnquiryDetailSection(
              staggerIndex: 1,
              child: _buildSectionCard(
                context: context,
                title: 'Enquiry Status',
                icon: Icons.info,
                color: statusColor,
                children: [
                  Row(
                    children: [
                      SalesmanStatusChip(status: status, type: 'enquiry'),
                      const SizedBox(width: 8),
                      SalesmanPriorityChip(priority: priority),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (followUpDate.isNotEmpty)
                    _buildInfoRow(
                      'Follow-up Date',
                      followUpDate.split('T')[0],
                      Icons.calendar_today,
                    ),
                  if (createdAt.isNotEmpty)
                    _buildInfoRow(
                      'Created',
                      createdAt.split('T')[0],
                      Icons.access_time,
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Product Interest Card
            _EnquiryDetailSection(
              staggerIndex: 2,
              child: _buildSectionCard(
                context: context,
                title: 'Product Interest',
                icon: Icons.shopping_bag,
                color: Colors.purple,
                children: [
                  if (productInterest.isNotEmpty)
                    _buildInfoRow('Product', productInterest, Icons.inventory),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Notes Card - showing address and customer message
            if (message.isNotEmpty || address.isNotEmpty)
              _EnquiryDetailSection(
                staggerIndex: 3,
                child: _buildSectionCard(
                  context: context,
                  title: 'Notes',
                  icon: Icons.notes,
                  color: Colors.teal,
                  children: [
                    if (address.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text('Address: $address', style: const TextStyle(fontSize: 14)),
                      ),
                    if (message.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text('Customer Message: $message', style: const TextStyle(fontSize: 14)),
                      ),
                  ],
                ),
              ),

            const SizedBox(height: 24),

            // Info Card
            _EnquiryDetailSection(
              staggerIndex: 4,
              child: Card(
                color: Colors.blue.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.info, color: Colors.blue.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Contact the customer to follow up on this enquiry. Use the phone button above to call directly.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blue.shade900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required BuildContext context,
    required String title,
    required IconData icon,
    required Color color,
    required List<Widget> children,
  }) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

/// Animated section wrapper for enquiry details
class _EnquiryDetailSection extends StatefulWidget {
  final int staggerIndex;
  final Widget child;

  const _EnquiryDetailSection({
    required this.staggerIndex,
    required this.child,
  });

  @override
  State<_EnquiryDetailSection> createState() => _EnquiryDetailSectionState();
}

class _EnquiryDetailSectionState extends State<_EnquiryDetailSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: SalesmanAnimationConstants.cardEntry,
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.entryCurve,
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.05), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _controller,
            curve: SalesmanAnimationConstants.entryCurve,
          ),
        );

    Future.delayed(
      SalesmanAnimationConstants.getCardStaggerDelay(widget.staggerIndex),
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
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(position: _slideAnimation, child: widget.child),
    );
  }
}
