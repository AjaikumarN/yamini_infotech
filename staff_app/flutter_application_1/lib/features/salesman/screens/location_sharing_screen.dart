import 'package:flutter/material.dart';
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/performance_widgets.dart';
import '../widgets/salesman_ui_components.dart';

/// Location Sharing Screen
///
/// Full GPS tracking and sharing controls
/// Start/Stop tracking sessions, send live GPS updates
class LocationSharingScreen extends StatefulWidget {
  const LocationSharingScreen({super.key});

  @override
  State<LocationSharingScreen> createState() => _LocationSharingScreenState();
}

class _LocationSharingScreenState extends State<LocationSharingScreen> {
  bool isLoading = true;
  Map<String, dynamic>? locationData;
  String? error;
  bool _isToggling = false;
  Timer? _gpsTimer;
  Position? _lastPosition;

  @override
  void initState() {
    super.initState();
    _fetchLocationStatus();
  }

  @override
  void dispose() {
    _gpsTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchLocationStatus() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await ApiService.instance.get(
        ApiConstants.TRACKING_ACTIVE_VISIT,
      );

      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        setState(() {
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
            _startGpsUpdates();
          } else {
            locationData = {'is_sharing': false, 'status': 'inactive'};
          }
          isLoading = false;
        });
      } else {
        setState(() {
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

  void _startGpsUpdates() {
    _gpsTimer?.cancel();
    _gpsTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      await _sendGpsUpdate();
    });
    // Also send immediately
    _sendGpsUpdate();
  }

  Future<void> _sendGpsUpdate() async {
    try {
      final hasPermission = await _checkLocationPermission();
      if (!hasPermission) return;

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      _lastPosition = position;

      await ApiService.instance.post(
        ApiConstants.TRACKING_LOCATION_UPDATE,
        body: {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
        },
      );

      if (mounted) {
        setState(() {
          locationData?['last_location'] = {
            'latitude': position.latitude.toStringAsFixed(6),
            'longitude': position.longitude.toStringAsFixed(6),
            'timestamp': DateTime.now().toIso8601String(),
          };
        });
      }
    } catch (_) {
      // Silently fail GPS updates
    }
  }

  Future<bool> _checkLocationPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }
    if (permission == LocationPermission.deniedForever) return false;
    return true;
  }

  Future<void> _toggleTracking() async {
    final isSharing = locationData?['is_sharing'] ?? false;
    setState(() => _isToggling = true);

    try {
      if (isSharing) {
        // Stop tracking
        final response = await ApiService.instance.post(
          '${ApiConstants.TRACKING_VISIT_CHECKOUT}/${locationData?['visit_id']}',
          body: {
            'latitude': _lastPosition?.latitude ?? 0,
            'longitude': _lastPosition?.longitude ?? 0,
            'checkout_notes': 'Session ended from Location Sharing screen',
          },
        );
        if (response.success) {
          _gpsTimer?.cancel();
          setState(() {
            locationData = {'is_sharing': false, 'status': 'inactive'};
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Tracking stopped'), backgroundColor: Colors.orange),
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(response.message ?? 'Failed to stop'), backgroundColor: Colors.red),
            );
          }
        }
      } else {
        // Start tracking - need location permission first
        final hasPermission = await _checkLocationPermission();
        if (!hasPermission) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Location permission required'), backgroundColor: Colors.red),
            );
          }
          setState(() => _isToggling = false);
          return;
        }

        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        _lastPosition = position;

        final response = await ApiService.instance.post(
          ApiConstants.TRACKING_VISIT_CHECKIN,
          body: {
            'latitude': position.latitude,
            'longitude': position.longitude,
            'customer_name': 'Field Visit',
            'visit_purpose': 'Sales Activity',
          },
        );
        if (response.success && response.data != null) {
          final data = response.data as Map<String, dynamic>;
          setState(() {
            locationData = {
              'is_sharing': true,
              'status': 'active',
              'visit_id': data['visit_id'] ?? data['id'],
              'customer_name': 'Field Visit',
              'last_location': {
                'latitude': position.latitude.toStringAsFixed(6),
                'longitude': position.longitude.toStringAsFixed(6),
                'timestamp': DateTime.now().toIso8601String(),
              },
            };
          });
          _startGpsUpdates();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Live tracking started!'), backgroundColor: Colors.green),
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(response.message ?? 'Failed to start tracking'), backgroundColor: Colors.red),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isToggling = false);
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
          ? const ShimmerDashboard(cardCount: 2)
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
    final isSharing = locationData?['is_sharing'] ?? false;

    return Column(
      children: [
        // Start/Stop Tracking Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isToggling ? null : _toggleTracking,
            icon: _isToggling
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Icon(isSharing ? Icons.stop : Icons.play_arrow),
            label: Text(
              _isToggling
                  ? 'Processing...'
                  : isSharing
                      ? 'Stop Tracking'
                      : 'Start Live Tracking',
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: isSharing ? Colors.red : Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
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
                    isSharing
                        ? 'GPS location is being sent to the server every 30 seconds. Your admin can see your live location.'
                        : 'Tap "Start Live Tracking" to begin sharing your GPS location with your admin.',
                    style: TextStyle(fontSize: 12, color: Colors.blue.shade900),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
