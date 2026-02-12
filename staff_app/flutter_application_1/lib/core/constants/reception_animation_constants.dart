import 'package:flutter/material.dart';

/// Reception Animation Constants
///
/// RECEPTION UI IDEOLOGY:
/// Reception is fast data entry, continuous task switching, accuracy > beauty.
/// UI must feel: Light, Fast, Clear, Unobtrusive.
/// Reception UI should feel like a well-organized front desk, not a dashboard.
///
/// Strict animation guidelines:
/// - Duration: 150-220ms only
/// - Ease-out curves only
/// - Max movement: 8px
/// - No bouncy, flashy, or looping animations
/// - Zero animation during typing or scrolling
/// - Animation only explains state changes
///
/// UX RULE: If user notices animation → it's too slow
class ReceptionAnimationConstants {
  // ═══════════════════════════════════════════════════════════════════════════
  // DURATIONS - Strictly 80-220ms range
  // ═══════════════════════════════════════════════════════════════════════════

  /// Button tap feedback (80-100ms)
  static const Duration buttonTap = Duration(milliseconds: 90);

  /// Quick transitions like field focus (100ms)
  static const Duration instant = Duration(milliseconds: 100);

  /// Status chip color change (120ms)
  static const Duration chipTransition = Duration(milliseconds: 120);

  /// Fade animations (150-180ms)
  static const Duration fade = Duration(milliseconds: 160);

  /// List item entry (150-180ms)
  static const Duration listEntry = Duration(milliseconds: 170);

  /// Standard transitions (180-200ms)
  static const Duration standard = Duration(milliseconds: 180);

  /// Slide animations (180-220ms)
  static const Duration slide = Duration(milliseconds: 200);

  /// Success state feedback (220ms max)
  static const Duration successDuration = Duration(milliseconds: 220);

  /// Maximum allowed duration (220ms hard limit for reception)
  static const Duration maxDuration = Duration(milliseconds: 220);

  // ═══════════════════════════════════════════════════════════════════════════
  // STAGGER DELAYS - For card grids and lists
  // ═══════════════════════════════════════════════════════════════════════════

  /// Dashboard card stagger (40ms between cards)
  static const Duration cardStagger = Duration(milliseconds: 40);

  /// List item stagger (25ms between items, capped at 5 items)
  static const Duration listStagger = Duration(milliseconds: 25);

  // ═══════════════════════════════════════════════════════════════════════════
  // CURVES - Ease-out only, no bouncy effects
  // ═══════════════════════════════════════════════════════════════════════════

  /// Default curve for all animations
  static const Curve defaultCurve = Curves.easeOut;

  /// Entry animations (slightly more pronounced)
  static const Curve entryCurve = Curves.easeOutCubic;

  /// Exit animations
  static const Curve exitCurve = Curves.easeIn;

  // ═══════════════════════════════════════════════════════════════════════════
  // MOVEMENT - Maximum 8px offset for subtle transitions
  // ═══════════════════════════════════════════════════════════════════════════

  /// Dashboard card slide-up offset (8px)
  static const double cardSlideOffset = 8.0;

  /// List item slide offset (6px)
  static const double listSlideOffset = 6.0;

  /// Maximum allowed movement (8px hard limit)
  static const double maxSlideOffset = 8.0;

  // ═══════════════════════════════════════════════════════════════════════════
  // SCALE - Subtle button press feedback
  // ═══════════════════════════════════════════════════════════════════════════

  /// Button press scale (0.98)
  static const double buttonPressScale = 0.98;

  /// Card press scale (0.985)
  static const double cardPressScale = 0.985;

  // ═══════════════════════════════════════════════════════════════════════════
  // OPACITY
  // ═══════════════════════════════════════════════════════════════════════════

  /// Form opacity during loading
  static const double formLoadingOpacity = 0.65;

  /// Disabled state opacity
  static const double disabledOpacity = 0.45;

  /// Muted/closed items opacity
  static const double closedItemOpacity = 0.7;

  // ═══════════════════════════════════════════════════════════════════════════
  // RECEPTION DESIGN COLORS - Calm, professional palette
  // ═══════════════════════════════════════════════════════════════════════════

  /// Primary - Calm Blue
  static const Color primary = Color(0xFF4A90D9);

