import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/reception_animation_constants.dart';
import '../../../core/models/api_response.dart';
import '../../../core/services/api_service.dart';
import '../widgets/reception_ui_components.dart';

/// Assignment Screen
///
/// Animation specs:
/// - User selection: border highlight (100ms)
/// - Submit button: inline spinner
/// - Success: brief highlight flash on assigned user card
/// - Auto-navigate back after 220ms
/// - Disabled states: muted gray with explanation
///
/// Features:
/// - Smart dropdown (Salesmen for sales, Engineers for service)
/// - Request summary card at top
/// - Disabled state with explanation
/// - Large touch targets for user cards
class AssignmentScreen extends StatefulWidget {
  final Map<String, dynamic>? data;

  const AssignmentScreen({super.key, this.data});

  @override
  State<AssignmentScreen> createState() => _AssignmentScreenState();
}

class _AssignmentScreenState extends State<AssignmentScreen> {
  bool isLoadingUsers = true;
  bool isAssigning = false;
  bool isSuccess = false;

  List<Map<String, dynamic>> availableUsers = [];
  Map<String, dynamic>? selectedUser;
  String? errorMessage;

  // Extracted from data
  late final String requestId;
  late final String requestType;
  late final String? customerName;
  late final String? currentAssignee;

  @override
  void initState() {
    super.initState();
    // Extract data from the passed map
    requestId = widget.data?['requestId']?.toString() ?? '';
    requestType = widget.data?['requestType']?.toString() ?? 'SALES';
    customerName = widget.data?['customerName']?.toString();
    currentAssignee = widget.data?['currentAssignee']?.toString();
    _loadAvailableUsers();
  }

