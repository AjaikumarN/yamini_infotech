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
  bool _isCreating = false;

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

  Future<void> _showCreateOrderDialog() async {
    // First fetch enquiries that are CONVERTED (eligible for ordering)
    final enquiriesResponse = await ApiService.instance.get(ApiConstants.ENQUIRIES);
    
    if (!enquiriesResponse.success || enquiriesResponse.data == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(enquiriesResponse.message ?? 'Failed to load enquiries'), backgroundColor: Colors.red),
        );
      }
      return;
    }

    final allEnquiries = enquiriesResponse.data is List ? enquiriesResponse.data as List : [];
    // Filter to show CONVERTED enquiries (ready for order)
    final enquiries = allEnquiries.where((e) {
      final status = (e['status'] ?? '').toString().toLowerCase();
      return status == 'converted' || status == 'qualified' || status == 'new';
    }).toList();

    if (!mounted) return;

    if (enquiries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No enquiries available for creating orders'), backgroundColor: Colors.orange),
      );
      return;
    }

    // Show bottom sheet with enquiry selection and order form
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _CreateOrderSheet(enquiries: enquiries),
    );

    if (result == null || !mounted) return;

    // Create the order
    setState(() => _isCreating = true);
    try {
      final response = await ApiService.instance.post(
        ApiConstants.ORDERS,
        body: result,
      );
      if (response.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Order created successfully!'), backgroundColor: Colors.green),
          );
          _fetchOrders();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(response.message ?? 'Failed to create order'), backgroundColor: Colors.red),
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
      if (mounted) setState(() => _isCreating = false);
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isCreating ? null : _showCreateOrderDialog,
        icon: _isCreating
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.add),
        label: Text(_isCreating ? 'Creating...' : 'Create Order'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
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

/// Bottom sheet for creating a new order from an enquiry
class _CreateOrderSheet extends StatefulWidget {
  final List<dynamic> enquiries;
  const _CreateOrderSheet({required this.enquiries});

  @override
  State<_CreateOrderSheet> createState() => _CreateOrderSheetState();
}

class _CreateOrderSheetState extends State<_CreateOrderSheet> {
  Map<String, dynamic>? _selectedEnquiry;
  final _quantityController = TextEditingController(text: '1');
  final _discountController = TextEditingController(text: '0');
  final _notesController = TextEditingController();
  DateTime? _expectedDelivery;

  @override
  void dispose() {
    _quantityController.dispose();
    _discountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20, right: 20, top: 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Create New Order', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            
            // Enquiry Selection
            const Text('Select Enquiry *', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButton<Map<String, dynamic>>(
                isExpanded: true,
                underline: const SizedBox(),
                hint: const Text('Choose an enquiry'),
                value: _selectedEnquiry,
                items: widget.enquiries.map<DropdownMenuItem<Map<String, dynamic>>>((e) {
                  final enquiry = e as Map<String, dynamic>;
                  final name = enquiry['customer_name'] ?? 'Customer #${enquiry['id']}';
                  final product = enquiry['product_name'] ?? enquiry['product_interest'] ?? '';
                  return DropdownMenuItem(
                    value: enquiry,
                    child: Text('$name - $product', overflow: TextOverflow.ellipsis),
                  );
                }).toList(),
                onChanged: (val) => setState(() => _selectedEnquiry = val),
              ),
            ),
            const SizedBox(height: 16),
            
            // Quantity
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Quantity *', style: TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _quantityController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Discount %', style: TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _discountController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Expected Delivery
            const Text('Expected Delivery', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 7)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) setState(() => _expectedDelivery = date);
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _expectedDelivery != null
                      ? '${_expectedDelivery!.day}/${_expectedDelivery!.month}/${_expectedDelivery!.year}'
                      : 'Tap to select date',
                  style: TextStyle(color: _expectedDelivery != null ? Colors.black : Colors.grey),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // Notes
            const Text('Notes', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Optional order notes...',
                contentPadding: EdgeInsets.all(12),
              ),
            ),
            const SizedBox(height: 24),
            
            // Submit
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _selectedEnquiry == null ? null : () {
                  final qty = int.tryParse(_quantityController.text) ?? 1;
                  final discount = double.tryParse(_discountController.text) ?? 0;
                  
                  final body = <String, dynamic>{
                    'enquiry_id': _selectedEnquiry!['id'],
                    'quantity': qty,
                  };
                  if (discount > 0) body['discount_percent'] = discount;
                  if (_expectedDelivery != null) {
                    body['expected_delivery_date'] = _expectedDelivery!.toIso8601String();
                  }
                  if (_notesController.text.trim().isNotEmpty) {
                    body['notes'] = _notesController.text.trim();
                  }
                  
                  Navigator.pop(context, body);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Create Order', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
