import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../widgets/salesman_ui_components.dart';

/// Location Sharing Screen
///
/// Display location tracking status (read-only for Phase 1)
/// Uses real backend data - NO mock fallbacks
class LocationSharingScreen extends StatefulWidget {
  const LocationSharingScreen({super.key});

  @override
  State<LocationSharingScreen> createState() => _LocationSharingScreenState();
}

class _LocationSharingScreenState extends State<LocationSharingScreen> {
  bool isLoading = true;
  Map<String, dynamic>? locationData;
  String? error;

  @override
  void initState() {
    super.initState();
    _fetchLocationStatus();
  }

  Future<void> _fetchLocationStatus() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      // Use correct endpoint: /api/tracking/visits/active
      final response = await ApiService.instance.get(
        ApiConstants.TRACKING_ACTIVE_VISIT,
      );

      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        setState(() {
          // Transform backend response to UI format
          if (data['status'] == 'active_visit') {
            locationData = {
              'is_sharing': true,
              'status': 'active',
              'visit_id': data['visit_id'],
              'customer_name': data['customername'] ?? 'Customer Visit',
              'last_location': {
                'latitude': data['latitude']?.toString() ?? '0',
                'longitude': data['longitude']?.toString() ?? '0',
                'timestamp': data['checkintime'] ?? '',
              },
            };
          } else {
            locationData = {'is_sharing': false, 'status': 'inactive'};
          }
          isLoading = false;
        });
      } else {
        setState(() {
          // No active visit
          locationData = {'is_sharing': false, 'status': 'inactive'};
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Connection error: ${e.toString()}';
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
        title: const Text('Location Sharing'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchLocationStatus,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error != null
          ? _buildErrorState()
          : RefreshIndicator(
              onRefresh: _fetchLocationStatus,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStatusCard(),
                    const SizedBox(height: 16),
                    _buildLastLocationCard(),
                    const SizedBox(height: 16),
                    _buildTrackingHistoryCard(),
                    const SizedBox(height: 24),
                    _buildInfoCard(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildErrorState() {
    return SalesmanEmptyState(
      icon: Icons.error_outline,
      title: 'Connection Error',
      subtitle: error ?? 'Failed to load location status',
      action: SalesmanActionButton(
        label: 'Retry',
        icon: Icons.refresh,
        onPressed: _fetchLocationStatus,
      ),
    );
  }

  Widget _buildStatusCard() {
    final isSharing = locationData?['is_sharing'] ?? false;
    final customerName = locationData?['customer_name'];

    return SalesmanTrackingStatus(
      isActive: isSharing,
      message: customerName != null ? 'Visiting: $customerName' : null,
    );
  }

  Widget _buildLastLocationCard() {
    final lastLocation = locationData?['last_location'];
    final latitude = lastLocation?['latitude']?.toString() ?? 'N/A';
    final longitude = lastLocation?['longitude']?.toString() ?? 'N/A';
    final address = lastLocation?['address'] ?? 'Location not available';
    final timestamp = lastLocation?['timestamp'] ?? '';

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.my_location, color: Colors.blue),
                const SizedBox(width: 8),
                Text(
                  'Last Known Location',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(address, style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.gps_fixed, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 6),
                Text(
                  '$latitude, $longitude',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
              ],
            ),
            if (timestamp.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 14,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Updated: $timestamp',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTrackingHistoryCard() {
    final history = locationData?['history'] as List<dynamic>? ?? [];

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.history, color: Colors.purple),
                const SizedBox(width: 8),
                Text(
                  'Today\'s Tracking',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (history.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Icon(
                        Icons.timeline,
                        size: 48,
                        color: Colors.grey.shade300,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No tracking history',
                        style: TextStyle(color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: history.length > 5 ? 5 : history.length,
                separatorBuilder: (context, index) => const Divider(height: 16),
                itemBuilder: (context, index) {
                  final item = history[index] as Map<String, dynamic>;
                  return Row(
                    children: [
                      Icon(Icons.place, size: 16, color: Colors.red.shade300),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item['address'] ?? 'Unknown',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                      Text(
                        item['time'] ?? '',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      color: Colors.blue.shade50,
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.info, color: Colors.blue.shade700, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Live GPS tracking and sharing controls will be available in Phase-3',
                style: TextStyle(fontSize: 12, color: Colors.blue.shade900),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
