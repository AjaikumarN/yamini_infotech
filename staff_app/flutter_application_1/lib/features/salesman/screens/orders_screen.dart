import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/salesman_ui_components.dart';
import 'order_details_screen.dart';

/// Orders Screen
///
/// Display sales orders (read-only)
/// Uses real backend data - NO mock fallbacks
class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  bool isLoading = true;
  List<dynamic> orders = [];
  String? error;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      // Use correct endpoint: /api/orders
      final response = await ApiService.instance.get(ApiConstants.ORDERS);

      if (response.success && response.data != null) {
        setState(() {
          if (response.data is List) {
            orders = response.data as List<dynamic>;
          } else {
            orders = [];
          }
          isLoading = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load orders';
          orders = [];
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Connection error: ${e.toString()}';
        orders = [];
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
        title: const Text('Orders'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchOrders),
        ],
      ),
      body: isLoading
          ? const SalesmanLoadingState()
          : error != null
          ? _buildErrorState()
          : orders.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _fetchOrders,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: orders.length,
                itemBuilder: (context, index) {
                  return SalesmanListItem(
                    staggerIndex: index,
                    child: _buildOrderCard(orders[index]),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildErrorState() {
    return SalesmanEmptyState(
      icon: Icons.error_outline,
      title: 'Error Loading Orders',
      subtitle: error ?? 'Something went wrong',
      action: SalesmanActionButton(
        label: 'Retry',
        icon: Icons.refresh,
        onPressed: _fetchOrders,
      ),
    );
  }

  Widget _buildEmptyState() {
    return SalesmanEmptyState(
      icon: Icons.shopping_cart_outlined,
      title: 'No Orders',
      subtitle: 'No orders found yet',
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final orderId =
        order['id']?.toString() ?? order['order_id']?.toString() ?? 'N/A';
    final customerName = order['customer_name'] ?? 'Unknown Customer';
    final amount = order['amount'] ?? order['total'] ?? 0;
    final status = order['status'] ?? 'pending';
    final orderDate = order['order_date'] ?? order['created_at'] ?? '';

    // Calculate days old for health indicator
    int daysOld = 0;
    bool isOverdue = false;
    if (orderDate.isNotEmpty) {
      try {
        final orderDateTime = DateTime.parse(orderDate);
        daysOld = DateTime.now().difference(orderDateTime).inDays;
        isOverdue = status.toLowerCase() == 'pending' && daysOld > 7;
      } catch (_) {}
    }

    final statusColor = status.toLowerCase() == 'completed'
        ? Colors.green
        : status.toLowerCase() == 'pending'
        ? Colors.orange
        : Colors.blue;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => OrderDetailsScreen(order: order),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Header with order ID and status
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '#$orderId',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: statusColor,
                      ),
                    ),
                  ),
                  const Spacer(),
                  SalesmanStatusChip(status: status, type: 'order'),
                  if (daysOld > 3 || isOverdue) ...[
                    const SizedBox(width: 8),
                    SalesmanOrderHealthIndicator(
                      daysOld: daysOld,
                      isOverdue: isOverdue,
                    ),
                  ],
                ],
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.orange.withOpacity(0.2),
                          Colors.orange.withOpacity(0.1),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.shopping_cart,
                        color: Colors.orange,
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
                        if (orderDate.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            orderDate.split('T')[0],
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.currency_rupee,
                          size: 16,
                          color: Colors.green.shade700,
                        ),
                        Text(
                          amount.toString(),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.green.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.chevron_right, color: Colors.grey.shade400),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
