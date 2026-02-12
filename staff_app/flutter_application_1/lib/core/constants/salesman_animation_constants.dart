import 'package:flutter/material.dart';

/// Salesman Animation Constants
///
/// FIELD SALES APP ANIMATION RULES:
/// - Bold, readable, status-driven UI
/// - Animation confirms action, does not distract
/// - Works for outdoor use with poor network
/// - Low cognitive load for frequent daily use
///
/// STRICT TIMING RULES:
/// - Fade: 150-200ms
/// - Slide: 200-250ms  
/// - Button tap: 80-100ms
/// - Success feedback: ≤300ms
/// - If animation slows work → remove it
class SalesmanAnimationConstants {
  // ═══════════════════════════════════════════════════════════════════════════
  // DURATIONS - Strict limits for field performance
  // ═══════════════════════════════════════════════════════════════════════════

  /// Button tap feedback (80-100ms)
  static const Duration buttonTap = Duration(milliseconds: 90);

  /// Chip/filter transition
  static const Duration chipTransition = Duration(milliseconds: 120);

  /// Fade transitions (150-200ms)
  static const Duration fade = Duration(milliseconds: 150);

  /// List item entry animation
  static const Duration listEntry = Duration(milliseconds: 180);

  /// Slide transitions (200-250ms)
  static const Duration slide = Duration(milliseconds: 200);

  /// Card entry animation
  static const Duration cardEntry = Duration(milliseconds: 200);

  /// Success feedback (≤300ms)
  static const Duration success = Duration(milliseconds: 250);

  /// Status color transition
  static const Duration statusTransition = Duration(milliseconds: 200);

  /// Section expand/collapse
  static const Duration sectionToggle = Duration(milliseconds: 180);

  // ═══════════════════════════════════════════════════════════════════════════
  // CURVES - Ease-out only, no bounce
  // ═══════════════════════════════════════════════════════════════════════════

  /// Default curve for most animations
  static const Curve defaultCurve = Curves.easeOut;

  /// Entry animations (cards, list items)
  static const Curve entryCurve = Curves.easeOutCubic;

  /// Exit animations
  static const Curve exitCurve = Curves.easeIn;

  // ═══════════════════════════════════════════════════════════════════════════
  // MOVEMENT - Maximum 12px for subtle effect
  // ═══════════════════════════════════════════════════════════════════════════

  /// Card slide up distance
  static const double cardSlideOffset = 12.0;

  /// List item slide distance
  static const double listSlideOffset = 8.0;

  /// Button press scale
  static const double buttonPressScale = 0.97;

  /// Card press scale for tap feedback
  static const double cardPressScale = 0.98;

  // ═══════════════════════════════════════════════════════════════════════════
  // STAGGER DELAYS - For sequential card/list animations
  // ═══════════════════════════════════════════════════════════════════════════

  /// Delay between dashboard cards
  static const Duration cardStagger = Duration(milliseconds: 40);

  /// Delay between list items
  static const Duration listStagger = Duration(milliseconds: 25);

  /// Get stagger delay for card at index
  static Duration getCardStaggerDelay(int index) {
    return Duration(milliseconds: cardStagger.inMilliseconds * index);
  }

  /// Get stagger delay for list item at index
  static Duration getListStaggerDelay(int index) {
    // Cap at 5 items to avoid excessive delays
    final cappedIndex = index.clamp(0, 5);
    return Duration(milliseconds: listStagger.inMilliseconds * cappedIndex);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS COLORS - High contrast for outdoor visibility
  // ═══════════════════════════════════════════════════════════════════════════

  /// Priority: HOT - Red
  static const Color priorityHot = Color(0xFFE53935);

  /// Priority: WARM - Orange
  static const Color priorityWarm = Color(0xFFFF9800);

  /// Priority: COLD - Blue
  static const Color priorityCold = Color(0xFF2196F3);

  /// Status: NEW - Blue
  static const Color statusNew = Color(0xFF2196F3);

  /// Status: CONTACTED - Orange
  static const Color statusContacted = Color(0xFFFF9800);

  /// Status: QUALIFIED - Purple
  static const Color statusQualified = Color(0xFF9C27B0);

  /// Status: CONVERTED - Green
  static const Color statusConverted = Color(0xFF4CAF50);

  /// Status: LOST - Grey
  static const Color statusLost = Color(0xFF9E9E9E);

  /// Status: PENDING - Orange
  static const Color statusPending = Color(0xFFFF9800);

  /// Status: OVERDUE - Red
  static const Color statusOverdue = Color(0xFFE53935);

  /// Status: COMPLETED - Green
  static const Color statusCompleted = Color(0xFF4CAF50);

  /// Attendance: Checked In - Green
  static const Color attendanceCheckedIn = Color(0xFF4CAF50);

  /// Attendance: Not Checked In - Amber
  static const Color attendanceNotCheckedIn = Color(0xFFFFC107);

  /// Get priority color
  static Color getPriorityColor(String? priority) {
    switch (priority?.toUpperCase()) {
      case 'HOT':
        return priorityHot;
      case 'WARM':
        return priorityWarm;
      case 'COLD':
      default:
        return priorityCold;
    }
  }

  /// Get status color for enquiries
  static Color getEnquiryStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'new':
        return statusNew;
      case 'contacted':
        return statusContacted;
      case 'qualified':
        return statusQualified;
      case 'converted':
        return statusConverted;
      case 'lost':
        return statusLost;
      default:
        return statusNew;
    }
  }

  /// Get status color for follow-ups
  static Color getFollowupStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'completed':
        return statusCompleted;
      case 'overdue':
        return statusOverdue;
      case 'pending':
      default:
        return statusPending;
    }
  }

  /// Get status color for orders
  static Color getOrderStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return statusCompleted;
      case 'processing':
      case 'in_progress':
        return statusNew;
      case 'pending':
        return statusPending;
      case 'cancelled':
        return statusOverdue;
      default:
        return Colors.grey;
    }
  }
}
