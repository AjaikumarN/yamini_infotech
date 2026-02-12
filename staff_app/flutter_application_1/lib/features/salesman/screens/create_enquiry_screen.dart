import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/salesman_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/salesman_ui_components.dart';

/// Create Enquiry Screen
///
/// Allows salesman to create new enquiries
/// Can be pre-filled with data from customer visit
class CreateEnquiryScreen extends StatefulWidget {
  final String? customerName;
  final String? visitPurpose;
  final String? phone;
  final String? address;

  const CreateEnquiryScreen({
    super.key,
    this.customerName,
    this.visitPurpose,
    this.phone,
    this.address,
  });

  @override
  State<CreateEnquiryScreen> createState() => _CreateEnquiryScreenState();
}

class _CreateEnquiryScreenState extends State<CreateEnquiryScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;

  // Form controllers
  late TextEditingController _customerNameController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _productInterestController;
  late TextEditingController _notesController;

  String _priority = 'WARM';

  @override
  void initState() {
    super.initState();
    // Initialize controllers with pre-filled data if available
    _customerNameController = TextEditingController(
      text: widget.customerName ?? '',
    );
    _phoneController = TextEditingController(text: widget.phone ?? '');
    _emailController = TextEditingController();
    _productInterestController = TextEditingController(
      text: widget.visitPurpose ?? '',
    );
    _notesController = TextEditingController(
      text: widget.address != null ? 'Address: ${widget.address}' : '',
    );
  }

  @override
  void dispose() {
    _customerNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _productInterestController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitEnquiry() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    HapticFeedback.mediumImpact();

    try {
      final response = await ApiService.instance.post(
        ApiConstants.ENQUIRIES,
        body: {
          'customer_name': _customerNameController.text.trim(),
          'phone': _phoneController.text.trim().isEmpty
              ? null
              : _phoneController.text.trim(),
          'email': _emailController.text.trim().isEmpty
              ? null
              : _emailController.text.trim(),
          'product_interest': _productInterestController.text.trim().isEmpty
              ? null
              : _productInterestController.text.trim(),
          'priority': _priority,
          'notes': _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
          'source': 'salesman_app',
        },
      );

      if (response.success) {
        HapticFeedback.heavyImpact();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Enquiry created successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).pop(true); // Return success
        }
      } else {
        throw Exception(response.message ?? 'Failed to create enquiry');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
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
        title: const Text('Create Enquiry'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Pre-filled banner if coming from visit
              if (widget.customerName != null) ...[
                _buildPreFilledBanner(),
                const SizedBox(height: 20),
              ],

              // Customer Name
              _buildSectionTitle('Customer Information'),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _customerNameController,
                label: 'Customer Name',
                icon: Icons.person,
                required: true,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Customer name is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Phone
              _buildTextField(
                controller: _phoneController,
                label: 'Phone Number',
                icon: Icons.phone,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),

              // Email
              _buildTextField(
                controller: _emailController,
                label: 'Email',
                icon: Icons.email,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 24),

              // Product Interest
              _buildSectionTitle('Enquiry Details'),
              const SizedBox(height: 12),
              _buildTextField(
                controller: _productInterestController,
                label: 'Product Interest',
                icon: Icons.inventory_2,
                hint: 'e.g., Xerox Machine, Printer, etc.',
              ),
              const SizedBox(height: 16),

              // Priority Selection
              _buildPrioritySelector(),
              const SizedBox(height: 16),

              // Notes
              _buildTextField(
                controller: _notesController,
                label: 'Notes',
                icon: Icons.notes,
                maxLines: 3,
                hint: 'Additional details about the enquiry...',
              ),
              const SizedBox(height: 32),

              // Submit Button
              SalesmanActionButton(
                label: _isSubmitting ? 'Creating...' : 'Create Enquiry',
                icon: _isSubmitting ? Icons.hourglass_empty : Icons.add_circle,
                onPressed: _isSubmitting ? null : _submitEnquiry,
                color: SalesmanAnimationConstants.statusCompleted,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreFilledBanner() {
    const infoColor = Color(0xFF2196F3); // Blue info color
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: infoColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: infoColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.auto_awesome, color: infoColor, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Auto-filled from Customer Visit',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: infoColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Review and complete the enquiry details',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    bool required = false,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: required ? '$label *' : label,
        hintText: hint,
        prefixIcon: Icon(icon, color: Colors.grey[600]),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: SalesmanAnimationConstants.statusNew,
            width: 2,
          ),
        ),
        filled: true,
        fillColor: Colors.grey[50],
      ),
    );
  }

  Widget _buildPrioritySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Priority',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildPriorityChip('HOT', Colors.red),
            const SizedBox(width: 8),
            _buildPriorityChip('WARM', Colors.orange),
            const SizedBox(width: 8),
            _buildPriorityChip('COLD', Colors.blue),
          ],
        ),
      ],
    );
  }

  Widget _buildPriorityChip(String priority, Color color) {
    final isSelected = _priority == priority;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _priority = priority);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.15) : Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected) ...[
              Icon(Icons.check_circle, size: 16, color: color),
              const SizedBox(width: 6),
            ],
            Text(
              priority,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? color : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
