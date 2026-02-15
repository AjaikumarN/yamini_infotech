import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import '../../../core/services/api_service.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/admin_theme.dart';
import '../../../core/widgets/admin_components.dart';

/// Attendance Overview Screen
///
/// List/table hybrid showing attendance for all employees with:
/// - Sticky date filter at top
/// - Status chips (Present/Late/Absent)
/// - Check-in/check-out times
///
/// UI Philosophy: Clear hierarchy, instant data visibility
class AttendanceOverviewScreen extends StatefulWidget {
  const AttendanceOverviewScreen({super.key});

  @override
  State<AttendanceOverviewScreen> createState() => _AttendanceOverviewScreenState();
}

class _AttendanceOverviewScreenState extends State<AttendanceOverviewScreen> {
  DateTime selectedDate = DateTime.now();
  bool isLoading = true;
  String? error;
  List<Map<String, dynamic>> attendanceList = [];

  @override
  void initState() {
    super.initState();
    _fetchAttendance();
  }

  Future<void> _fetchAttendance() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
      final isToday = DateFormat('yyyy-MM-dd').format(DateTime.now()) == dateStr;

      final endpoint = isToday
          ? '/api/attendance/all/today'
          : '/api/attendance/all?date=$dateStr';

      final response = await ApiService.instance.get(endpoint);

      if (response.success && response.data != null) {
        // Debug: print the response structure
        if (kDebugMode) debugPrint('📋 Attendance response: ${response.data}');
        
        List<dynamic> data;
        if (response.data is List) {
          data = response.data;
        } else if (response.data['attendance'] != null) {
          data = response.data['attendance'];
        } else if (response.data['employees'] != null) {
          data = response.data['employees'];
        } else if (response.data['records'] != null) {
          data = response.data['records'];
        } else if (response.data['data'] != null) {
          data = response.data['data'];
        } else {
          data = [];
        }
        
        // Debug: print first record structure
        if (data.isNotEmpty) {
          if (kDebugMode) debugPrint('📋 First record keys: ${data[0].keys.toList()}');
          if (kDebugMode) debugPrint('📋 First record: ${data[0]}');
        }

        setState(() {
          attendanceList = List<Map<String, dynamic>>.from(data);
          isLoading = false;
        });
      } else {
        setState(() {
          error = response.message ?? 'Failed to load attendance';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AdminTheme.primary,
              onPrimary: Colors.white,
              surface: AdminTheme.surface,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != selectedDate) {
      setState(() {
        selectedDate = picked;
      });
      _fetchAttendance();
    }
  }

  String _formatTime(String? timeStr) {
    if (timeStr == null) return '-';
    try {
      final dt = DateTime.parse(timeStr);
      return DateFormat('hh:mm a').format(dt);
    } catch (e) {
      return timeStr;
    }
  }

  String _calculateDuration(String? checkIn, String? checkOut) {
    if (checkIn == null) return '-';

    try {
      final inTime = DateTime.parse(checkIn);
      final outTime = checkOut != null ? DateTime.parse(checkOut) : DateTime.now();
      final diff = outTime.difference(inTime);

      final hours = diff.inHours;
      final minutes = diff.inMinutes % 60;

      if (checkOut == null) {
        return '${hours}h ${minutes}m (ongoing)';
      }
      return '${hours}h ${minutes}m';
    } catch (e) {
      return '-';
    }
  }

  String _getAttendanceStatus(Map<String, dynamic> record) {
    final checkedIn = record['checked_in'] == true;
    if (!checkedIn) return 'Absent';

    final checkInTime = record['check_in_time'];
    if (checkInTime != null) {
      try {
        final dt = DateTime.parse(checkInTime);
        // Late if checked in after 9:30 AM
        if (dt.hour > 9 || (dt.hour == 9 && dt.minute > 30)) {
          return 'Late';
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    return 'Present';
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Present':
        return AdminTheme.statusSuccess;
      case 'Late':
        return AdminTheme.statusWarning;
      case 'Absent':
        return AdminTheme.statusError;
      default:
        return AdminTheme.textMuted;
    }
  }

  int get presentCount => attendanceList.where((r) => _getAttendanceStatus(r) == 'Present').length;
  int get lateCount => attendanceList.where((r) => _getAttendanceStatus(r) == 'Late').length;
  int get absentCount => attendanceList.where((r) => _getAttendanceStatus(r) == 'Absent').length;

  @override
  Widget build(BuildContext context) {
    final isToday = DateFormat('yyyy-MM-dd').format(DateTime.now()) ==
        DateFormat('yyyy-MM-dd').format(selectedDate);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        backgroundColor: AdminTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Attendance Overview',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchAttendance,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // Sticky date selector
          AdminFadeIn(
            child: _buildDateSelector(isToday),
          ),
          // Summary bar
          if (!isLoading && error == null)
            AdminFadeIn(
              delay: const Duration(milliseconds: 50),
              child: _buildSummaryBar(),
            ),
          // Content
          Expanded(
            child: isLoading
                ? const AdminLoadingState(message: 'Loading attendance...')
                : error != null
                    ? _buildErrorState()
                    : attendanceList.isEmpty
                        ? _buildEmptyState()
                        : _buildAttendanceList(),
          ),
        ],
      ),
    );
  }

