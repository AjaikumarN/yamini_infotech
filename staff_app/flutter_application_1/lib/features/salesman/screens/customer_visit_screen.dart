import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:geocoding/geocoding.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../services/live_tracking_service.dart';
import '../widgets/salesman_ui_components.dart';
import 'create_enquiry_screen.dart';

/// Customer Visit Screen
///
/// Live tracking and customer visit check-in/check-out:
/// 1. Check-in at customer location with photo and GPS
/// 2. Track location during visit
/// 3. Check-out when visit is complete
///
/// This is separate from daily attendance (work check-in/check-out)
class CustomerVisitScreen extends StatefulWidget {
  const CustomerVisitScreen({super.key});

  @override
  State<CustomerVisitScreen> createState() => _CustomerVisitScreenState();
}

class _CustomerVisitScreenState extends State<CustomerVisitScreen>
    with WidgetsBindingObserver {
  // Services
  final LiveTrackingService _trackingService = LiveTrackingService.instance;

  // State
  bool _isLoading = true;
  bool _isProcessing = false;
  String? _error;

  // Visit state
  bool _hasActiveVisit = false;
  Map<String, dynamic>? _activeVisit;
  List<Map<String, dynamic>> _todayVisits = [];

  // Check-in state
  Position? _currentPosition;
  String _currentAddress = 'Getting location...';
  String _customerName = '';
  String _visitPurpose = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadVisitData();
    _trackingService.addListener(_onTrackingUpdate);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _trackingService.removeListener(_onTrackingUpdate);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _trackingService.pauseTracking();
    } else if (state == AppLifecycleState.resumed) {
      _trackingService.resumeTracking();
    }
  }

  void _onTrackingUpdate() {
    if (mounted) setState(() {});
  }

  Future<void> _loadVisitData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Check for active visit
      final activeResponse = await ApiService.instance.get(
        ApiConstants.TRACKING_ACTIVE_VISIT,
      );

      if (activeResponse.success && activeResponse.data != null) {
        final data = activeResponse.data as Map<String, dynamic>;
        if (data['status'] == 'active_visit') {
          _hasActiveVisit = true;
          _activeVisit = data;
        } else {
          // No active visit - reset state
          _hasActiveVisit = false;
          _activeVisit = null;
        }
      } else {
        // API call failed or no data - reset state
        _hasActiveVisit = false;
        _activeVisit = null;
      }

      // Load today's visit history
      final historyResponse = await ApiService.instance.get(
        ApiConstants.TRACKING_VISIT_HISTORY,
      );

      if (historyResponse.success && historyResponse.data != null) {
        final data = historyResponse.data as Map<String, dynamic>;
        final visits = data['visits'] as List? ?? [];
        _todayVisits = visits.map((v) => v as Map<String, dynamic>).toList();
      }

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _error = 'Failed to load visit data: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _startVisitFlow() async {
    // Show bottom sheet for visit details
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _VisitCheckInSheet(
        onSubmit: (customerName, purpose) async {
          Navigator.pop(context, {
            'customer': customerName,
            'purpose': purpose,
          });
        },
      ),
    );

    if (result != null) {
      _customerName = result['customer'] ?? '';
      _visitPurpose = result['purpose'] ?? '';
      await _getLocationAndCheckIn();
    }
  }

  Future<void> _getLocationAndCheckIn() async {
    setState(() => _isProcessing = true);

    try {
      // Request location permission
      final locationStatus = await Permission.location.request();

      if (locationStatus.isDenied) {
        _showError('Location permission is required for customer visits');
        setState(() => _isProcessing = false);
        return;
      }

      // Get location
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      // Format address
      _currentAddress =
          'Lat: ${_currentPosition!.latitude.toStringAsFixed(6)}, '
          'Long: ${_currentPosition!.longitude.toStringAsFixed(6)}';

      // Submit check-in
      await _submitVisitCheckIn();
    } catch (e) {
      _showError('Error: ${e.toString()}');
      setState(() => _isProcessing = false);
    }
  }

  Future<void> _submitVisitCheckIn() async {
    if (_currentPosition == null) return;

    try {
      // Note: Photo upload would require multipart API support
      // For now, just send the location data
      final response = await ApiService.instance.post(
        ApiConstants.TRACKING_VISIT_CHECKIN,
        body: {
          'customername': _customerName,
          'notes': _visitPurpose,  // Backend expects 'notes' field
          'latitude': _currentPosition!.latitude,
          'longitude': _currentPosition!.longitude,
          'address': _currentAddress,
          'checkin_time': DateTime.now().toIso8601String(),
        },
      );

      if (response.success) {
        _showSuccess('Visit check-in successful!');
        _trackingService.startTracking();
        await _loadVisitData();
      } else {
        _showError(response.message ?? 'Check-in failed');
      }
    } catch (e) {
      _showError('Check-in failed: ${e.toString()}');
    }

    setState(() {
      _isProcessing = false;
    });
  }

  Future<void> _endVisit() async {
    // Show dialog asking if they want to create an enquiry
    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Visit'),
        content: const Text(
          'Would you like to create an enquiry for this customer?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, 'cancel'),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, 'no'),
            child: const Text('End Without Enquiry'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, 'yes'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Create Enquiry'),
          ),
        ],
      ),
    );

    if (result == null || result == 'cancel') return;

    setState(() => _isProcessing = true);

    // Store visit data before ending
    final visitCustomerName = _activeVisit?['customer_name'] ?? _customerName;
    final visitPurpose = _activeVisit?['purpose'] ?? _visitPurpose;
    final visitAddress = _activeVisit?['address'] ?? _currentAddress;

    try {
      // Get current location for checkout
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final response = await ApiService.instance.post(
        ApiConstants.TRACKING_VISIT_CHECKOUT,
        body: {
          'visit_id': _activeVisit?['visit_id'],
          'latitude': position.latitude,
          'longitude': position.longitude,
          'checkout_time': DateTime.now().toIso8601String(),
        },
      );

      if (response.success) {
        _trackingService.stopTracking();
        _showSuccess('Visit ended successfully!');
        await _loadVisitData();

        // Navigate to create enquiry if user selected yes
        if (result == 'yes' && mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => CreateEnquiryScreen(
                customerName: visitCustomerName,
                visitPurpose: visitPurpose,
                address: visitAddress,
              ),
            ),
          );
        }
      } else {
        _showError(response.message ?? 'Check-out failed');
      }
    } catch (e) {
      _showError('Check-out failed: ${e.toString()}');
    }

    setState(() => _isProcessing = false);
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Customer Visit'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadVisitData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildErrorState()
          : RefreshIndicator(
              onRefresh: _loadVisitData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildActiveVisitCard(),
                    const SizedBox(height: 20),
                    _buildTrackingStatusCard(),
                    const SizedBox(height: 20),
                    _buildTodayVisitsSection(),
                  ],
                ),
              ),
            ),
      floatingActionButton: !_hasActiveVisit && !_isProcessing
          ? Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.teal.shade600, Colors.teal.shade400],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: Colors.teal.withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 2,
                    offset: const Offset(0, 8),
                  ),
                  BoxShadow(
                    color: Colors.teal.withOpacity(0.2),
                    blurRadius: 40,
                    spreadRadius: 5,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _startVisitFlow,
                  borderRadius: BorderRadius.circular(30),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.25),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.add_location_alt,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Start Visit',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildErrorState() {
    return SalesmanEmptyState(
      icon: Icons.error_outline,
      title: 'Connection Error',
      subtitle: _error ?? 'Failed to load visit data',
      action: SalesmanActionButton(
        label: 'Retry',
        icon: Icons.refresh,
        onPressed: _loadVisitData,
      ),
    );
  }

  Widget _buildActiveVisitCard() {
    if (!_hasActiveVisit) {
      return Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.teal.shade50, Colors.teal.shade100],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.teal.withOpacity(0.2),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.teal.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.location_off,
                  size: 48,
                  color: Colors.teal.shade700,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'No Active Visit',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.teal.shade800,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Start a new customer visit to begin tracking',
                style: TextStyle(fontSize: 14, color: Colors.teal.shade600),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    final customerName = _activeVisit?['customername'] ?? 'Customer';
    final checkinTime = _activeVisit?['checkintime'] ?? '';

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.green.shade50, Colors.green.shade100],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.2),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.location_on,
                    size: 32,
                    color: Colors.green.shade700,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Active Visit',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.green,
                        ),
                      ),
                      Text(
                        customerName,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade800,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.circle, size: 8, color: Colors.white),
                      SizedBox(width: 4),
                      Text(
                        'LIVE',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Started: $checkinTime',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isProcessing ? null : _endVisit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: _isProcessing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.stop_circle),
                label: Text(_isProcessing ? 'Processing...' : 'End Visit'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrackingStatusCard() {
    return SalesmanTrackingStatus(
      isActive: _hasActiveVisit && _trackingService.isTracking,
      message: _trackingService.lastPosition != null
          ? 'Last update: ${_trackingService.lastUpdateTimeFormatted}'
          : null,
    );
  }

  Widget _buildTodayVisitsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Today\'s Visits',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade800,
              ),
            ),
            if (_todayVisits.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.teal.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_todayVisits.length}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.teal.shade700,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (_todayVisits.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                Icon(Icons.location_off, size: 56, color: Colors.grey.shade300),
                const SizedBox(height: 12),
                Text(
                  'No visits recorded today',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey.shade500,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Start a new visit to track your customer meetings',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade400,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _todayVisits.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final visit = _todayVisits[index];
              return _buildVisitCard(visit);
            },
          ),
      ],
    );
  }

  Widget _buildVisitCard(Map<String, dynamic> visit) {
    final customerName = visit['customername'] ?? 'Unknown';
    final purpose = visit['notes'] ?? 'No purpose specified';
    final checkInTime = visit['checkintime'];
    final checkOutTime = visit['checkouttime'];
    final isActive = visit['status'] == 'active';

    return GestureDetector(
      onTap: () => _showVisitDetails(visit),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isActive
                ? [Colors.green.shade50, Colors.white]
                : [Colors.white, Colors.grey.shade50],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive ? Colors.green.shade200 : Colors.grey.shade200,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isActive
                  ? Colors.green.withOpacity(0.1)
                  : Colors.grey.withOpacity(0.05),
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
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isActive
                          ? Colors.green.shade100
                          : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isActive ? Icons.location_on : Icons.check_circle,
                      color: isActive
                          ? Colors.green.shade700
                          : Colors.grey.shade600,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          customerName,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          purpose,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'ACTIVE',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(Icons.login, size: 16, color: Colors.grey.shade600),
                        const SizedBox(width: 6),
                        Text(
                          'Check-in:',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            _formatTime(checkInTime),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade800,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (!isActive && checkOutTime != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.logout, size: 16, color: Colors.grey.shade600),
                          const SizedBox(width: 6),
                          Text(
                            'Check-out:',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              _formatTime(checkOutTime),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade800,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.timer, size: 16, color: Colors.grey.shade600),
                          const SizedBox(width: 6),
                          Text(
                            'Duration:',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              _calculateDuration(checkInTime, checkOutTime),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.teal.shade700,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextButton.icon(
                      onPressed: () => _showVisitDetails(visit),
                      icon: const Icon(Icons.info_outline, size: 16),
                      label: const Text('View Details'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.teal,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
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

  String _formatTime(String? isoTime) {
    if (isoTime == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(isoTime);
      return DateFormat('hh:mm a').format(dateTime);
    } catch (e) {
      return isoTime;
    }
  }

  String _calculateDuration(String? startTime, String? endTime) {
    if (startTime == null || endTime == null) return 'N/A';
    try {
      final start = DateTime.parse(startTime);
      final end = DateTime.parse(endTime);
      final duration = end.difference(start);
      
      final hours = duration.inHours;
      final minutes = duration.inMinutes % 60;
      
      if (hours > 0) {
        return '$hours hr $minutes min';
      } else {
        return '$minutes min';
      }
    } catch (e) {
      return 'N/A';
    }
  }

  Future<void> _showVisitDetails(Map<String, dynamic> visit) async {
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _VisitDetailsSheet(visit: visit),
    );
  }
}

/// Visit Details Bottom Sheet
class _VisitDetailsSheet extends StatefulWidget {
  final Map<String, dynamic> visit;

  const _VisitDetailsSheet({required this.visit});

  @override
  State<_VisitDetailsSheet> createState() => _VisitDetailsSheetState();
}

class _VisitDetailsSheetState extends State<_VisitDetailsSheet> {
  String? checkInAddress;
  String? checkOutAddress;
  bool isLoadingCheckIn = true;
  bool isLoadingCheckOut = true;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<String> _getAddressFromCoordinates(double lat, double lng) async {
    // Try geocoding package first
    try {
      final placemarks = await placemarkFromCoordinates(lat, lng);
      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        final addressParts = [
          place.name,
          place.street,
          place.locality,
          place.administrativeArea,
        ].where((e) => e != null && e.isNotEmpty).toList();
        
        if (addressParts.isNotEmpty) {
          return addressParts.join(', ');
        }
      }
    } catch (e) {
      print('⚠️ Geocoding package failed: $e');
    }

    // Fallback to OpenStreetMap Nominatim API
    try {
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1'
      );
      
      final response = await http.get(
        url,
        headers: {'User-Agent': 'YaminiInfotechApp/1.0'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final address = data['display_name'] as String?;
        
        if (address != null && address.isNotEmpty) {
          // Clean up the address - take first 3-4 parts
          final parts = address.split(',').take(4).map((e) => e.trim()).toList();
          return parts.join(', ');
        }
      }
    } catch (e) {
      print('⚠️ Nominatim API failed: $e');
    }

    // Final fallback: return coordinates
    return 'Lat: ${lat.toStringAsFixed(6)}, Lng: ${lng.toStringAsFixed(6)}';
  }

  Future<void> _loadAddresses() async {
    // Debug: Print visit data
    print('🔍 Visit data: ${widget.visit}');
    
    final checkInLat = widget.visit['checkin_latitude'];
    final checkInLng = widget.visit['checkin_longitude'];
    final checkOutLat = widget.visit['checkout_latitude'];
    final checkOutLng = widget.visit['checkout_longitude'];
    final isActive = widget.visit['status'] == 'active';

    print('📍 Check-in coords: lat=$checkInLat, lng=$checkInLng');
    print('📍 Check-out coords: lat=$checkOutLat, lng=$checkOutLng');

    // Load check-in address
    if (checkInLat != null && checkInLng != null) {
      try {
        final lat = checkInLat is double ? checkInLat : double.parse(checkInLat.toString());
        final lng = checkInLng is double ? checkInLng : double.parse(checkInLng.toString());
        
        final address = await _getAddressFromCoordinates(lat, lng);
        
        if (mounted) {
          setState(() {
            checkInAddress = address;
            isLoadingCheckIn = false;
          });
        }
      } catch (e) {
        print('❌ Error processing check-in location: $e');
        if (mounted) {
          setState(() {
            checkInAddress = 'Location data error';
            isLoadingCheckIn = false;
          });
        }
      }
    } else {
      if (mounted) {
        setState(() {
          checkInAddress = 'No location data';
          isLoadingCheckIn = false;
        });
      }
    }

    // Load check-out address
    if (!isActive && checkOutLat != null && checkOutLng != null) {
      try {
        final lat = checkOutLat is double ? checkOutLat : double.parse(checkOutLat.toString());
        final lng = checkOutLng is double ? checkOutLng : double.parse(checkOutLng.toString());
        
        final address = await _getAddressFromCoordinates(lat, lng);
        
        if (mounted) {
          setState(() {
            checkOutAddress = address;
            isLoadingCheckOut = false;
          });
        }
      } catch (e) {
        print('❌ Error processing check-out location: $e');
        if (mounted) {
          setState(() {
            checkOutAddress = 'Location data error';
            isLoadingCheckOut = false;
          });
        }
      }
    } else {
      if (mounted) {
        setState(() {
          checkOutAddress = isActive ? 'Not checked out yet' : 'No location data';
          isLoadingCheckOut = false;
        });
      }
    }
  }

  String _formatFullDateTime(String? isoTime) {
    if (isoTime == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(isoTime);
      return DateFormat('MMM dd, yyyy • hh:mm a').format(dateTime);
    } catch (e) {
      return isoTime;
    }
  }

  String _calculateDuration(String? startTime, String? endTime) {
    if (startTime == null || endTime == null) return 'N/A';
    try {
      final start = DateTime.parse(startTime);
      final end = DateTime.parse(endTime);
      final duration = end.difference(start);
      
      final hours = duration.inHours;
      final minutes = duration.inMinutes % 60;
      
      if (hours > 0) {
        return '$hours hr $minutes min';
      } else {
        return '$minutes min';
      }
    } catch (e) {
      return 'N/A';
    }
  }

  @override
  Widget build(BuildContext context) {
    final customerName = widget.visit['customername'] ?? 'Unknown';
    final purpose = widget.visit['notes'] ?? 'No purpose specified';
    final checkInTime = widget.visit['checkintime'];
    final checkOutTime = widget.visit['checkouttime'];

    print('📝 Purpose: $purpose');
    print('⏰ Check-in: $checkInTime, Check-out: $checkOutTime');
    final isActive = widget.visit['status'] == 'active';

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isActive
                          ? Colors.green.shade100
                          : Colors.teal.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.location_on,
                      color: isActive
                          ? Colors.green.shade700
                          : Colors.teal.shade700,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Visit Details',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        Text(
                          customerName,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Text(
                        'ACTIVE',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _buildDetailCard(
                    'Purpose',
                    purpose.trim().isNotEmpty ? purpose : 'No purpose specified',
                    Icons.description,
                    Colors.blue,
                  ),
                  const SizedBox(height: 12),
                  _buildDetailCard(
                    'Check-in Time',
                    _formatFullDateTime(checkInTime),
                    Icons.login,
                    Colors.green,
                  ),
                  const SizedBox(height: 12),
                  _buildDetailCard(
                    'Check-in Location',
                    isLoadingCheckIn 
                        ? 'Loading address...' 
                        : (checkInAddress ?? 'Address unavailable'),
                    Icons.place,
                    Colors.teal,
                    isLoading: isLoadingCheckIn,
                  ),
                  if (!isActive) ...[
                    const SizedBox(height: 12),
                    _buildDetailCard(
                      'Check-out Time',
                      _formatFullDateTime(checkOutTime),
                      Icons.logout,
                      Colors.orange,
                    ),
                    const SizedBox(height: 12),
                    _buildDetailCard(
                      'Check-out Location',
                      isLoadingCheckOut 
                          ? 'Loading address...' 
                          : (checkOutAddress ?? 'Address unavailable'),
                      Icons.place,
                      Colors.deepOrange,
                      isLoading: isLoadingCheckOut,
                    ),
                    const SizedBox(height: 12),
                    _buildDetailCard(
                      'Visit Duration',
                      _calculateDuration(checkInTime, checkOutTime),
                      Icons.timer,
                      Colors.purple,
                    ),
                  ],
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailCard(
    String label,
    String value,
    IconData icon,
    Color color, {
    bool isLoading = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                if (isLoading)
                  Row(
                    children: [
                      SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(color),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        value,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  )
                else
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade800,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Bottom sheet for visit check-in details
class _VisitCheckInSheet extends StatefulWidget {
  final Function(String customerName, String purpose) onSubmit;

  const _VisitCheckInSheet({required this.onSubmit});

  @override
  State<_VisitCheckInSheet> createState() => _VisitCheckInSheetState();
}

class _VisitCheckInSheetState extends State<_VisitCheckInSheet> {
  final _customerController = TextEditingController();
  final _purposeController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _customerController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.teal.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.add_location,
                      color: Colors.teal.shade700,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Start Customer Visit',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _customerController,
                decoration: InputDecoration(
                  labelText: 'Customer Name',
                  hintText: 'Enter customer or company name',
                  prefixIcon: const Icon(Icons.person),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter customer name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _purposeController,
                decoration: InputDecoration(
                  labelText: 'Visit Purpose',
                  hintText: 'e.g., Demo, Follow-up, Support',
                  prefixIcon: const Icon(Icons.description),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter visit purpose';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      widget.onSubmit(
                        _customerController.text,
                        _purposeController.text,
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text(
                    'Capture Photo & Check In',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
