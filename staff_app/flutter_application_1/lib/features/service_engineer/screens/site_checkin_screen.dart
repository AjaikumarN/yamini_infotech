import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/service_engineer_theme.dart';
import '../../../core/widgets/engineer_components.dart';
import '../../../core/utils/animations.dart';
import '../models/service_job.dart';

/// Site Check-In Screen
///
/// GPS proof of arrival with:
/// - Clear status indicators
/// - Large confirmation button
/// - Trust-building feedback after success
/// - No animations on GPS capture
class SiteCheckinScreen extends StatefulWidget {
  final ServiceJob job;

  const SiteCheckinScreen({super.key, required this.job});

  @override
  State<SiteCheckinScreen> createState() => _SiteCheckinScreenState();
}

class _SiteCheckinScreenState extends State<SiteCheckinScreen> {
  bool isLoading = false;
  bool isCapturingLocation = true;
  bool isSuccess = false;
  Position? currentPosition;
  String? locationError;
  DateTime? checkinTime;

  @override
  void initState() {
    super.initState();
    _captureLocation();
  }

  Future<void> _captureLocation() async {
    setState(() {
      isCapturingLocation = true;
      locationError = null;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          locationError = 'Location services are disabled. Please enable GPS.';
          isCapturingLocation = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            locationError =
                'Location permission denied. Please allow access to continue.';
            isCapturingLocation = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          locationError =
              'Location permission permanently denied. Please enable in Settings.';
          isCapturingLocation = false;
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      setState(() {
        currentPosition = position;
        isCapturingLocation = false;
      });
    } catch (e) {
      setState(() {
        locationError = 'Failed to get location. Please try again.';
        isCapturingLocation = false;
      });
    }
  }

  Future<void> _performCheckin() async {
    if (currentPosition == null) return;

    setState(() => isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final response = await ApiService.instance.put(
        '/api/service-requests/${widget.job.id}/status',
        body: {
          'status': 'IN_PROGRESS',
          'checkin_latitude': currentPosition!.latitude,
          'checkin_longitude': currentPosition!.longitude,
          'checkin_time': DateTime.now().toIso8601String(),
        },
      );

      if (response.success) {
        HapticFeedback.heavyImpact();
        debugPrint('✅ Check-in successful! Showing success screen...');
        setState(() {
          isSuccess = true;
          checkinTime = DateTime.now();
          isLoading = false;
        });

        // Auto-close after showing success
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          debugPrint('🔙 Popping back with result=true');
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(response.message ?? 'Check-in failed');
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Check-in failed: $e'),
            backgroundColor: ServiceEngineerTheme.statusError,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Show success screen
    if (isSuccess) {
      return Scaffold(
        backgroundColor: ServiceEngineerTheme.background,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(ServiceEngineerTheme.screenPadding),
            child: _buildSuccessView(),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: ServiceEngineerTheme.background,
      appBar: AppBar(
        backgroundColor: ServiceEngineerTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Site Check-In',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(ServiceEngineerTheme.screenPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Job summary
            FadeIn(child: _buildJobSummary()),
            const SizedBox(height: 24),

            // Big status indicator
            FadeIn(
              delay: const Duration(milliseconds: 100),
              child: _buildStatusIndicator(),
            ),
            const SizedBox(height: 24),

            // Location capture
            FadeIn(
              delay: const Duration(milliseconds: 150),
              child: EngineerLocationStatus(
                isCapturing: isCapturingLocation,
                hasLocation: currentPosition != null,
                hasError: locationError != null,
                errorMessage: locationError,
                latitude: currentPosition?.latitude,
                longitude: currentPosition?.longitude,
                onRetry: _captureLocation,
              ),
            ),
            const SizedBox(height: 24),

            // Info note
            FadeIn(
              delay: const Duration(milliseconds: 200),
              child: _buildInfoNote(),
            ),
            const SizedBox(height: 32),

            // Action button
            FadeIn(
              delay: const Duration(milliseconds: 250),
              child: EngineerActionButton(
                label: 'CONFIRM CHECK-IN',
                icon: Icons.login,
                backgroundColor: ServiceEngineerTheme.statusPending,
                isLoading: isLoading,
                onPressed: (isCapturingLocation || currentPosition == null)
                    ? null
                    : _performCheckin,
                disabledReason: currentPosition == null
                    ? 'Waiting for location...'
                    : null,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJobSummary() {
    return EngineerSectionCard(
      title: 'Job Details',
      icon: Icons.work,
      iconColor: ServiceEngineerTheme.statusPending,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.job.ticketNumber ?? 'Job #${widget.job.id}',
            style: ServiceEngineerTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          EngineerInfoRow(
            icon: Icons.person,
            label: 'Customer',
            value: widget.job.customerName,
          ),
          if (widget.job.customerAddress != null)
            EngineerInfoRow(
              icon: Icons.location_on,
              label: 'Address',
              value: widget.job.customerAddress!,
            ),
        ],
      ),
    );
  }

  Widget _buildStatusIndicator() {
    return Container(
      padding: const EdgeInsets.all(ServiceEngineerTheme.cardPaddingLarge),
      decoration: BoxDecoration(
        color: ServiceEngineerTheme.statusPendingLight,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusLarge),
        border: Border.all(
          color: ServiceEngineerTheme.statusPending.withOpacity(0.3),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.login,
            size: 48,
            color: ServiceEngineerTheme.statusPending,
          ),
          const SizedBox(height: 12),
          Text(
            'You are about to check in',
            style: ServiceEngineerTheme.titleLarge.copyWith(
              color: ServiceEngineerTheme.statusPending,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            'at ${widget.job.customerName}',
            style: ServiceEngineerTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoNote() {
    return Container(
      padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
      decoration: BoxDecoration(
        color: ServiceEngineerTheme.primarySurface,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
        border: Border.all(
          color: ServiceEngineerTheme.primary.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.info, color: ServiceEngineerTheme.primary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Your location will be recorded as proof of arrival at the customer site.',
              style: TextStyle(
                color: ServiceEngineerTheme.primary,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessView() {
    final timeString = checkinTime != null
        ? DateFormat('hh:mm a').format(checkinTime!)
        : '';

    return EngineerSuccessConfirmation(
      title: 'Checked In!',
      message: 'You have successfully checked in at ${widget.job.customerName}',
      timestamp: 'Checked in at $timeString',
    );
  }
}
