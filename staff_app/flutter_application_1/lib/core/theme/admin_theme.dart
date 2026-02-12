import 'package:flutter/material.dart';

/// Admin Theme - Control Panel Design System
/// 
/// Design Philosophy:
/// - Stable, authoritative, calm
/// - Data-confident, not decorative
/// - Like a quiet control room - everything visible, nothing distracting
/// 
/// Admin is observing, monitoring, deciding - not acting in the field.
class AdminTheme {
  AdminTheme._();
  
  // ==================== COLORS ====================
  
  /// Primary: Deep Indigo - Authority & Trust
  static const Color primary = Color(0xFF3949AB);
  static const Color primaryDark = Color(0xFF283593);
  static const Color primaryLight = Color(0xFF5C6BC0);
  
  /// Background: Clean Off-White
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceElevated = Color(0xFFFFFFFF);
  
  /// Text Colors
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textMuted = Color(0xFF9CA3AF);
  
  /// Status Colors - Muted & Professional
  static const Color statusSuccess = Color(0xFF059669);  // Muted Green
  static const Color statusWarning = Color(0xFFD97706);  // Soft Amber
  static const Color statusError = Color(0xFFDC2626);    // Calm Red
  static const Color statusNeutral = Color(0xFF6B7280); // Neutral Grey
  
  /// Location Status Colors
  static const Color statusActive = Color(0xFF10B981);   // Green - Active
  static const Color statusIdle = Color(0xFFF59E0B);     // Yellow - Idle
  static const Color statusOffline = Color(0xFF6B7280); // Grey - Offline
  
  /// Card Accents (Status-aware)
  static const Color accentPositive = Color(0xFFECFDF5); // Light green bg
  static const Color accentWarning = Color(0xFFFEF3C7);  // Light amber bg
  static const Color accentNeutral = Color(0xFFF3F4F6);  // Light grey bg
  
  // ==================== SPACING ====================
  
  static const double spacingXS = 4.0;
  static const double spacingSM = 8.0;
  static const double spacingMD = 16.0;
  static const double spacingLG = 24.0;
  static const double spacingXL = 32.0;
  
  static const double screenPadding = 20.0;
  static const double cardPadding = 16.0;
  static const double cardPaddingLarge = 20.0;
  
  // ==================== RADIUS ====================
  
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  
  // ==================== SHADOWS ====================
  
  /// Very light shadow - Professional subtlety
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.04),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];
  
  static List<BoxShadow> get elevatedShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.06),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
  
  // ==================== TYPOGRAPHY ====================
  
  /// Heavier font weights for authority
  static const TextStyle headingLarge = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    letterSpacing: -0.5,
    height: 1.2,
  );
  
  static const TextStyle headingMedium = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    letterSpacing: -0.3,
  );
  
  static const TextStyle headingSmall = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );
  
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    color: textPrimary,
  );
  
  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: textSecondary,
  );
  
  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: textMuted,
  );
  
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: textSecondary,
    letterSpacing: 0.3,
  );
  
  /// KPI Number Style
  static const TextStyle kpiNumber = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    letterSpacing: -1,
  );
  
  static const TextStyle kpiLabel = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: textSecondary,
    letterSpacing: 0.2,
  );
}

// ==================== ANIMATION CONSTANTS ====================

/// Admin Animation Rules:
/// - One animation per interaction
/// - No looping animations
/// - No decorative motion
/// - Data must appear instantly
class AdminAnimations {
  AdminAnimations._();
  
  /// Standard durations
  static const Duration fadeDuration = Duration(milliseconds: 180);
  static const Duration slideDuration = Duration(milliseconds: 220);
  static const Duration buttonTapDuration = Duration(milliseconds: 100);
  static const Duration statusChangeDuration = Duration(milliseconds: 120);
  
  /// Stagger delay for cards
  static const Duration staggerDelay = Duration(milliseconds: 40);
  
  /// Slide offsets
  static const double slideOffset = 10.0;
  
  /// Curves - Smooth, not bouncy
  static const Curve defaultCurve = Curves.easeOutCubic;
  static const Curve subtleCurve = Curves.easeOut;
}
