import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:async';
import '../../../core/services/tracking_service.dart';
import '../../../core/theme/admin_theme.dart';

/// Live Location Map Screen
///
/// ENTERPRISE TRACKING ARCHITECTURE:
/// - Live markers: Real-time GPS from SalesmanLiveLocation
/// - Routes: Built from VISIT HISTORY (SalesmanVisitLog), NOT live GPS
/// - Admin is VIEWER ONLY - cannot modify routes
///
/// Map-based view showing real-time salesman locations with:
/// - Interactive OpenStreetMap
/// - Sliding panel with team members list
/// - Route display from visit history (numbered sequence 1→2→3)
/// - Live refresh with 15s interval option
class LiveLocationScreen extends StatefulWidget {
  const LiveLocationScreen({super.key});

  @override
  State<LiveLocationScreen> createState() => _LiveLocationScreenState();
}

class _LiveLocationScreenState extends State<LiveLocationScreen> {
  final TrackingService _trackingService = TrackingService.instance;

  bool isLoading = true;
  String? error;
  List<LiveLocation> locations = [];
  Timer? _refreshTimer;
  DateTime? lastRefresh;
  final MapController _mapController = MapController();
  LiveLocation? selectedMember;
  String searchQuery = '';
  final int _refreshInterval = 15; // seconds

  // Route data for selected salesman
  SalesmanRouteData? selectedRoute;
  bool isLoadingRoute = false;

  // Default center (India)
  static const LatLng _defaultCenter = LatLng(8.0883, 77.5385); // Kanyakumari

  @override
  void initState() {
    super.initState();
    _fetchLocations();
    _startAutoRefresh();
  }

