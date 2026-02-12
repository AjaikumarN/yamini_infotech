import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/service_engineer_theme.dart';

/// Service Engineer Today's Job Route Screen
/// 
/// Map-based view showing today's service jobs with:
/// - Job points (numbered by sequence)
/// - Connected route polyline
/// - Job list with status indicators
/// 
/// ALL DATA FROM BACKEND - No frontend route calculation
class JobRouteScreen extends StatefulWidget {
  const JobRouteScreen({super.key});

  @override
  State<JobRouteScreen> createState() => _JobRouteScreenState();
}

class _JobRouteScreenState extends State<JobRouteScreen> {
  final MapController _mapController = MapController();
  
  bool isLoading = true;
  String? error;
  List<Map<String, dynamic>> jobs = [];  // All jobs
  List<Map<String, dynamic>> jobsWithLocation = [];  // Jobs with GPS coordinates
  
  // Default center
  LatLng _center = const LatLng(8.0883, 77.5385);
  final double _zoom = 12;

  @override
  void initState() {
    super.initState();
    _loadJobData();
  }

  Future<void> _loadJobData() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      // Fetch today's jobs from backend
      final response = await ApiService.instance.get('/api/service-requests/my-services');
      
      if (response.success && response.data != null) {
        final jobList = response.data as List;
        
        // Get all jobs
        final allJobs = jobList
            .map((j) => j as Map<String, dynamic>)
            .toList();
        
        // Filter jobs with GPS location data
        final gpsJobs = allJobs
            .where((j) => _hasValidLocation(j))
            .toList();
        
        setState(() {
          jobs = allJobs;
          jobsWithLocation = gpsJobs;
          
          // Center map on first job with location if available
          if (jobsWithLocation.isNotEmpty) {
            final lat = _parseDouble(jobsWithLocation.first['checkin_latitude']);
            final lng = _parseDouble(jobsWithLocation.first['checkin_longitude']);
            if (lat != null && lng != null) {
              _center = LatLng(lat, lng);
            }
          }
          
          isLoading = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load jobs';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Error: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  bool _hasValidLocation(Map<String, dynamic> job) {
    final lat = _parseDouble(job['latitude'] ?? job['customer_latitude'] ?? job['checkin_latitude']);
    final lng = _parseDouble(job['longitude'] ?? job['customer_longitude'] ?? job['checkin_longitude']);
    return lat != null && lng != null;
  }

  double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  LatLng? _getJobLocation(Map<String, dynamic> job) {
    // Prefer checkin location (GPS proof), fall back to customer location
    final lat = _parseDouble(job['checkin_latitude'] ?? job['latitude'] ?? job['customer_latitude']);
    final lng = _parseDouble(job['checkin_longitude'] ?? job['longitude'] ?? job['customer_longitude']);
    if (lat != null && lng != null) {
      return LatLng(lat, lng);
    }
    return null;
  }

  List<LatLng> _buildRoutePoints() {
    final points = <LatLng>[];
    
    for (final job in jobsWithLocation) {
      final location = _getJobLocation(job);
      if (location != null) {
        points.add(location);
      }
    }
    
    return points;
  }

  Color _getStatusColor(String? status) {
    final s = (status ?? '').toUpperCase();
    switch (s) {
      case 'COMPLETED':
        return ServiceEngineerTheme.statusCompleted;
      case 'IN_PROGRESS':
        return ServiceEngineerTheme.statusInProgress;
      case 'PENDING':
      case 'ASSIGNED':
        return ServiceEngineerTheme.statusPending;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String? status) {
    final s = (status ?? '').toUpperCase();
    switch (s) {
      case 'COMPLETED':
        return 'Done';
      case 'IN_PROGRESS':
        return 'Active';
      case 'PENDING':
      case 'ASSIGNED':
        return 'Pending';
      default:
        return status ?? 'Unknown';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ServiceEngineerTheme.background,
      appBar: AppBar(
        backgroundColor: ServiceEngineerTheme.primary,
        foregroundColor: Colors.white,
        title: const Text("Today's Job Route"),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadJobData,
          ),
        ],
      ),
      body: isLoading
          ? Center(
              child: CircularProgressIndicator(
                color: ServiceEngineerTheme.primary,
              ),
            )
          : error != null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(error ?? 'Something went wrong'),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadJobData,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: ServiceEngineerTheme.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (jobs.isEmpty) {
      return _buildEmptyState();
    }
    
    return Column(
      children: [
        // Map section (60% height)
        Expanded(
          flex: 6,
          child: _buildMap(),
        ),
        // Job list section (40% height)
        Expanded(
          flex: 4,
          child: _buildJobList(),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.work_off, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No jobs assigned today',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your assigned jobs will appear here',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildMap() {
    final routePoints = _buildRoutePoints();
    
    // Show message if no GPS locations available
    if (jobsWithLocation.isEmpty) {
      return Container(
        color: Colors.grey[100],
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.location_off, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 12),
              Text(
                'No GPS locations yet',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Map will show locations after check-in',
                style: TextStyle(fontSize: 13, color: Colors.grey[500]),
              ),
            ],
          ),
        ),
      );
    }
    
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _center,
        initialZoom: _zoom,
      ),
      children: [
        // OpenStreetMap tiles
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.yamini.erp',
        ),
        
        // Route polyline
        if (routePoints.length >= 2)
          PolylineLayer(
            polylines: [
              Polyline(
                points: routePoints,
                color: ServiceEngineerTheme.primary.withOpacity(0.7),
                strokeWidth: 4,
              ),
            ],
          ),
        
        // Job markers
        MarkerLayer(
          markers: _buildJobMarkers(),
        ),
      ],
    );
  }

  List<Marker> _buildJobMarkers() {
    final markers = <Marker>[];
    
    for (int i = 0; i < jobsWithLocation.length; i++) {
      final job = jobsWithLocation[i];
      final location = _getJobLocation(job);
      
      if (location != null) {
        final status = job['status']?.toString() ?? '';
        final statusColor = _getStatusColor(status);
        
        markers.add(
          Marker(
            point: location,
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => _showJobDetails(job, i + 1),
              child: Container(
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '${i + 1}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      }
    }
    
    return markers;
  }

  void _showJobDetails(Map<String, dynamic> job, int sequenceNumber) {
    final customerName = job['customer_name'] ?? job['customername'] ?? 'Customer';
    final serviceType = job['service_type'] ?? job['type'] ?? 'Service';
    final status = job['status']?.toString() ?? '';
    final address = job['address'] ?? job['location'] ?? '';
    final statusColor = _getStatusColor(status);
    
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      '$sequenceNumber',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
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
                        customerName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Row(
                        children: [
                          Icon(Icons.build, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            serviceType,
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _getStatusText(status),
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            if (address.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.location_on, size: 20, color: Colors.grey[600]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      address,
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildJobList() {
    return Container(
      decoration: BoxDecoration(
        color: ServiceEngineerTheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Job Route',
                  style: ServiceEngineerTheme.titleLarge,
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: ServiceEngineerTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${jobs.length} jobs',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: ServiceEngineerTheme.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Job list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: jobs.length,
              itemBuilder: (context, index) => _buildJobItem(jobs[index], index + 1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJobItem(Map<String, dynamic> job, int sequenceNumber) {
    final customerName = job['customer_name'] ?? job['customername'] ?? 'Customer';
    final serviceType = job['service_type'] ?? job['type'] ?? 'Service';
    final status = job['status']?.toString() ?? '';
    final address = job['address'] ?? '';
    final statusColor = _getStatusColor(status);
    final hasLocation = _hasValidLocation(job);
    
    return GestureDetector(
      onTap: () {
        final location = _getJobLocation(job);
        if (location != null) {
          _mapController.move(location, 15);
        }
        _showJobDetails(job, sequenceNumber);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: status.toUpperCase() == 'IN_PROGRESS' 
              ? statusColor.withOpacity(0.05) 
              : Colors.grey[50],
          borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
          border: Border.all(
            color: status.toUpperCase() == 'IN_PROGRESS'
                ? statusColor.withOpacity(0.3) 
                : ServiceEngineerTheme.border,
          ),
        ),
        child: Row(
          children: [
            // Sequence number
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  '$sequenceNumber',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Job info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    customerName,
                    style: ServiceEngineerTheme.titleMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    children: [
                      Icon(Icons.build_circle_outlined, 
                           size: 12, 
                           color: ServiceEngineerTheme.textMuted),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          serviceType,
                          style: ServiceEngineerTheme.caption,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Icon(
                        hasLocation ? Icons.gps_fixed : Icons.gps_off, 
                        size: 12, 
                        color: hasLocation ? ServiceEngineerTheme.statusCompleted : Colors.grey[400],
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          hasLocation ? 'GPS recorded' : address.isNotEmpty ? address : 'No GPS',
                          style: TextStyle(
                            fontSize: 11,
                            color: hasLocation ? ServiceEngineerTheme.statusCompleted : Colors.grey[500],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Status
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _getStatusText(status),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: statusColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
