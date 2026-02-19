import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/reception_animation_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/reception_ui_components.dart';

/// Create Request Screen
///
/// Animation specs:
/// - Field focus: label color transition (100ms)
/// - Form submit: button → inline loading spinner
/// - Form fades to 0.65 opacity during loading
/// - Success: auto-navigate back after 220ms
/// - No page shake, full-screen success animations
///
/// Features:
/// - Single column layout with clear sections
/// - Large touch targets
/// - Inline error text (no popups)
/// - Numeric keyboard for phone
class CreateRequestScreen extends StatefulWidget {
  const CreateRequestScreen({super.key});

  @override
  State<CreateRequestScreen> createState() => _CreateRequestScreenState();
}

class _CreateRequestScreenState extends State<CreateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  bool isLoading = false;
  bool isSuccess = false;

  // Request Type
  String requestType = 'SALES';

  // Form fields
  final _customerNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _requirementController = TextEditingController();
  final _emailController = TextEditingController();

  // Service-specific
  final _machineModelController = TextEditingController();
  String priority = 'NORMAL';

  @override
  void dispose() {
    _customerNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _requirementController.dispose();
    _emailController.dispose();
    _machineModelController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) {
      HapticFeedback.lightImpact();
      return;
    }

    setState(() => isLoading = true);
    HapticFeedback.lightImpact();

    try {
      if (requestType == 'SALES') {
        await _createEnquiry();
      } else {
        await _createServiceRequest();
      }

      if (mounted) {
        setState(() {
          isLoading = false;
          isSuccess = true;
        });

        HapticFeedback.mediumImpact();

        // Auto-navigate after success animation
        await Future.delayed(ReceptionAnimationConstants.successDuration);
        if (mounted) {
          context.pop();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: ReceptionAnimationConstants.danger,
          ),
        );
      }
    }
  }

  Future<void> _createEnquiry() async {
    final response = await ApiService.instance.post(
      '/api/enquiries',
      body: {
        'customer_name': _customerNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
        'product_interest': _requirementController.text.trim(),
        'description': _requirementController.text.trim(),
        'notes': 'Address: ${_addressController.text.trim()}',
        'source': 'RECEPTION',
      },
    );

    if (!response.success) {
      throw Exception(response.message ?? 'Failed to create enquiry');
    }
  }

  Future<void> _createServiceRequest() async {
    final response = await ApiService.instance.post(
      '/api/service-requests',
      body: {
        'customer_name': _customerNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
        'address': _addressController.text.trim(),
        'fault_description': _requirementController.text.trim(),
        'machine_model': _machineModelController.text.trim(),
        'priority': priority,
      },
    );

    if (!response.success) {
      throw Exception(response.message ?? 'Failed to create service request');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ReceptionAnimationConstants.neutralBg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Create Request',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
      ),
      body: ReceptionFormLoadingOverlay(
        isLoading: isLoading,
        child: Column(
          children: [
            // Form content
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildRequestTypeSelector(),
                      SizedBox(height: ReceptionAnimationConstants.spacingXl),
                      _buildCustomerSection(),
                      if (requestType == 'SERVICE') ...[
                        SizedBox(height: ReceptionAnimationConstants.spacingXl),
                        _buildServiceSection(),
                      ],
                      SizedBox(height: ReceptionAnimationConstants.spacingXl),
                      _buildRequirementSection(),
                      // Extra padding for sticky button
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ),
            // Sticky submit button
            _buildStickySubmitButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildRequestTypeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Request Type',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingMd),
        Row(
          children: [
            Expanded(
              child: _buildTypeButton(
                'Sales Enquiry',
                'SALES',
                Icons.storefront_outlined,
              ),
            ),
            SizedBox(width: ReceptionAnimationConstants.spacingMd),
            Expanded(
              child: _buildTypeButton(
                'Service Request',
                'SERVICE',
                Icons.build_outlined,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTypeButton(String label, String type, IconData icon) {
    final isSelected = requestType == type;
    final color = type == 'SALES'
        ? ReceptionAnimationConstants.typeSales
        : ReceptionAnimationConstants.typeService;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => requestType = type);
      },
      child: AnimatedContainer(
        duration: ReceptionAnimationConstants.chipTransition,
        curve: ReceptionAnimationConstants.defaultCurve,
        padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusMd,
          ),
          border: Border.all(
            color: isSelected ? color : ReceptionAnimationConstants.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? color : Colors.grey[400], size: 28),
            SizedBox(height: ReceptionAnimationConstants.spacingSm),
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? color : Colors.grey[600],
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Customer Details',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingMd),

        ReceptionInputField(
          controller: _customerNameController,
          label: 'Customer Name',
          prefixIcon: Icons.person_outline,
          isRequired: true,
          validator: (v) =>
              v?.trim().isEmpty == true ? 'Customer name is required' : null,
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingMd),

        ReceptionInputField(
          controller: _phoneController,
          label: 'Phone Number',
          prefixIcon: Icons.phone_outlined,
          isRequired: true,
          keyboardType: TextInputType.phone,
          validator: (v) =>
              v?.trim().isEmpty == true ? 'Phone number is required' : null,
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingMd),

        ReceptionInputField(
          controller: _emailController,
          label: 'Email',
          prefixIcon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingMd),

        ReceptionInputField(
          controller: _addressController,
          label: 'Address',
          prefixIcon: Icons.location_on_outlined,
          isRequired: true,
          maxLines: 2,
          validator: (v) =>
              v?.trim().isEmpty == true ? 'Address is required' : null,
        ),
      ],
    );
  }

  Widget _buildServiceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Service Details',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingMd),

        ReceptionInputField(
          controller: _machineModelController,
          label: 'Machine Model',
          prefixIcon: Icons.precision_manufacturing_outlined,
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingMd),

        _buildPrioritySelector(),
      ],
    );
  }

  Widget _buildPrioritySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Priority',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingSm),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
            border: Border.all(color: ReceptionAnimationConstants.border),
          ),
          child: Row(
            children: [
              _buildPriorityOption('LOW', ReceptionAnimationConstants.success),
              _buildPriorityOption(
                'NORMAL',
                ReceptionAnimationConstants.primary,
              ),
              _buildPriorityOption('HIGH', ReceptionAnimationConstants.warning),
              _buildPriorityOption(
                'CRITICAL',
                ReceptionAnimationConstants.danger,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPriorityOption(String value, Color color) {
    final isSelected = priority == value;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => priority = value);
        },
        child: AnimatedContainer(
          duration: ReceptionAnimationConstants.chipTransition,
          padding: EdgeInsets.symmetric(
            vertical: ReceptionAnimationConstants.spacingMd,
          ),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd - 1,
            ),
          ),
          child: Text(
            value,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? color : Colors.grey[500],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRequirementSection() {
    final label = requestType == 'SALES' ? 'Requirement' : 'Issue Description';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        SizedBox(height: ReceptionAnimationConstants.spacingMd),

        ReceptionInputField(
          controller: _requirementController,
          label: requestType == 'SALES'
              ? 'Customer requirement'
              : 'Fault description',
          prefixIcon: Icons.description_outlined,
          isRequired: true,
          maxLines: 4,
          validator: (v) =>
              v?.trim().isEmpty == true ? 'This field is required' : null,
        ),
      ],
    );
  }

  Widget _buildStickySubmitButton() {
    return Container(
      padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: ReceptionSubmitButton(
          label: 'Create Request',
          icon: Icons.send_rounded,
          isLoading: isLoading,
          isSuccess: isSuccess,
          onPressed: _submitRequest,
          backgroundColor: requestType == 'SALES'
              ? ReceptionAnimationConstants.typeSales
              : ReceptionAnimationConstants.typeService,
          width: double.infinity,
        ),
      ),
    );
  }
}