  void _startAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(Duration(seconds: _refreshInterval), (_) {
      _fetchLocations();
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _fetchLocations() async {
    try {
      final locs = await _trackingService.getAllLiveLocations();

      setState(() {
        locations = locs;
        isLoading = false;
        error = null;
        lastRefresh = DateTime.now();
      });

      // Center map on first location if available
      if (locations.isNotEmpty && selectedMember == null) {
        final first = locations.first;
        _mapController.move(LatLng(first.latitude, first.longitude), 12);
      }
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  /// Fetch route for selected salesman from VISIT HISTORY
  Future<void> _fetchSalesmanRoute(int salesmanId) async {
    setState(() => isLoadingRoute = true);

    try {
      final route = await _trackingService.getSalesmanRoute(salesmanId);
      setState(() {
        selectedRoute = route;
        isLoadingRoute = false;
      });
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Route fetch error: $e');
      setState(() {
        selectedRoute = null;
        isLoadingRoute = false;
      });
    }
  }

  String _getStatusText(LiveLocation loc) {
    if (loc.isActive) return 'Live';

    if (loc.updatedAt == null) return 'Offline';

    try {
      final updateTime = DateTime.parse(loc.updatedAt!);
      final now = DateTime.now();
      final diff = now.difference(updateTime);

      if (diff.inMinutes < 5) return 'Live';
      if (diff.inMinutes < 15) return 'Idle';
      return 'Offline';
    } catch (e) {
      return 'Offline';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Live':
        return const Color(0xFF22C55E); // Green
      case 'Idle':
        return const Color(0xFFF59E0B); // Amber
      case 'Offline':
        return const Color(0xFF9CA3AF); // Gray
      default:
        return AdminTheme.textMuted;
    }
  }

  String _getTimeAgo(String? lastUpdate) {
    if (lastUpdate == null) return '-';
    try {
      final updateTime = DateTime.parse(lastUpdate);
      final diff = DateTime.now().difference(updateTime);
      if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (e) {
      return '-';
    }
  }

  int get onlineCount =>
      locations.where((l) => _getStatusText(l) == 'Live').length;
  int get routesCount => selectedRoute?.visits.length ?? 0;
  int get viewingCount => selectedMember != null ? 1 : 0;

  List<LiveLocation> get filteredLocations {
    if (searchQuery.isEmpty) return locations;
    return locations.where((loc) {
      final name = (loc.fullName ?? '').toLowerCase();
      return name.contains(searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AdminTheme.background,
      body: Stack(
        children: [
          // Map
          _buildMap(),

          // Top header bar
          _buildHeader(),

          // Route info panel (when route selected)
          if (selectedRoute != null && selectedRoute!.visits.isNotEmpty)
            _buildRouteInfoPanel(),

          // Bottom sliding panel
          _buildSlidingPanel(),

          // Live indicator
          Positioned(top: 100, right: 16, child: _buildLiveIndicator()),
        ],
      ),
    );
  }

  Widget _buildRouteInfoPanel() {
    final route = selectedRoute!;
    return Positioned(
      top: 100,
      left: 16,
      child: Container(
        width: 280,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AdminTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.route, color: AdminTheme.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        route.salesman.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        'Today\'s Route',
                        style: TextStyle(color: Colors.grey[500], fontSize: 11),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  onPressed: () => setState(() {
                    selectedMember = null;
                    selectedRoute = null;
                  }),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Summary stats
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildRouteStat(
                    '${route.summary.totalVisits}',
                    'Visits',
                    Icons.location_on,
                  ),
                  Container(width: 1, height: 30, color: Colors.grey[300]),
                  _buildRouteStat(
                    '${route.summary.totalDistanceKm.toStringAsFixed(1)} km',
                    'Distance',
                    Icons.straighten,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Time range
            if (route.summary.startTime != null)
              Text(
                '${route.summary.startTime} → ${route.summary.endTime ?? 'Now'}',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            const SizedBox(height: 12),
            // Visit list (scrollable, max 4 visible)
            const Text(
              'VISIT SEQUENCE',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: Colors.grey,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 160),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: route.visits.length,
                itemBuilder: (context, index) {
                  final visit = route.visits[index];
                  return _buildVisitItem(
                    visit,
                    index == route.visits.length - 1,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteStat(String value, String label, IconData icon) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AdminTheme.primary),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[500])),
      ],
    );
  }

  Widget _buildVisitItem(VisitPoint visit, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: AdminTheme.primary,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${visit.sequence}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 30,
                color: AdminTheme.primary.withOpacity(0.3),
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  visit.address ?? 'Visit ${visit.sequence}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Row(
                  children: [
                    if (visit.time != null) ...[
                      Icon(
                        Icons.access_time,
                        size: 10,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        visit.time!,
                        style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                      ),
                    ],
                    if (visit.distanceKm != null && visit.distanceKm! > 0) ...[
                      const SizedBox(width: 8),
                      Icon(Icons.straighten, size: 10, color: Colors.grey[400]),
                      const SizedBox(width: 4),
                      Text(
                        '+${visit.distanceKm!.toStringAsFixed(1)} km',
                        style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFF2E4057),
              const Color(0xFF2E4057).withOpacity(0.95),
            ],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    // Back button
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                    const SizedBox(width: 12),
                    // Icon and title
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.hub_outlined,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Field Team',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            'Real-time tracking',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.7),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Active count badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$onlineCount\nACTIVE',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLiveIndicator() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Active count
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.group, size: 16, color: Color(0xFF374151)),
              const SizedBox(width: 6),
              Text(
                '$onlineCount Active',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF374151),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Refresh interval
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.timer_outlined,
                size: 16,
                color: Color(0xFF374151),
              ),
              const SizedBox(width: 6),
              Text(
                '${_refreshInterval}s refresh',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF374151),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // LIVE badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF22C55E),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF22C55E).withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white.withOpacity(0.5),
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                'LIVE',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMap() {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _defaultCenter,
        initialZoom: 10,
        onTap: (_, __) {
          setState(() {
            selectedMember = null;
            selectedRoute = null;
          });
        },
      ),
      children: [
        // OSM Tile Layer
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.yamini.infotech',
          maxZoom: 19,
        ),
        // Route line from visit history (ONLY when salesman selected)
        if (selectedRoute != null && selectedRoute!.routePath.isNotEmpty)
          _buildRouteLine(),
        // Visit markers from route (numbered 1→2→3)
        if (selectedRoute != null && selectedRoute!.visits.isNotEmpty)
          _buildVisitMarkers(),
        // Live location markers (all salesmen)
        MarkerLayer(markers: _buildLiveMarkers()),
      ],
    );
  }

  /// Build route polyline from VISIT HISTORY
  Widget _buildRouteLine() {
    final points = selectedRoute!.routePath
        .map((coord) => LatLng(coord[0], coord[1]))
        .toList();

    return PolylineLayer(
      polylines: [
        Polyline(points: points, strokeWidth: 4, color: AdminTheme.primary),
      ],
    );
  }

  /// Build numbered visit markers from VISIT HISTORY
  Widget _buildVisitMarkers() {
    final visits = selectedRoute!.visits;

    return MarkerLayer(
      markers: visits.map((visit) {
        return Marker(
          point: LatLng(visit.lat, visit.lng),
          width: 36,
          height: 36,
          child: Container(
            decoration: BoxDecoration(
              color: AdminTheme.primary,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: AdminTheme.primary.withOpacity(0.4),
                  blurRadius: 6,
                ),
              ],
            ),
            child: Center(
              child: Text(
                '${visit.sequence}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  /// Build live location markers (current GPS position)
  List<Marker> _buildLiveMarkers() {
    return locations.map((loc) {
      final status = _getStatusText(loc);
      final statusColor = _getStatusColor(status);
      final isSelected = selectedMember?.userId == loc.userId;

      return Marker(
        point: LatLng(loc.latitude, loc.longitude),
        width: isSelected ? 60 : 50,
        height: isSelected ? 60 : 50,
        child: GestureDetector(
          onTap: () => _selectMember(loc),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: statusColor,
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white,
                width: isSelected ? 4 : 3,
              ),
              boxShadow: [
                BoxShadow(
                  color: statusColor.withOpacity(0.4),
                  blurRadius: isSelected ? 12 : 8,
                  spreadRadius: isSelected ? 2 : 0,
                ),
              ],
            ),
            child: Center(
              child: Text(
                _getInitials(loc.fullName ?? '?'),
                style: TextStyle(
                  color: Colors.white,
                  fontSize: isSelected ? 14 : 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
      );
    }).toList();
  }

  String _getInitials(String name) {
    if (name.isEmpty) return '?';
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name[0].toUpperCase();
  }

  void _selectMember(LiveLocation member) {
    setState(() => selectedMember = member);

    // Fetch route from VISIT HISTORY (not from live GPS)
    _fetchSalesmanRoute(member.userId);

    _mapController.move(LatLng(member.latitude, member.longitude), 14);
  }

  Widget _buildSlidingPanel() {
    return DraggableScrollableSheet(
      initialChildSize: 0.40,
      minChildSize: 0.20,
      maxChildSize: 0.75,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: Column(
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Search bar
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: TextField(
                  onChanged: (v) => setState(() => searchQuery = v),
                  decoration: InputDecoration(
                    hintText: 'Search team members...',
                    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                    prefixIcon: Icon(
                      Icons.search,
                      color: Colors.grey[400],
                      size: 20,
                    ),
                    suffixIcon: IconButton(
                      icon: Icon(
                        Icons.filter_list,
                        color: Colors.grey[500],
                        size: 20,
                      ),
                      onPressed: () {},
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              // Stats row
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem(
                      icon: Icons.wifi,
                      iconColor: const Color(0xFF22C55E),
                      value: onlineCount.toString(),
                      label: 'ONLINE',
                    ),
                    _buildStatItem(
                      icon: Icons.route,
                      iconColor: const Color(0xFFF59E0B),
                      value: routesCount.toString(),
                      label: 'ROUTES',
                    ),
                    _buildStatItem(
                      icon: Icons.visibility,
                      iconColor: AdminTheme.primary,
                      value: viewingCount.toString(),
                      label: 'VIEWING',
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Team members header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'TEAM MEMBERS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF6B7280),
                        letterSpacing: 0.5,
                      ),
                    ),
                    Text(
                      '${filteredLocations.length} found',
                      style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                    ),
                  ],
                ),
              ),
              // Member list
              Expanded(
                child: isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.error_outline,
                              color: Colors.grey[400],
                              size: 40,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              error!,
                              style: TextStyle(color: Colors.grey[500]),
                            ),
                            TextButton(
                              onPressed: _fetchLocations,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : filteredLocations.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.person_off,
                              color: Colors.grey[400],
                              size: 40,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No team members found',
                              style: TextStyle(color: Colors.grey[500]),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: filteredLocations.length,
                        itemBuilder: (context, index) {
                          return _buildMemberTile(filteredLocations[index]);
                        },
                      ),
              ),
              // Bottom bar with refresh button
              SafeArea(
                top: false,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: Colors.grey[200]!)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: ElevatedButton.icon(
                            onPressed: _fetchLocations,
                            icon: const Icon(Icons.refresh, size: 18),
                            label: const Text('Refresh'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AdminTheme.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'LAST SYNC',
                            style: TextStyle(
                              fontSize: 9,
                              color: Colors.grey[400],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            lastRefresh != null
                                ? _formatTime(lastRefresh!)
                                : '--:--',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF374151),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[200]!),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: iconColor, size: 22),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w600,
              color: Colors.grey[400],
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMemberTile(LiveLocation member) {
    final name = member.fullName ?? 'Unknown';
    final status = _getStatusText(member);
    final statusColor = _getStatusColor(status);
    final lastUpdate = member.updatedAt;
    final accuracy = member.accuracyM;
    final isSelected = selectedMember?.userId == member.userId;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isSelected ? AdminTheme.primary.withOpacity(0.05) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected
              ? AdminTheme.primary.withOpacity(0.3)
              : Colors.grey[200]!,
        ),
      ),
      child: ListTile(
        onTap: () => _selectMember(member),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: Stack(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: Colors.grey[200],
              backgroundImage: member.photoUrl != null
                  ? NetworkImage(member.photoUrl!)
                  : null,
              child: member.photoUrl == null
                  ? Text(
                      _getInitials(name),
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  : null,
            ),
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
          ],
        ),
        title: Text(
          name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        subtitle: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                status,
                style: TextStyle(
                  color: statusColor,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.access_time, size: 12, color: Colors.grey[400]),
            const SizedBox(width: 4),
            Text(
              _getTimeAgo(lastUpdate),
              style: TextStyle(fontSize: 11, color: Colors.grey[500]),
            ),
          ],
        ),
        trailing: accuracy != null && accuracy > 0
            ? Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${accuracy.toStringAsFixed(0)}m',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      'ACCURACY',
                      style: TextStyle(
                        fontSize: 8,
                        color: Colors.grey[400],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              )
            : const Icon(Icons.chevron_right, color: Colors.grey),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'pm' : 'am';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }
}