  /// Primary Dark - Deeper Blue
  static const Color primaryDark = Color(0xFF2E6BB8);

  /// Success - Soft Green
  static const Color success = Color(0xFF5CB85C);

  /// Warning - Muted Amber
  static const Color warning = Color(0xFFE6A23C);

  /// Danger - Soft Red
  static const Color danger = Color(0xFFE74C3C);

  /// Neutral Background
  static const Color neutralBg = Color(0xFFF5F7FA);

  /// Card Background
  static const Color cardBg = Color(0xFFFFFFFF);

  /// Border Color
  static const Color border = Color(0xFFE4E7EB);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS COLORS - Consistent across Reception app
  // ═══════════════════════════════════════════════════════════════════════════

  /// NEW status color (Calm Blue)
  static const Color statusNew = Color(0xFF4A90D9);

  /// ASSIGNED status color (Muted Amber/Orange)
  static const Color statusAssigned = Color(0xFFE6A23C);

  /// IN PROGRESS status color (Purple)
  static const Color statusInProgress = Color(0xFF9B59B6);

  /// CLOSED status color (Soft Green)
  static const Color statusClosed = Color(0xFF5CB85C);

  /// CANCELLED status color (Soft Red)
  static const Color statusCancelled = Color(0xFFE74C3C);

  /// Sales type color (Blue)
  static const Color typeSales = Color(0xFF4A90D9);

  /// Service type color (Purple)
  static const Color typeService = Color(0xFF9B59B6);

  /// Get color for status string
  static Color getStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'NEW':
      case 'PENDING':
        return statusNew;
      case 'ASSIGNED':
        return statusAssigned;
      case 'IN_PROGRESS':
      case 'IN PROGRESS':
      case 'ONGOING':
      case 'WORKING':
        return statusInProgress;
      case 'CLOSED':
      case 'COMPLETED':
      case 'CONVERTED':
        return statusClosed;
      case 'CANCELLED':
        return statusCancelled;
      default:
        return const Color(0xFF95A5A6);
    }
  }

  /// Get color for request type
  static Color getTypeColor(String? type) {
    switch (type?.toUpperCase()) {
      case 'SALES':
      case 'ENQUIRY':
        return typeSales;
      case 'SERVICE':
      case 'COMPLAINT':
        return typeService;
      default:
        return primary;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Calculate staggered delay for item at index (capped at 5 items)
  static Duration getStaggerDelay(int index, {Duration base = cardStagger}) {
    // Cap at 5 items to prevent long waits
    final cappedIndex = index.clamp(0, 4);
    return base * cappedIndex;
  }

  /// Calculate list stagger delay (capped at 5 items)
  static Duration getListStaggerDelay(int index) {
    final cappedIndex = index.clamp(0, 4);
    return listStagger * cappedIndex;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOUCH TARGETS - Large touch targets for fast work
  // ═══════════════════════════════════════════════════════════════════════════

  /// Minimum touch target size (48dp recommended by Material)
  static const double minTouchTarget = 48.0;

  /// Large touch target for primary actions
  static const double largeTouchTarget = 56.0;

  /// Card minimum height for easy tapping
  static const double cardMinHeight = 72.0;

  /// Button height for primary actions
  static const double buttonHeight = 52.0;

  // ═══════════════════════════════════════════════════════════════════════════
  // SPACING - Consistent spacing for reception UI
  // ═══════════════════════════════════════════════════════════════════════════

  /// Small spacing
  static const double spacingXs = 4.0;

  /// Small spacing
  static const double spacingSm = 8.0;

  /// Medium spacing
  static const double spacingMd = 12.0;

  /// Large spacing
  static const double spacingLg = 16.0;

  /// Extra large spacing
  static const double spacingXl = 24.0;

  /// Section spacing
  static const double spacingSection = 20.0;

  // ═══════════════════════════════════════════════════════════════════════════
  // BORDER RADIUS - Consistent rounded corners
  // ═══════════════════════════════════════════════════════════════════════════

  /// Small radius for chips, tags
  static const double radiusSm = 6.0;

  /// Medium radius for cards
  static const double radiusMd = 10.0;

  /// Large radius for modals, sheets
  static const double radiusLg = 16.0;
}