  Future<void> _loadAvailableUsers() async {
    setState(() {
      isLoadingUsers = true;
      errorMessage = null;
    });

    try {
      final endpoint = requestType == 'SALES'
          ? '/api/users/?role=SALESMAN'
          : '/api/users/?role=SERVICE_ENGINEER';

      final response = await ApiService.instance.get(endpoint);

      if (response.success && response.data != null) {
        final users = response.data is List
            ? List<Map<String, dynamic>>.from(response.data)
            : <Map<String, dynamic>>[];

        if (mounted) {
          setState(() {
            availableUsers = users;
            isLoadingUsers = false;
          });
        }
      } else {
        throw Exception(response.message ?? 'Failed to load users');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoadingUsers = false;
          errorMessage = 'Unable to load users: $e';
        });
      }
    }
  }

  Future<void> _assignUser() async {
    if (selectedUser == null) {
      HapticFeedback.lightImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Please select a ${requestType == 'SALES' ? 'salesman' : 'service engineer'}',
          ),
          backgroundColor: ReceptionAnimationConstants.warning,
        ),
      );
      return;
    }

    setState(() => isAssigning = true);
    HapticFeedback.lightImpact();

    try {
      late final ApiResponse response;
      
      if (requestType == 'SALES') {
        // Enquiries: PUT /api/enquiries/{id} with assigned_to in body
        response = await ApiService.instance.put(
          '/api/enquiries/$requestId',
          body: {'assigned_to': selectedUser!['id']},
        );
      } else {
        // Service Requests: PUT /api/service-requests/{id}/assign?engineer_id={id}
        response = await ApiService.instance.put(
          '/api/service-requests/$requestId/assign?engineer_id=${selectedUser!['id']}',
        );
      }

      if (!response.success) {
        throw Exception(response.message ?? 'Failed to assign');
      }

      if (mounted) {
        setState(() {
          isAssigning = false;
          isSuccess = true;
        });

        HapticFeedback.mediumImpact();

        // Auto-navigate after success animation
        await Future.delayed(ReceptionAnimationConstants.successDuration);
        if (mounted) {
          context.pop(true); // Return true to indicate successful assignment
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => isAssigning = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: ReceptionAnimationConstants.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSales = requestType == 'SALES';
    final roleLabel = isSales ? 'Salesman' : 'Service Engineer';
    final typeColor = isSales
        ? ReceptionAnimationConstants.typeSales
        : ReceptionAnimationConstants.typeService;

    return Scaffold(
      backgroundColor: ReceptionAnimationConstants.neutralBg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Assign $roleLabel',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
      ),
      body: Column(
        children: [
          // Request summary card
          _buildRequestSummary(typeColor),

          // Divider
          Container(height: 1, color: ReceptionAnimationConstants.border),

          // User selection list
          Expanded(child: _buildUserSelection(roleLabel, typeColor)),

          // Sticky assign button
          _buildStickyAssignButton(roleLabel, typeColor),
        ],
      ),
    );
  }

  Widget _buildRequestSummary(Color typeColor) {
    return Container(
      padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
      color: Colors.white,
      child: Row(
        children: [
          // Type indicator
          Container(
            padding: EdgeInsets.all(ReceptionAnimationConstants.spacingMd),
            decoration: BoxDecoration(
              color: typeColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(
                ReceptionAnimationConstants.radiusMd,
              ),
            ),
            child: Icon(
              requestType == 'SALES'
                  ? Icons.storefront_outlined
                  : Icons.build_outlined,
              color: typeColor,
              size: 24,
            ),
          ),
          SizedBox(width: ReceptionAnimationConstants.spacingMd),

          // Request info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  customerName ?? 'Request #$requestId',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    ReceptionTypeTag(type: requestType),
                    if (currentAssignee != null) ...[
                      SizedBox(width: ReceptionAnimationConstants.spacingSm),
                      Text(
                        '→ $currentAssignee',
                        style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserSelection(String roleLabel, Color typeColor) {
    if (isLoadingUsers) {
      return ReceptionSimpleLoading(message: 'Loading ${roleLabel}s...');
    }

    if (errorMessage != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(ReceptionAnimationConstants.spacingXl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: ReceptionAnimationConstants.danger,
              ),
              SizedBox(height: ReceptionAnimationConstants.spacingMd),
              Text(
                'Unable to Load Users',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                ),
              ),
              SizedBox(height: ReceptionAnimationConstants.spacingSm),
              Text(
                errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
              SizedBox(height: ReceptionAnimationConstants.spacingLg),
              TextButton.icon(
                onPressed: _loadAvailableUsers,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (availableUsers.isEmpty) {
      return ReceptionEmptyState(
        icon: Icons.people_outline_rounded,
        title: 'No ${roleLabel}s Available',
        subtitle:
            'There are no ${roleLabel.toLowerCase()}s in the system. Please contact admin.',
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
      itemCount: availableUsers.length + 1, // +1 for header
      itemBuilder: (context, index) {
        if (index == 0) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: ReceptionAnimationConstants.spacingMd,
            ),
            child: Text(
              'Select $roleLabel',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800],
              ),
            ),
          );
        }

        final user = availableUsers[index - 1];
        return _buildUserCard(user, typeColor);
      },
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user, Color typeColor) {
    final isSelected = selectedUser?['id'] == user['id'];
    final isAvailable = user['is_available'] ?? true;
    final name = user['full_name'] ?? user['username'] ?? 'Unknown';
    final email = user['email'] ?? '';
    final activeCount = user['active_assignments'] ?? 0;

    return Padding(
      padding: EdgeInsets.only(bottom: ReceptionAnimationConstants.spacingMd),
      child: GestureDetector(
        onTap: isAvailable
            ? () {
                HapticFeedback.selectionClick();
                setState(() => selectedUser = user);
              }
            : null,
        child: AnimatedContainer(
          duration: ReceptionAnimationConstants.chipTransition,
          curve: ReceptionAnimationConstants.defaultCurve,
          padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
          decoration: BoxDecoration(
            color: isSuccess && isSelected
                ? ReceptionAnimationConstants.success.withOpacity(0.1)
                : isSelected
                ? typeColor.withOpacity(0.05)
                : Colors.white,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
            border: Border.all(
              color: isSuccess && isSelected
                  ? ReceptionAnimationConstants.success
                  : isSelected
                  ? typeColor
                  : isAvailable
                  ? ReceptionAnimationConstants.border
                  : Colors.grey[300]!,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isAvailable
                      ? typeColor.withOpacity(0.1)
                      : Colors.grey[100],
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Center(
                  child: Text(
                    name.substring(0, 1).toUpperCase(),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: isAvailable ? typeColor : Colors.grey[400],
                    ),
                  ),
                ),
              ),
              SizedBox(width: ReceptionAnimationConstants.spacingMd),

              // User info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: isAvailable
                            ? Colors.grey[800]
                            : Colors.grey[400],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      email.isNotEmpty ? email : 'No email',
                      style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                    ),
                    if (activeCount > 0) ...[
                      const SizedBox(height: 4),
                      Text(
                        '$activeCount active assignments',
                        style: TextStyle(
                          fontSize: 12,
                          color: activeCount > 5
                              ? ReceptionAnimationConstants.warning
                              : Colors.grey[400],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Selection indicator
              if (isSelected)
                AnimatedContainer(
                  duration: ReceptionAnimationConstants.chipTransition,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: isSuccess
                        ? ReceptionAnimationConstants.success
                        : typeColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isSuccess ? Icons.check_rounded : Icons.check_rounded,
                    size: 16,
                    color: Colors.white,
                  ),
                )
              else if (!isAvailable)
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: ReceptionAnimationConstants.spacingSm,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(
                      ReceptionAnimationConstants.radiusSm,
                    ),
                  ),
                  child: Text(
                    'Unavailable',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStickyAssignButton(String roleLabel, Color typeColor) {
    final hasSelection = selectedUser != null;

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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasSelection && selectedUser != null) ...[
              Row(
                children: [
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 14,
                    color: Colors.grey[500],
                  ),
                  SizedBox(width: ReceptionAnimationConstants.spacingSm),
                  Text(
                    'Assigning to ${selectedUser!['full_name'] ?? selectedUser!['username']}',
                    style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                  ),
                ],
              ),
              SizedBox(height: ReceptionAnimationConstants.spacingMd),
            ],
            ReceptionSubmitButton(
              label: hasSelection
                  ? 'Assign $roleLabel'
                  : 'Select a $roleLabel',
              icon: Icons.person_add_alt_1_rounded,
              isLoading: isAssigning,
              isSuccess: isSuccess,
              onPressed: hasSelection ? _assignUser : null,
              backgroundColor: typeColor,
              width: double.infinity,
            ),
          ],
        ),
      ),
    );
  }
}
