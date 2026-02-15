import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/services/api_service.dart';
import '../../../core/widgets/performance_widgets.dart';

/// Salesman Today's Visit Overview Screen
/// 
/// Map-based view showing today's customer visits with:
/// - Start point (attendance location)
/// - Visit points (numbered 1, 2, 3...)
/// - Connected route polyline
/// - Visit list with details
/// 
/// ALL DATA FROM BACKEND - No frontend route calculation
class VisitOverviewScreen extends StatefulWidget {
  const VisitOverviewScreen({super.key});

  @override
  State<VisitOverviewScreen> createState() => _VisitOverviewScreenState();
}

class _VisitOverviewScreenState extends State<VisitOverviewScreen> {
  final MapController _mapController = MapController();
  
  bool isLoading = true;
  String? error;
  List<Map<String, dynamic>> visits = [];
  Map<String, dynamic>? attendanceLocation;
  
  // Default center (will be updated with first location)
  LatLng _center = const LatLng(8.0883, 77.5385);
  final double _zoom = 12;

  @override
  void initState() {
    super.initState();
    _loadVisitData();
  }

  Future<void> _loadVisitData() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      // Fetch today's visits from backend
      final response = await ApiService.instance.get('/api/tracking/visits/history');
      
      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final visitList = data['visits'] as List? ?? [];
        
        setState(() {
          visits = visitList.map((v) => v as Map<String, dynamic>).toList();
          
          // Center map on first visit if available
          if (visits.isNotEmpty) {
            final firstVisit = visits.first;
            final lat = _parseDouble(firstVisit['checkin_latitude'] ?? firstVisit['latitude']);
            final lng = _parseDouble(firstVisit['checkin_longitude'] ?? firstVisit['longitude']);
            if (lat != null && lng != null) {
              _center = LatLng(lat, lng);
            }
          }
          
          isLoading = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load visits';
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

  double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  List<LatLng> _buildRoutePoints() {
    final points = <LatLng>[];
    
    for (final visit in visits) {
      final lat = _parseDouble(visit['checkin_latitude'] ?? visit['latitude']);
      final lng = _parseDouble(visit['checkin_longitude'] ?? visit['longitude']);
      if (lat != null && lng != null) {
        points.add(LatLng(lat, lng));
      }
    }
    
    return points;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text("Today's Visits"),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadVisitData,
          ),
        ],
      ),
      body: isLoading
          ? const ShimmerDashboard(cardCount: 3)
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
            onPressed: _loadVisitData,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (visits.isEmpty) {
      return _buildEmptyState();
    }
    
    return Column(
      children: [
        // Map section (60% height)
        Expanded(
          flex: 6,
          child: _buildMap(),
        ),
        // Visit list section (40% height)
        Expanded(
          flex: 4,
          child: _buildVisitList(),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.location_off, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No visits recorded today',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start a customer visit to see your route',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildMap() {
    final routePoints = _buildRoutePoints();
    
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
                color: Colors.blue.withOpacity(0.7),
                strokeWidth: 4,
              ),
            ],
          ),
        
        // Visit markers
        MarkerLayer(
          markers: _buildVisitMarkers(),
        ),
      ],
    );
  }

  List<Marker> _buildVisitMarkers() {
    final markers = <Marker>[];
    
    for (int i = 0; i < visits.length; i++) {
      final visit = visits[i];
      final lat = _parseDouble(visit['checkin_latitude'] ?? visit['latitude']);
      final lng = _parseDouble(visit['checkin_longitude'] ?? visit['longitude']);
      
      if (lat != null && lng != null) {
        final isActive = visit['status'] == 'active' || 
                         visit['checkouttime'] == null;
        
        markers.add(
          Marker(
            point: LatLng(lat, lng),
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => _showVisitDetails(visit, i + 1),
              child: Container(
                decoration: BoxDecoration(
                  color: isActive ? Colors.green : Colors.blue,
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

  void _showVisitDetails(Map<String, dynamic> visit, int sequenceNumber) {
    final customerName = visit['customername'] ?? visit['customer_name'] ?? 'Customer';
    final checkinTime = visit['checkintime'] ?? visit['checkin_time'] ?? '';
    final checkoutTime = visit['checkouttime'] ?? visit['checkout_time'];
    final purpose = visit['purpose'] ?? visit['visit_purpose'] ?? '';
    
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
                    color: Colors.blue,
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
                      if (purpose.isNotEmpty)
                        Text(
                          purpose,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            _buildDetailRow(Icons.login, 'Check-in', _formatTime(checkinTime)),
            if (checkoutTime != null) ...[
              const SizedBox(height: 8),
              _buildDetailRow(Icons.logout, 'Check-out', _formatTime(checkoutTime)),
            ] else ...[
              const SizedBox(height: 8),
              _buildDetailRow(Icons.location_on, 'Status', 'Active', isActive: true),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, {bool isActive = false}) {
    return Row(
      children: [
        Icon(icon, size: 20, color: isActive ? Colors.green : Colors.grey[600]),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(color: Colors.grey[600]),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: isActive ? Colors.green : null,
          ),
        ),
      ],
    );
  }

  String _formatTime(String? time) {
    if (time == null || time.isEmpty) return 'N/A';
    try {
      final dateTime = DateTime.parse(time);
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return time;
    }
  }

  Widget _buildVisitList() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
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
                  'Visit Sequence',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${visits.length} visits',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.blue,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Visit list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: visits.length,
              itemBuilder: (context, index) => _buildVisitItem(visits[index], index + 1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVisitItem(Map<String, dynamic> visit, int sequenceNumber) {
    final customerName = visit['customername'] ?? visit['customer_name'] ?? 'Customer';
    final checkinTime = visit['checkintime'] ?? visit['checkin_time'] ?? '';
    final checkoutTime = visit['checkouttime'] ?? visit['checkout_time'];
    final isActive = checkoutTime == null;
    
    return GestureDetector(
      onTap: () {
        final lat = _parseDouble(visit['checkin_latitude'] ?? visit['latitude']);
        final lng = _parseDouble(visit['checkin_longitude'] ?? visit['longitude']);
        if (lat != null && lng != null) {
          _mapController.move(LatLng(lat, lng), 15);
        }
        _showVisitDetails(visit, sequenceNumber);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isActive ? Colors.green.withOpacity(0.05) : Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive ? Colors.green.withOpacity(0.3) : Colors.grey[200]!,
          ),
        ),
        child: Row(
          children: [
            // Sequence number
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isActive ? Colors.green : Colors.blue,
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
            // Customer info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    customerName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    _formatTime(checkinTime),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            // Status
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isActive 
                    ? Colors.green.withOpacity(0.1) 
                    : Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                isActive ? 'Active' : 'Done',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isActive ? Colors.green : Colors.grey[600],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
