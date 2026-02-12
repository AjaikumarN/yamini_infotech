import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/theme/service_engineer_theme.dart';
import '../../../core/widgets/engineer_components.dart';
import '../../../core/utils/animations.dart';
import '../models/service_job.dart';

/// Feedback QR Screen
///
/// Professional QR code display with:
/// - Subtle QR fade-in animation
/// - Copy link option for offline scenarios
/// - Clear instructions
/// - Trust-building success messaging
class FeedbackQrScreen extends StatefulWidget {
  final ServiceJob job;
  final String? feedbackUrl;
  final String? feedbackToken;

  const FeedbackQrScreen({
    super.key,
    required this.job,
    this.feedbackUrl,
    this.feedbackToken,
  });

  @override
  State<FeedbackQrScreen> createState() => _FeedbackQrScreenState();
}

class _FeedbackQrScreenState extends State<FeedbackQrScreen> {
  bool _linkCopied = false;

  String get qrData =>
      widget.feedbackUrl ??
      'https://erp.example.com/feedback/${widget.job.id}?token=${widget.feedbackToken ?? 'demo'}';

  void _copyLink() {
    Clipboard.setData(ClipboardData(text: qrData));
    HapticFeedback.lightImpact();
    setState(() => _linkCopied = true);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            const Text('Feedback link copied!'),
          ],
        ),
        backgroundColor: ServiceEngineerTheme.statusCompleted,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(
            ServiceEngineerTheme.radiusMedium,
          ),
        ),
        duration: const Duration(seconds: 2),
      ),
    );

    // Reset after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _linkCopied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ServiceEngineerTheme.background,
      appBar: AppBar(
        backgroundColor: ServiceEngineerTheme.statusCompleted,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Customer Feedback',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () =>
              Navigator.of(context).popUntil((route) => route.isFirst),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(ServiceEngineerTheme.screenPadding),
        child: Column(
          children: [
            // Success banner
            FadeIn(child: _buildSuccessBanner()),
            const SizedBox(height: 24),

            // QR Code card
            FadeIn(
              delay: const Duration(milliseconds: 150),
              child: _buildQrCard(),
            ),
            const SizedBox(height: 24),

            // Offline option
            FadeIn(
              delay: const Duration(milliseconds: 200),
              child: _buildOfflineOption(),
            ),
            const SizedBox(height: 24),

            // Instructions
            FadeIn(
              delay: const Duration(milliseconds: 250),
              child: _buildInstructions(),
            ),
            const SizedBox(height: 32),

            // Done button
            FadeIn(
              delay: const Duration(milliseconds: 300),
              child: EngineerActionButton(
                label: 'BACK TO JOBS',
                icon: Icons.done_all,
                backgroundColor: ServiceEngineerTheme.primary,
                onPressed: () =>
                    Navigator.of(context).popUntil((route) => route.isFirst),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessBanner() {
    return Container(
      padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
      decoration: BoxDecoration(
        color: ServiceEngineerTheme.statusCompletedLight,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusLarge),
        border: Border.all(
          color: ServiceEngineerTheme.statusCompleted.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: ServiceEngineerTheme.statusCompleted,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Job Completed!',
                  style: ServiceEngineerTheme.titleLarge.copyWith(
                    color: ServiceEngineerTheme.statusCompleted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.job.ticketNumber ?? 'Job #${widget.job.id}',
                  style: ServiceEngineerTheme.caption,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQrCard() {
    return Container(
      padding: const EdgeInsets.all(ServiceEngineerTheme.cardPaddingLarge),
      decoration: BoxDecoration(
        color: ServiceEngineerTheme.surface,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusLarge),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text('Scan for Feedback', style: ServiceEngineerTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Ask the customer to scan this QR code\nto rate your service',
            textAlign: TextAlign.center,
            style: ServiceEngineerTheme.bodyMedium,
          ),
          const SizedBox(height: 24),

          // QR Code with subtle animation
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.8, end: 1.0),
            duration: AnimationConstants.normal,
            curve: AnimationConstants.enterCurve,
            builder: (context, scale, child) {
              return Transform.scale(scale: scale, child: child);
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(
                  ServiceEngineerTheme.radiusMedium,
                ),
                border: Border.all(
                  color: ServiceEngineerTheme.divider,
                  width: 2,
                ),
              ),
              child: QrImageView(
                data: qrData,
                version: QrVersions.auto,
                size: 200,
                backgroundColor: Colors.white,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: Color(0xFF0D9488), // Primary teal
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: Color(0xFF1E293B), // Text primary
                ),
                errorStateBuilder: (context, error) {
                  return Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      color: ServiceEngineerTheme.statusErrorLight,
                      borderRadius: BorderRadius.circular(
                        ServiceEngineerTheme.radiusMedium,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error,
                          color: ServiceEngineerTheme.statusError,
                          size: 40,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'QR Generation Failed',
                          style: TextStyle(
                            color: ServiceEngineerTheme.statusError,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Customer info
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: ServiceEngineerTheme.background,
              borderRadius: BorderRadius.circular(
                ServiceEngineerTheme.radiusMedium,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.person,
                  color: ServiceEngineerTheme.textSecondary,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  widget.job.customerName,
                  style: ServiceEngineerTheme.labelLarge,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfflineOption() {
    return Container(
      padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
      decoration: BoxDecoration(
        color: ServiceEngineerTheme.surface,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
        border: Border.all(color: ServiceEngineerTheme.divider),
      ),
      child: Row(
        children: [
          Icon(Icons.link, color: ServiceEngineerTheme.textSecondary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Can\'t scan?', style: ServiceEngineerTheme.labelLarge),
                Text(
                  'Copy the feedback link instead',
                  style: ServiceEngineerTheme.caption,
                ),
              ],
            ),
          ),
          TextButton.icon(
            onPressed: _copyLink,
            icon: Icon(_linkCopied ? Icons.check : Icons.copy, size: 18),
            label: Text(_linkCopied ? 'Copied!' : 'Copy'),
            style: TextButton.styleFrom(
              foregroundColor: _linkCopied
                  ? ServiceEngineerTheme.statusCompleted
                  : ServiceEngineerTheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructions() {
    return EngineerSectionCard(
      title: 'Instructions',
      icon: Icons.lightbulb,
      iconColor: Colors.amber,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInstructionStep(1, 'Show this QR code to the customer'),
          _buildInstructionStep(2, 'Customer scans with their phone camera'),
          _buildInstructionStep(3, 'They rate your service and leave comments'),
          _buildInstructionStep(
            4,
            'Feedback helps improve service quality',
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildInstructionStep(int number, String text, {bool isLast = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: ServiceEngineerTheme.primarySurface,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$number',
                style: TextStyle(
                  color: ServiceEngineerTheme.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(text, style: ServiceEngineerTheme.bodyMedium),
            ),
          ),
        ],
      ),
    );
  }
}
