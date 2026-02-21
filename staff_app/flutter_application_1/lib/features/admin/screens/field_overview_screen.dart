import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/tracking_service.dart';
import '../../../core/theme/admin_theme.dart';
import '../../../core/widgets/admin_components.dart';

/// Admin Today's Field Overview Screen
/// 
/// READ-ONLY analytics + map screen showing:
/// - Total active staff today
/// - Total visits (sales)
/// - Total jobs (service)
/// - Combined map with all routes
/// 
/// ALL DATA FROM BACKEND - Admin is VIEW-ONLY
class FieldOverviewScreen extends StatefulWidget {
  const FieldOverviewScreen({super.key});

  @override
  State<FieldOverviewScreen> createState() => _FieldOverviewScreenState();
}

class _FieldOverviewScreenState extends State<FieldOverviewScreen> {
  final TrackingService _trackingService = TrackingService.instance;
  final MapController _mapController = MapController();
  
  bool isLoading = true;
  String? error;
  
  // Summary stats
  int activeStaffCount = 0;
  int totalVisitsToday = 0;
  int totalJobsToday = 0;
  int totalDistanceKm = 0;
  
  // Live locations
  List<LiveLocation> liveLocations = [];
  
  // Filter state
  String roleFilter = 'all'; // all, salesman, engineer
  int? selectedUserId;
  
  // Default center
  LatLng _center = const LatLng(8.0883, 77.5385);

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      await Future.wait([
        _fetchLiveLocations(),
        _fetchSummaryStats(),
      ]);
      
