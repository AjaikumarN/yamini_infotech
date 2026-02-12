import 'package:flutter/material.dart';

/// Order Details Screen
///
/// Shows complete details of an order including:
/// - Order information (ID, date, status)
/// - Customer details
/// - Order items with quantities and prices
/// - Payment and delivery information
class OrderDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> order;

  const OrderDetailsScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final orderId =
        order['id']?.toString() ?? order['order_id']?.toString() ?? 'N/A';
    final customerName = order['customer_name'] ?? 'Unknown Customer';
    final phone = order['phone'] ?? 'N/A';
    final email = order['email'] ?? 'N/A';
    final address = order['address'] ?? '';
    final amount = order['amount'] ?? order['total'] ?? 0;
    final status = order['status'] ?? 'pending';
    final orderDate = order['order_date'] ?? order['created_at'] ?? '';
    final paymentMethod = order['payment_method'] ?? 'N/A';
    final paymentStatus = order['payment_status'] ?? 'pending';
    final deliveryDate = order['delivery_date'] ?? '';
    final notes = order['notes'] ?? '';
    final items = order['items'] as List<dynamic>? ?? [];

    Color statusColor;
    IconData statusIcon;
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        break;
      case 'processing':
      case 'in_progress':
        statusColor = Colors.blue;
        statusIcon = Icons.sync;
        break;
      case 'pending':
        statusColor = Colors.orange;
        statusIcon = Icons.schedule;
        break;
      case 'cancelled':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
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
        title: Text('Order #$orderId'),
        actions: [
          IconButton(
            icon: const Icon(Icons.print),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Print feature coming in Phase-2'),
                ),
              );
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
                      Text(
                        'Order #$orderId',
                        style: TextStyle(
                          color: statusColor.withValues(alpha: 0.8),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.currency_rupee,
                            size: 20,
                            color: Colors.green.shade700,
                          ),
                          Text(
                            amount.toString(),
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.green.shade700,
                            ),
                          ),
                        ],
                      ),
                      if (orderDate.isNotEmpty)
                        Text(
                          orderDate,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Customer Information
            _buildSectionHeader(context, 'Customer', Icons.person),
            const SizedBox(height: 12),
            _buildInfoCard([
              _buildInfoRow(Icons.person, 'Name', customerName),
              _buildInfoRow(Icons.phone, 'Phone', phone),
              _buildInfoRow(Icons.email, 'Email', email),
              if (address.isNotEmpty)
                _buildInfoRow(Icons.location_on, 'Address', address),
            ]),

            const SizedBox(height: 24),

            // Order Items
            _buildSectionHeader(context, 'Order Items', Icons.shopping_bag),
            const SizedBox(height: 12),
            if (items.isNotEmpty)
              Card(
                elevation: 1,
                child: Column(
                  children: [
                    ...items.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value as Map<String, dynamic>;
                      return Column(
                        children: [
                          _buildOrderItem(item),
                          if (index < items.length - 1)
                            const Divider(height: 1),
                        ],
                      );
                    }),
                  ],
                ),
              )
            else
              Card(
                elevation: 1,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.grey.shade400),
                      const SizedBox(width: 12),
                      const Text(
                        'No items available',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 24),

            // Payment Information
            _buildSectionHeader(context, 'Payment', Icons.payment),
            const SizedBox(height: 12),
            _buildInfoCard([
              _buildInfoRow(Icons.credit_card, 'Method', paymentMethod),
              _buildInfoRow(
                Icons.circle,
                'Status',
                paymentStatus.toString().toUpperCase(),
              ),
            ]),

            const SizedBox(height: 24),

            // Delivery Information
            if (deliveryDate.isNotEmpty) ...[
              _buildSectionHeader(context, 'Delivery', Icons.local_shipping),
              const SizedBox(height: 12),
              _buildInfoCard([
                _buildInfoRow(Icons.calendar_today, 'Expected', deliveryDate),
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

            // Order Summary
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total Amount',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Row(
                    children: [
                      Icon(
                        Icons.currency_rupee,
                        size: 24,
                        color: Colors.green.shade700,
                      ),
                      Text(
                        amount.toString(),
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderItem(Map<String, dynamic> item) {
    final name = item['name'] ?? 'Unknown Item';
    final quantity = item['quantity'] ?? 1;
    final price = item['price'] ?? 0;
    final total = item['total'] ?? (quantity * price);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.orange.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '${quantity}x',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.orange.shade700,
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
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.currency_rupee,
                      size: 12,
                      color: Colors.grey.shade600,
                    ),
                    Text(
                      '$price x $quantity',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Row(
            children: [
              Icon(
                Icons.currency_rupee,
                size: 14,
                color: Colors.green.shade700,
              ),
              Text(
                total.toString(),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.green.shade700,
                ),
              ),
            ],
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
