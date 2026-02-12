import 'package:flutter/material.dart';

/// Service Engineer Theme Configuration
/// 
/// Designed for field-ready use:
/// - High contrast for outdoor visibility
/// - Large touch targets for gloved hands
/// - Clear status indicators
/// - Bold, action-oriented design
class ServiceEngineerTheme {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS COLORS - Clear, distinct colors for job states
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// PENDING / ASSIGNED - Blue (awaiting action)
  static const Color statusPending = Color(0xFF2563EB);
  static const Color statusPendingLight = Color(0xFFDBEAFE);
  
  /// IN PROGRESS - Orange (active work)
  static const Color statusInProgress = Color(0xFFF97316);
  static const Color statusInProgressLight = Color(0xFFFED7AA);
  
  /// COMPLETED - Green (done)
  static const Color statusCompleted = Color(0xFF16A34A);
  static const Color statusCompletedLight = Color(0xFFDCFCE7);
  
  /// ERROR / BREACHED - Red (attention needed)
  static const Color statusError = Color(0xFFDC2626);
  static const Color statusErrorLight = Color(0xFFFEE2E2);
  
  /// WARNING - Amber (caution)
  static const Color statusWarning = Color(0xFFF59E0B);
  static const Color statusWarningLight = Color(0xFFFEF3C7);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIORITY COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  
  static const Color priorityCritical = Color(0xFFDC2626);
  static const Color priorityUrgent = Color(0xFFF97316);
  static const Color priorityNormal = Color(0xFF2563EB);
  static const Color priorityLow = Color(0xFF6B7280);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY COLORS - Teal for service/engineering context
  // ═══════════════════════════════════════════════════════════════════════════
  
  static const Color primary = Color(0xFF0D9488);
  static const Color primaryLight = Color(0xFF5EEAD4);
  static const Color primaryDark = Color(0xFF0F766E);
  static const Color primarySurface = Color(0xFFF0FDFA);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NEUTRAL COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Colors.white;
  static const Color surfaceElevated = Color(0xFFFAFAFA);
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color border = Color(0xFFE2E8F0);
  static const Color divider = Color(0xFFF1F5F9);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SIZING - Large touch targets for field use
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Minimum touch target (48dp per Material guidelines)
  static const double touchTargetMin = 48.0;
  
  /// Large touch target for primary actions
  static const double touchTargetLarge = 56.0;
  
  /// Extra large for critical actions (check-in/out)
  static const double touchTargetXL = 64.0;
  
  /// Card padding
  static const double cardPadding = 16.0;
  static const double cardPaddingLarge = 20.0;
  
  /// Screen padding
  static const double screenPadding = 16.0;
  
  /// Border radius
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TYPOGRAPHY - Bold and readable
  // ═══════════════════════════════════════════════════════════════════════════
  
  static const TextStyle headlineLarge = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: textPrimary,
    letterSpacing: -0.5,
  );
  
  static const TextStyle headlineMedium = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: textPrimary,
  );
  
  static const TextStyle titleLarge = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );
  
  static const TextStyle titleMedium = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );
  
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    color: textPrimary,
  );
  
  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    color: textSecondary,
  );
  
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    letterSpacing: 0.5,
  );
  
  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: textMuted,
  );
  
  static const TextStyle bodySmall = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.normal,
    color: textSecondary,
  );
  
  static const TextStyle labelMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: textPrimary,
  );
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /// Get color for job status
  static Color getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return statusCompleted;
      case 'IN_PROGRESS':
        return statusInProgress;
      case 'PENDING':
      case 'ASSIGNED':
        return statusPending;
      case 'CANCELLED':
        return statusError;
      default:
        return textMuted;
    }
  }
  
  /// Get light background color for status
  static Color getStatusLightColor(String status) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return statusCompletedLight;
      case 'IN_PROGRESS':
        return statusInProgressLight;
      case 'PENDING':
      case 'ASSIGNED':
        return statusPendingLight;
      case 'CANCELLED':
        return statusErrorLight;
      default:
        return divider;
    }
  }
  
  /// Get color for priority
  static Color getPriorityColor(String priority) {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        return priorityCritical;
      case 'URGENT':
        return priorityUrgent;
      case 'NORMAL':
        return priorityNormal;
      case 'LOW':
        return priorityLow;
      default:
        return priorityNormal;
    }
  }
  
  /// Get SLA indicator color
  static Color getSlaColor({required bool isBreached, required bool isWarning}) {
    if (isBreached) return statusError;
    if (isWarning) return statusWarning;
    return statusCompleted;
  }
  
  /// Get icon for status
  static IconData getStatusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return Icons.check_circle;
      case 'IN_PROGRESS':
        return Icons.engineering;
      case 'PENDING':
        return Icons.pending_actions;
      case 'ASSIGNED':
        return Icons.assignment_ind;
      case 'CANCELLED':
        return Icons.cancel;
      default:
        return Icons.help_outline;
    }
  }
}

/// Extension for convenient access to theme colors
extension ServiceEngineerContext on BuildContext {
  ServiceEngineerTheme get engineerTheme => ServiceEngineerTheme();
  
  Color statusColor(String status) => ServiceEngineerTheme.getStatusColor(status);
  Color statusLightColor(String status) => ServiceEngineerTheme.getStatusLightColor(status);
  Color priorityColor(String priority) => ServiceEngineerTheme.getPriorityColor(priority);
}