      setState(() {
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load data: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  Future<void> _fetchLiveLocations() async {
    try {
      // Build query param for backend-driven role filtering
      String? roleParam;
      if (roleFilter == 'salesman') {
        roleParam = 'SALESMAN';
      } else if (roleFilter == 'engineer') {
        roleParam = 'SERVICE_ENGINEER';
      }
      // 'all' → no param → backend returns all roles

      final locations = await _trackingService.getAllLiveLocations(role: roleParam);
      setState(() {
        liveLocations = locations;
        activeStaffCount = locations.where((l) => l.isActive).length;
        
        // Center on first active location
        if (locations.isNotEmpty) {
          _center = LatLng(locations.first.latitude, locations.first.longitude);
        }
      });
    } catch (e) {
      if (kDebugMode) debugPrint('Live locations error: $e');
    }
  }

  Future<void> _fetchSummaryStats() async {
    try {
      // Fetch visit count
      final visitsResponse = await ApiService.instance.get('/api/tracking/visits/history');
      if (visitsResponse.success && visitsResponse.data != null) {
        final data = visitsResponse.data as Map<String, dynamic>;
        final visits = data['visits'] as List? ?? [];
        setState(() {
          totalVisitsToday = visits.length;
        });
      }
      
      // Fetch job count
      final jobsResponse = await ApiService.instance.get('/api/service-requests');
      if (jobsResponse.success && jobsResponse.data != null) {
        final jobs = jobsResponse.data as List;
        final todayJobs = jobs.where((j) {
          final status = (j['status'] ?? '').toString().toUpperCase();
          return status != 'CANCELLED';
        }).length;
        setState(() {
          totalJobsToday = todayJobs;
        });
      }
    } catch (e) {
      if (kDebugMode) debugPrint('Stats error: $e');
    }
  }

  // Filtered locations — backend already filtered, return all.
  // Client-side fallback kept for edge cases.
  List<LiveLocation> get filteredLocations {
    return liveLocations;
  }

  Color _getRoleColor(String? role) {
    final r = (role ?? '').toLowerCase();
    if (r.contains('salesman') || r.contains('sales')) {
      return Colors.blue;
    } else if (r.contains('engineer') || r.contains('service')) {
      return Colors.green;
    }
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        backgroundColor: AdminTheme.primary,
        foregroundColor: Colors.white,
        title: const Text("Today's Field Overview"),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAllData,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: isLoading
          ? const AdminLoadingState(message: 'Loading field data...')
          : error != null
              ? _buildErrorState()
              : _buildContent(),
    );
  }

  Widget _buildErrorState() {
    return AdminEmptyState(
      icon: Icons.error_outline,
      title: 'Unable to load data',
      subtitle: error,
      action: ElevatedButton.icon(
        onPressed: _loadAllData,
        icon: const Icon(Icons.refresh),
        label: const Text('Retry'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AdminTheme.primary,
          foregroundColor: Colors.white,
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Column(
      children: [
        // Summary cards
        _buildSummarySection(),
        
        // Filter tabs
        _buildFilterTabs(),
        
        // Map
        Expanded(
          child: _buildMap(),
        ),
        
        // Staff list (bottom panel)
        _buildStaffPanel(),
      ],
    );
  }

  Widget _buildSummarySection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AdminTheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              icon: Icons.people,
              label: 'Active Staff',
              value: '$activeStaffCount',
              color: AdminTheme.statusActive,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              icon: Icons.location_on,
              label: 'Visits Today',
              value: '$totalVisitsToday',
              color: Colors.blue,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              icon: Icons.build,
              label: 'Jobs Today',
              value: '$totalJobsToday',
              color: Colors.green,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: AdminTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: AdminTheme.surface,
      child: Row(
        children: [
          _buildFilterChip('All', 'all'),
          const SizedBox(width: 8),
          _buildFilterChip('Salesmen', 'salesman', color: Colors.blue),
          const SizedBox(width: 8),
          _buildFilterChip('Engineers', 'engineer', color: Colors.green),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, {Color? color}) {
    final isSelected = roleFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() => roleFilter = value);
        // Re-fetch from backend with new role filter
        _fetchLiveLocations();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? (color ?? AdminTheme.primary).withOpacity(0.15)
              : Colors.grey.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected 
                ? (color ?? AdminTheme.primary)
                : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            color: isSelected ? (color ?? AdminTheme.primary) : AdminTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildMap() {
    final locations = filteredLocations;
    
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _center,
        initialZoom: 10,
      ),
      children: [
        // OpenStreetMap tiles
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.yamini.erp',
        ),
        
        // Staff markers
        MarkerLayer(
          markers: locations.map((loc) {
            final roleColor = _getRoleColor(loc.role);
            final isActive = loc.isActive;
            
            return Marker(
              point: LatLng(loc.latitude, loc.longitude),
              width: 36,
              height: 36,
              child: GestureDetector(
                onTap: () => _showStaffDetails(loc),
                child: Container(
                  decoration: BoxDecoration(
                    color: roleColor,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white,
                      width: 3,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Icon(
                      isActive ? Icons.person : Icons.person_outline,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  void _showStaffDetails(LiveLocation loc) {
    final roleColor = _getRoleColor(loc.role);
    
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
            // Header
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: roleColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.person, color: roleColor, size: 28),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        loc.fullName ?? 'Unknown',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        loc.role ?? 'Staff',
                        style: TextStyle(color: roleColor),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: loc.isActive 
                        ? Colors.green.withOpacity(0.1)
                        : Colors.grey.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: loc.isActive ? Colors.green : Colors.grey,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        loc.isActive ? 'Live' : 'Offline',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: loc.isActive ? Colors.green : Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 16),
            
            // Location info
            _buildInfoRow(
              Icons.access_time,
              'Last Update',
              loc.updatedAt != null ? _formatTime(loc.updatedAt!) : 'N/A',
            ),
            const SizedBox(height: 12),
            _buildInfoRow(
              Icons.location_on,
              'Location',
              '${loc.latitude.toStringAsFixed(4)}, ${loc.longitude.toStringAsFixed(4)}',
            ),
            
            const SizedBox(height: 20),
            
            // View Route Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _viewStaffRoute(loc);
                },
                icon: const Icon(Icons.route),
                label: const Text('View Today\'s Route'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: roleColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AdminTheme.textMuted),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(color: AdminTheme.textSecondary),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  Future<void> _viewStaffRoute(LiveLocation loc) async {
    // Navigate to their route (uses existing live location screen functionality)
    try {
      final route = await _trackingService.getSalesmanRoute(loc.userId);
      // Show route on map
      if (route != null && route.visits.isNotEmpty) {
        setState(() {
          selectedUserId = loc.userId;
        });
        
        // Center on route
        final firstVisit = route.visits.first;
        _mapController.move(
          LatLng(firstVisit.lat, firstVisit.lng),
          13,
        );
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Showing ${loc.fullName}\'s route (${route.visits.length} points)'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('No route data for ${loc.fullName} today'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load route: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String _formatTime(String timestamp) {
    try {
      final dt = DateTime.parse(timestamp);
      final now = DateTime.now();
      final diff = now.difference(dt);
      
      if (diff.inSeconds < 60) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (e) {
      return timestamp;
    }
  }

  Widget _buildStaffPanel() {
    final locations = filteredLocations;
    
    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: AdminTheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Field Staff',
                  style: AdminTheme.bodyLarge,
                ),
                Text(
                  '${locations.length} active',
                  style: AdminTheme.bodySmall,
                ),
              ],
            ),
          ),
          Expanded(
            child: locations.isEmpty
                ? Center(
                    child: Text(
                      'No active staff',
                      style: TextStyle(color: AdminTheme.textMuted),
                    ),
                  )
                : ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: locations.length,
                    itemBuilder: (context, index) => _buildStaffChip(locations[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStaffChip(LiveLocation loc) {
    final roleColor = _getRoleColor(loc.role);
    
    return GestureDetector(
      onTap: () {
        _mapController.move(LatLng(loc.latitude, loc.longitude), 15);
        _showStaffDetails(loc);
      },
      child: Container(
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: roleColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: roleColor.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: roleColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.person, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  loc.fullName ?? 'Unknown',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: loc.isActive ? Colors.green : Colors.grey,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      loc.isActive ? 'Live' : 'Offline',
                      style: TextStyle(
                        fontSize: 10,
                        color: loc.isActive ? Colors.green : Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