  Widget _buildDateSelector(bool isToday) {
    return Container(
      padding: const EdgeInsets.all(AdminTheme.spacingMD),
      decoration: BoxDecoration(
        color: AdminTheme.surface,
        boxShadow: AdminTheme.cardShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          InkWell(
            onTap: _selectDate,
            borderRadius: BorderRadius.circular(AdminTheme.radiusSmall),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AdminTheme.spacingSM,
                vertical: AdminTheme.spacingXS,
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 20,
                    color: AdminTheme.primary,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    isToday ? 'Today' : DateFormat('MMM dd, yyyy').format(selectedDate),
                    style: AdminTheme.bodyLarge.copyWith(
                      color: AdminTheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.arrow_drop_down,
                    color: AdminTheme.primary,
                  ),
                ],
              ),
            ),
          ),
          if (!isToday)
            TextButton(
              onPressed: () {
                setState(() {
                  selectedDate = DateTime.now();
                });
                _fetchAttendance();
              },
              child: Text(
                'Go to Today',
                style: TextStyle(color: AdminTheme.primary),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryBar() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AdminTheme.screenPadding,
        vertical: AdminTheme.spacingMD,
      ),
      color: AdminTheme.primary.withOpacity(0.05),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryItem('Present', presentCount, AdminTheme.statusSuccess),
          _buildSummaryDivider(),
          _buildSummaryItem('Late', lateCount, AdminTheme.statusWarning),
          _buildSummaryDivider(),
          _buildSummaryItem('Absent', absentCount, AdminTheme.statusError),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, int count, Color color) {
    return Column(
      children: [
        AnimatedSwitcher(
          duration: AdminAnimations.fadeDuration,
          child: Text(
            count.toString(),
            key: ValueKey(count),
            style: AdminTheme.headingMedium.copyWith(color: color),
          ),
        ),
        const SizedBox(height: 2),
        Text(label, style: AdminTheme.bodySmall),
      ],
    );
  }

  Widget _buildSummaryDivider() {
    return Container(
      width: 1,
      height: 36,
      color: AdminTheme.textMuted.withOpacity(0.2),
    );
  }

