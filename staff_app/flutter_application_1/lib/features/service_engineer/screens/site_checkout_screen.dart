import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/service_engineer_theme.dart';
import '../../../core/widgets/engineer_components.dart';
import '../../../core/utils/animations.dart';
import '../models/service_job.dart';
import 'feedback_qr_screen.dart';

/// Site Check-Out / Job Completion Screen
///
/// Final step of service job with:
/// - Resolution notes collection
/// - GPS proof of departure
/// - Success confirmation with finality
/// - Seamless transition to feedback QR
class SiteCheckoutScreen extends StatefulWidget {
  final ServiceJob job;

  const SiteCheckoutScreen({super.key, required this.job});

  @override
  State<SiteCheckoutScreen> createState() => _SiteCheckoutScreenState();
}

class _SiteCheckoutScreenState extends State<SiteCheckoutScreen> {
  bool isLoading = false;
  bool isCapturingLocation = true;
  bool isSuccess = false;
  Position? currentPosition;
  String? locationError;
  DateTime? completionTime;
  String? feedbackUrl;
  String? feedbackToken;

  final _resolutionController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _resolutionFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _captureLocation();
  }

  @override
  void dispose() {
    _resolutionController.dispose();
    _resolutionFocusNode.dispose();
    super.dispose();
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
            locationError = 'Location permission denied.';
            isCapturingLocation = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          locationError = 'Location permission permanently denied.';
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

  Future<void> _completeJob() async {
    if (!_formKey.currentState!.validate()) {
      _resolutionFocusNode.requestFocus();
      return;
    }

    if (currentPosition == null) return;

    // Confirm dialog with professional styling
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusLarge),
        ),
        title: Row(
          children: [
            Icon(
              Icons.check_circle,
              color: ServiceEngineerTheme.statusCompleted,
            ),
            const SizedBox(width: 12),
            const Text('Complete Job?'),
          ],
        ),
        content: const Text(
          'This will mark the job as completed and generate a feedback QR code for the customer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Cancel',
              style: TextStyle(color: ServiceEngineerTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: ServiceEngineerTheme.statusCompleted,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(
                  ServiceEngineerTheme.radiusMedium,
                ),
              ),
            ),
            child: const Text('Complete Job'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final response = await ApiService.instance.post(
        '/api/service-requests/${widget.job.id}/complete',
        body: {
          'resolution_notes': _resolutionController.text,
          'checkout_latitude': currentPosition!.latitude,
          'checkout_longitude': currentPosition!.longitude,
          'checkout_time': DateTime.now().toIso8601String(),
        },
      );

      if (response.success) {
        HapticFeedback.heavyImpact();

        if (response.data != null) {
          feedbackUrl = response.data['feedback_url'];
          feedbackToken = response.data['feedback_token'];
        }

        setState(() {
          isSuccess = true;
          completionTime = DateTime.now();
          isLoading = false;
        });

        // Show success then navigate to QR
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => FeedbackQrScreen(
                job: widget.job,
                feedbackUrl: feedbackUrl,
                feedbackToken: feedbackToken,
              ),
            ),
          );
        }
      } else {
        throw Exception(response.message ?? 'Completion failed');
      }
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to complete job: $e'),
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
        backgroundColor: ServiceEngineerTheme.statusCompleted,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Complete Job',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(ServiceEngineerTheme.screenPadding),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Completion status banner
              FadeIn(child: _buildCompletionBanner()),
              const SizedBox(height: 24),

              // Job summary
              FadeIn(
                delay: const Duration(milliseconds: 100),
                child: _buildJobSummary(),
              ),
              const SizedBox(height: 24),

              // Resolution notes
              FadeIn(
                delay: const Duration(milliseconds: 150),
                child: _buildResolutionSection(),
              ),
              const SizedBox(height: 24),

              // Location capture
              FadeIn(
                delay: const Duration(milliseconds: 200),
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
                delay: const Duration(milliseconds: 250),
                child: _buildInfoNote(),
              ),
              const SizedBox(height: 32),

              // Complete button
              FadeIn(
                delay: const Duration(milliseconds: 300),
                child: EngineerActionButton(
                  label: 'MARK AS COMPLETED',
                  icon: Icons.check_circle,
                  backgroundColor: ServiceEngineerTheme.statusCompleted,
                  isLoading: isLoading,
                  onPressed: (isCapturingLocation || currentPosition == null)
                      ? null
                      : _completeJob,
                  disabledReason: currentPosition == null
                      ? 'Waiting for location...'
                      : null,
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCompletionBanner() {
    return Container(
      padding: const EdgeInsets.all(ServiceEngineerTheme.cardPaddingLarge),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            ServiceEngineerTheme.statusCompleted,
            ServiceEngineerTheme.statusCompleted.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusLarge),
      ),
      child: Column(
        children: [
          const Icon(Icons.task_alt, size: 48, color: Colors.white),
          const SizedBox(height: 12),
          const Text(
            'Ready to Complete',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Fill in the resolution notes and confirm completion',
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: 13,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildJobSummary() {
    return EngineerSectionCard(
      title: 'Job Summary',
      icon: Icons.work,
      iconColor: ServiceEngineerTheme.statusCompleted,
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
          EngineerInfoRow(
            icon: Icons.description,
            label: 'Issue',
            value: widget.job.description,
          ),
        ],
      ),
    );
  }

  Widget _buildResolutionSection() {
    return EngineerSectionCard(
      title: 'Resolution Notes',
      icon: Icons.edit_note,
      iconColor: ServiceEngineerTheme.primary,
      isRequired: true,
      child: TextFormField(
        controller: _resolutionController,
        focusNode: _resolutionFocusNode,
        maxLines: 5,
        style: ServiceEngineerTheme.bodyMedium,
        decoration: InputDecoration(
          hintText: 'Describe what was done to resolve the issue...',
          hintStyle: TextStyle(color: ServiceEngineerTheme.textSecondary),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(
              ServiceEngineerTheme.radiusMedium,
            ),
            borderSide: BorderSide(color: ServiceEngineerTheme.divider),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(
              ServiceEngineerTheme.radiusMedium,
            ),
            borderSide: BorderSide(color: ServiceEngineerTheme.divider),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(
              ServiceEngineerTheme.radiusMedium,
            ),
            borderSide: BorderSide(
              color: ServiceEngineerTheme.primary,
              width: 2,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(
              ServiceEngineerTheme.radiusMedium,
            ),
            borderSide: BorderSide(color: ServiceEngineerTheme.statusError),
          ),
          filled: true,
          fillColor: ServiceEngineerTheme.surface,
          contentPadding: const EdgeInsets.all(16),
        ),
        validator: (value) {
          if (value == null || value.trim().isEmpty) {
            return 'Please enter resolution notes';
          }
          if (value.trim().length < 10) {
            return 'Please provide more detail (at least 10 characters)';
          }
          return null;
        },
      ),
    );
  }

  Widget _buildInfoNote() {
    return Container(
      padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB), // Amber light
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
        border: Border.all(color: Colors.amber.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.qr_code_2, color: Colors.amber, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'A feedback QR code will be generated for the customer to rate your service.',
              style: TextStyle(color: Colors.amber[800], fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessView() {
    final timeString = completionTime != null
        ? DateFormat('hh:mm a').format(completionTime!)
        : '';

    return EngineerSuccessConfirmation(
      title: 'Job Completed!',
      message:
          'Great work! The job at ${widget.job.customerName} has been marked as completed.',
      timestamp: 'Completed at $timeString',
      additionalInfo: 'Generating feedback QR code...',
    );
  }
}
