import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/service_engineer_theme.dart';
import '../../../core/widgets/engineer_components.dart';
import '../../../core/utils/animations.dart';
import '../models/service_job.dart';
import 'site_checkin_screen.dart';
import 'site_checkout_screen.dart';
import 'feedback_qr_screen.dart';

/// Job Details Screen
/// 
/// Shows complete job information with:
/// - Status card with visual hierarchy
/// - Sectioned layout (Customer, Job Info, SLA)
/// - Context-aware action buttons
/// - Sticky bottom action bar
/// 
/// Actions based on status:
/// - PENDING/ASSIGNED → "Check-In to Site"
/// - IN_PROGRESS → "Complete Job"  
/// - COMPLETED → "View Feedback QR"
class JobDetailsScreen extends StatefulWidget {
  final ServiceJob job;

  const JobDetailsScreen({super.key, required this.job});

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  late ServiceJob job;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    job = widget.job;
  }

  Future<void> _refreshJob() async {
    try {
      if (kDebugMode) debugPrint('🔄 Refreshing job ${job.id}...');
      final response = await ApiService.instance.get('/api/service-requests/${job.id}');
      if (kDebugMode) debugPrint('📥 Response success: ${response.success}, data: ${response.data}');
      if (response.success && response.data != null && mounted) {
        final updatedJob = ServiceJob.fromJson(response.data);
        if (kDebugMode) debugPrint('📋 Updated job status: ${updatedJob.status}');
        setState(() {
          job = updatedJob;
        });
      }
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Error refreshing job: $e');
    }
  }

  Future<void> _makePhoneCall() async {
    final Uri phoneUri = Uri(scheme: 'tel', path: job.customerPhone);
    try {
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not launch phone dialer')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _openDirections() async {
    if (job.customerAddress == null || job.customerAddress!.isEmpty) return;
    
    // Clean address: replace newlines with spaces, trim extra whitespace
    final cleanAddress = job.customerAddress!
        .replaceAll('\n', ', ')
        .replaceAll('\r', '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    
    final query = Uri.encodeComponent(cleanAddress);
    final Uri mapsUri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    
    try {
      await launchUrl(mapsUri, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open maps: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = job.status.toUpperCase();
    
    return Scaffold(
      backgroundColor: ServiceEngineerTheme.background,
      appBar: AppBar(
        backgroundColor: ServiceEngineerTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          job.ticketNumber ?? 'Job #${job.id}',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshJob,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // Scrollable content
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refreshJob,
              color: ServiceEngineerTheme.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(ServiceEngineerTheme.screenPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStatusCard(),
                    const SizedBox(height: 16),
                    _buildCustomerCard(),
                    const SizedBox(height: 16),
                    _buildJobInfoCard(),
                    if (job.slaDeadline != null) ...[
                      const SizedBox(height: 16),
                      _buildSlaCard(),
                    ],
                    if (status == 'COMPLETED') ...[
                      const SizedBox(height: 16),
                      _buildCompletionCard(),
                    ],
                    // Bottom padding for sticky action bar
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ),
          // Sticky bottom action bar
          _buildStickyActionBar(),
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    final statusColor = ServiceEngineerTheme.getStatusColor(job.status);
    final statusIcon = ServiceEngineerTheme.getStatusIcon(job.status);

    return FadeIn(
      child: Container(
        padding: const EdgeInsets.all(ServiceEngineerTheme.cardPaddingLarge),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              statusColor.withOpacity(0.15),
              statusColor.withOpacity(0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusLarge),
          border: Border.all(color: statusColor.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
              ),
              child: Icon(statusIcon, color: statusColor, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    job.status.toUpperCase().replaceAll('_', ' '),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
                  const SizedBox(height: 6),
                  EngineerPriorityBadge(priority: job.priority),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerCard() {
    return FadeIn(
      delay: const Duration(milliseconds: 100),
      child: EngineerSectionCard(
        title: 'Customer Details',
        icon: Icons.person,
        iconColor: ServiceEngineerTheme.statusPending,
        child: Column(
          children: [
            EngineerInfoRow(
              icon: Icons.badge,
              label: 'Name',
              value: job.customerName,
            ),
            EngineerInfoRow(
              icon: Icons.phone,
              label: 'Phone',
              value: job.customerPhone,
            ),
            if (job.customerAddress != null)
              EngineerInfoRow(
                icon: Icons.location_on,
                label: 'Address',
                value: job.customerAddress!,
              ),
            // Quick actions - phone is always available, directions only if address exists
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _QuickContactButton(
                    icon: Icons.phone,
                    label: 'Call',
                    onTap: _makePhoneCall,
                  ),
                ),
                if (job.customerAddress != null) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickContactButton(
                      icon: Icons.directions,
                      label: 'Directions',
                      onTap: _openDirections,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJobInfoCard() {
    return FadeIn(
      delay: const Duration(milliseconds: 150),
      child: EngineerSectionCard(
        title: 'Job Details',
        icon: Icons.build,
        iconColor: ServiceEngineerTheme.primary,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            EngineerInfoRow(
              icon: Icons.confirmation_number,
              label: 'Ticket',
              value: job.ticketNumber ?? '#${job.id}',
            ),
            if (job.type != null)
              EngineerInfoRow(
                icon: Icons.category,
                label: 'Type',
                value: job.type!,
              ),
            if (job.productName != null)
              EngineerInfoRow(
                icon: Icons.inventory,
                label: 'Product',
                value: job.productName!,
              ),
            EngineerInfoRow(
              icon: Icons.person,
              label: 'Assigned To',
              value: job.engineerName ?? 'Not Assigned',
            ),
            const Divider(height: 24),
            Text(
              'Description',
              style: ServiceEngineerTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            Text(
              job.description,
              style: ServiceEngineerTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSlaCard() {
    final slaColor = ServiceEngineerTheme.getSlaColor(
      isBreached: job.isSlaBreached,
      isWarning: job.isSlaWarning,
    );
    
    String slaStatus = 'On Track';
    IconData slaIcon = Icons.check_circle;
    
    if (job.isSlaBreached) {
      slaStatus = 'SLA BREACHED';
      slaIcon = Icons.error;
    } else if (job.isSlaWarning) {
      slaStatus = 'SLA Warning';
      slaIcon = Icons.warning;
    }

    return FadeIn(
      delay: const Duration(milliseconds: 200),
      child: Container(
        padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
        decoration: BoxDecoration(
          color: slaColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
          border: Border.all(color: slaColor.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(slaIcon, color: slaColor, size: 36),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    slaStatus,
                    style: TextStyle(
                      color: slaColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    job.status.toUpperCase() == 'COMPLETED'
                        ? 'Completed on time'
                        : job.slaRemainingText,
                    style: TextStyle(color: slaColor, fontSize: 14),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletionCard() {
    return FadeIn(
      delay: const Duration(milliseconds: 250),
      child: EngineerSectionCard(
        title: 'Completion Details',
        icon: Icons.check_circle,
        iconColor: ServiceEngineerTheme.statusCompleted,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (job.completedAt != null)
              EngineerInfoRow(
                icon: Icons.access_time,
                label: 'Completed',
                value: job.completedAtFormatted,
                iconColor: ServiceEngineerTheme.statusCompleted,
              ),
            if (job.resolutionNotes != null && job.resolutionNotes!.isNotEmpty) ...[
              const Divider(height: 20),
              Text('Resolution', style: ServiceEngineerTheme.labelLarge),
              const SizedBox(height: 8),
              Text(job.resolutionNotes!, style: ServiceEngineerTheme.bodyMedium),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStickyActionBar() {
    final status = job.status.toUpperCase();

    return FadeIn(
      delay: const Duration(milliseconds: 300),
      child: Container(
        padding: EdgeInsets.only(
          left: ServiceEngineerTheme.screenPadding,
          right: ServiceEngineerTheme.screenPadding,
          top: 16,
          bottom: MediaQuery.of(context).padding.bottom + 16,
        ),
        decoration: BoxDecoration(
          color: ServiceEngineerTheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: _buildContextAwareAction(status),
      ),
    );
  }

  Widget _buildContextAwareAction(String status) {
    if (isLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: CircularProgressIndicator(),
        ),
      );
    }

    // PENDING or ASSIGNED → Check-In
    if (status == 'PENDING' || status == 'ASSIGNED') {
      return EngineerActionButton(
        label: 'CHECK-IN TO SITE',
        icon: Icons.location_on,
        backgroundColor: ServiceEngineerTheme.statusPending,
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SiteCheckinScreen(job: job),
            ),
          );
          if (kDebugMode) debugPrint('📤 Check-in returned with result: $result');
          if (result == true && mounted) {
            if (kDebugMode) debugPrint('🔄 Calling _refreshJob...');
            await _refreshJob();
            if (kDebugMode) debugPrint('✅ Refresh complete. Current status: ${job.status}');
          }
        },
      );
    }

    // IN_PROGRESS → Complete Job
    if (status == 'IN_PROGRESS') {
      return EngineerActionButton(
        label: 'COMPLETE JOB',
        icon: Icons.check_circle,
        backgroundColor: ServiceEngineerTheme.statusCompleted,
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SiteCheckoutScreen(job: job),
            ),
          );
          if (result == true && mounted) {
            await _refreshJob();
          }
        },
      );
    }

    // COMPLETED → View Feedback QR
    if (status == 'COMPLETED' && job.feedbackToken != null) {
      return EngineerActionButton(
        label: 'VIEW FEEDBACK QR',
        icon: Icons.qr_code,
        backgroundColor: ServiceEngineerTheme.primary,
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => FeedbackQrScreen(
                job: job,
                feedbackToken: job.feedbackToken,
              ),
            ),
          );
        },
      );
    }

    // Default: No action available
    return const SizedBox.shrink();
  }
}

/// Quick contact button
class _QuickContactButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickContactButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: ServiceEngineerTheme.primarySurface,
      borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusSmall),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusSmall),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: ServiceEngineerTheme.primary),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: ServiceEngineerTheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