  Widget _buildErrorState() {
    return AdminEmptyState(
      icon: Icons.error_outline,
      title: 'Unable to load attendance',
      subtitle: error,
      action: ElevatedButton.icon(
        onPressed: _fetchAttendance,
        icon: const Icon(Icons.refresh),
        label: const Text('Retry'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AdminTheme.primary,
          foregroundColor: Colors.white,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const AdminEmptyState(
      icon: Icons.event_busy,
      title: 'No Attendance Records',
      subtitle: 'No attendance data for the selected date',
    );
  }

  Widget _buildAttendanceList() {
    return RefreshIndicator(
      onRefresh: _fetchAttendance,
      color: AdminTheme.primary,
      child: AnimatedSwitcher(
        duration: AdminAnimations.fadeDuration,
        child: ListView.builder(
          key: ValueKey(selectedDate),
          padding: const EdgeInsets.all(AdminTheme.screenPadding),
          itemCount: attendanceList.length,
          itemBuilder: (context, index) {
            return AdminFadeIn(
              delay: Duration(milliseconds: 80 + (index * 30)),
              child: _buildAttendanceCard(attendanceList[index]),
            );
          },
        ),
      ),
    );
  }

  Widget _buildAttendanceCard(Map<String, dynamic> record) {
    // Try multiple possible field names for employee name
    final name = record['name'] ?? 
                 record['full_name'] ?? 
                 record['employee_name'] ??
                 record['user_name'] ??
                 record['salesman_name'] ??
                 record['staff_name'] ??
                 (record['employee'] != null ? record['employee']['name'] ?? record['employee']['full_name'] : null) ??
                 (record['user'] != null ? record['user']['name'] ?? record['user']['full_name'] : null) ??
                 (record['salesman'] != null ? record['salesman']['name'] ?? record['salesman']['full_name'] : null) ??
                 'Unknown';
    final status = _getAttendanceStatus(record);
    final statusColor = _getStatusColor(status);
    final checkIn = record['check_in_time'] ?? record['checkin_time'] ?? record['login_time'];
    final checkOut = record['check_out_time'] ?? record['checkout_time'] ?? record['logout_time'];
    final isAbsent = status == 'Absent';

    return AnimatedContainer(
      duration: AdminAnimations.statusChangeDuration,
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isAbsent 
            ? AdminTheme.surface.withOpacity(0.7) 
            : AdminTheme.surface,
        borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
        boxShadow: AdminTheme.cardShadow,
        border: status == 'Late'
            ? Border.all(
                color: AdminTheme.statusWarning.withOpacity(0.3),
                width: 1,
              )
            : null,
      ),
      child: InkWell(
        onTap: isAbsent ? null : () => _showAttendanceDetails(record),
        borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
        child: Padding(
          padding: const EdgeInsets.all(AdminTheme.cardPadding),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AdminTheme.radiusSmall),
                ),
                child: Center(
                  child: Text(
                    _getInitials(name),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: AdminTheme.bodyLarge.copyWith(
                        color: isAbsent ? AdminTheme.textMuted : AdminTheme.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    if (!isAbsent)
                      Row(
                        children: [
                          Icon(
                            Icons.login,
                            size: 14,
                            color: AdminTheme.textMuted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatTime(checkIn),
                            style: AdminTheme.bodySmall,
                          ),
                          if (checkOut != null) ...[
                            const SizedBox(width: 12),
                            Icon(
                              Icons.logout,
                              size: 14,
                              color: AdminTheme.textMuted,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatTime(checkOut),
                              style: AdminTheme.bodySmall,
                            ),
                          ],
                        ],
                      )
                    else
                      Text(
                        'Not checked in',
                        style: AdminTheme.bodySmall.copyWith(
                          color: AdminTheme.statusError.withOpacity(0.7),
                        ),
                      ),
                  ],
                ),
              ),
              // Status & Duration
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  AdminStatusChip(
                    label: status,
                    color: statusColor,
                    filled: true,
                  ),
                  if (!isAbsent && checkIn != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      _calculateDuration(checkIn, checkOut),
                      style: AdminTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAttendanceDetails(Map<String, dynamic> record) {
    final name = record['name'] ?? record['full_name'] ?? record['employee_name'] ?? 'Unknown';
    
    // Handle nested attendance object
    final attendanceData = record['attendance'] ?? record;
    
    final checkIn = record['check_in_time'] ?? 
                   attendanceData['check_in_time'] ?? 
                   attendanceData['checkin_time'];
    final location = record['location'] ?? 
                    attendanceData['location'] ?? 
                    'No location data';
    final photoUrl = record['photo_url'] ?? 
                    attendanceData['photo_url'];
    final latitude = record['latitude'] ?? 
                    record['check_in_lat'] ?? 
                    attendanceData['latitude'] ?? 
                    attendanceData['check_in_lat'];
    final longitude = record['longitude'] ?? 
                     record['check_in_lng'] ?? 
                     attendanceData['longitude'] ?? 
                     attendanceData['check_in_lng'];
    
    if (kDebugMode) debugPrint('📸 Photo URL: $photoUrl');
    if (kDebugMode) debugPrint('📍 Location: $location');
    if (kDebugMode) debugPrint('🗺️ Coords: $latitude, $longitude');
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Check-in: ${_formatTime(checkIn)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            
            const Divider(),
            
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Photo
                    if (photoUrl != null) ...[
                      const Text(
                        'Attendance Photo',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          '${ApiConstants.BASE_URL}$photoUrl',
                          width: double.infinity,
                          height: 300,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              height: 300,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade200,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.person,
                                  size: 80,
                                  color: Colors.grey,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    
                    // Location
                    const Text(
                      'Location',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.location_on, color: Colors.blue.shade700),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              location,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Coordinates (if available)
                    if (latitude != null && longitude != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Coordinates',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Lat: ${latitude.toStringAsFixed(6)}, Lng: ${longitude.toStringAsFixed(6)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}
