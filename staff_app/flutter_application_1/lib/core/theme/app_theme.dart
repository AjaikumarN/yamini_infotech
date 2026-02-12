import 'package:flutter/material.dart';

/// App Theme Configuration
///
/// Enterprise-grade design system with:
/// - Consistent typography scale
/// - Status color system
/// - Spacing standards
/// - Component theming
///
/// Follows "Soft Motion UI" design principles
class AppTheme {
  // ============================================================
  // PRIMARY COLORS
  // ============================================================
  static const Color primaryColor = Color(0xFF009688); // Teal
  static const Color primaryLight = Color(0xFF4DB6AC);
  static const Color primaryDark = Color(0xFF00796B);
  static const Color primaryBg = Color(0xFFE0F2F1); // Teal 50

  // ============================================================
  // STATUS COLORS - Strict Usage Rules
  // ============================================================
  // GREEN (success): PAID, APPROVED, COMPLETED, ACTIVE
  static const Color success = Color(0xFF059669); // Emerald 600
  static const Color successLight = Color(0xFFD1FAE5); // Emerald 100

  // AMBER (warning): PENDING, IN_PROGRESS, ASSIGNED
  static const Color warning = Color(0xFFD97706); // Amber 600
  static const Color warningLight = Color(0xFFFEF3C7); // Amber 100

  // RED (danger): FAILED, REJECTED, OVERDUE, CANCELLED
  static const Color error = Color(0xFFDC2626); // Red 600
  static const Color errorLight = Color(0xFFFEE2E2); // Red 100

  // BLUE (info): NEW, ASSIGNED, INFO
  static const Color info = Color(0xFF2563EB); // Blue 600
  static const Color infoLight = Color(0xFFDBEAFE); // Blue 100

  // ============================================================
  // NEUTRAL COLORS
  // ============================================================
  static const Color background = Color(0xFFF9FAFB); // Gray 50
  static const Color surface = Colors.white;
  static const Color textPrimary = Color(0xFF111827); // Gray 900
  static const Color textSecondary = Color(0xFF6B7280); // Gray 500
  static const Color textMuted = Color(0xFF9CA3AF); // Gray 400
  static const Color divider = Color(0xFFE5E7EB); // Gray 200
  static const Color borderLight = Color(0xFFF3F4F6); // Gray 100

  // ============================================================
  // SPACING SYSTEM
  // ============================================================
  static const double spaceXs = 4;
  static const double spaceSm = 8;
  static const double spaceMd = 12;
  static const double spaceLg = 16;
  static const double spaceXl = 24;
  static const double space2xl = 32;
  static const double space3xl = 48;

  // ============================================================
  // BORDER RADIUS
  // ============================================================
  static const double radiusSm = 6;
  static const double radiusMd = 8;
  static const double radiusLg = 12;
  static const double radiusXl = 16;
  static const double radiusFull = 9999;

  // ============================================================
  // TYPOGRAPHY - Text Styles
  // ============================================================
  static const TextStyle pageTitle = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    height: 1.25,
  );

  static const TextStyle sectionTitle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    height: 1.25,
  );

  static const TextStyle cardTitle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );

  static const TextStyle bodyText = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: textPrimary,
    height: 1.5,
  );

  static const TextStyle bodyTextSm = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: textPrimary,
  );

  static const TextStyle helperText = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: textSecondary,
  );

  static const TextStyle badgeText = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
  );

  static const TextStyle kpiValue = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    height: 1,
  );

  static const TextStyle kpiLabel = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: textSecondary,
  );

  /// Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
      ),

      // App Bar
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        titleTextStyle: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),

      // Cards - subtle shadow
      cardTheme: CardThemeData(
        elevation: 1,
        shadowColor: Colors.black.withOpacity(0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: EdgeInsets.zero,
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 1,
          shadowColor: Colors.black.withOpacity(0.1),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.grey.shade50,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: error),
        ),
      ),

      // List Tile
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),

      // Chip Theme
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),

      // Floating Action Button
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        elevation: 2,
        shape: CircleBorder(),
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentTextStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 4,
      ),

      // Bottom Sheet
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(thickness: 1, space: 1),

      // Page Transitions - subtle fade+slide
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: FadeUpwardsPageTransitionsBuilder(),
        },
      ),
    );
  }
}

/// Status color helper
extension StatusColors on BuildContext {
  Color get successColor => AppTheme.success;
  Color get warningColor => AppTheme.warning;
  Color get errorColor => AppTheme.error;
  Color get infoColor => AppTheme.info;
}

// ============================================================
// STATUS BADGE WIDGET
// ============================================================
/// Enterprise-grade status badge with consistent styling
///
/// Usage: StatusBadge(status: 'PAID') or StatusBadge.success('Approved')
class StatusBadge extends StatelessWidget {
  final String text;
  final Color backgroundColor;
  final Color textColor;

  const StatusBadge({
    super.key,
    required this.text,
    required this.backgroundColor,
    required this.textColor,
  });

  /// Factory constructors for status types
  factory StatusBadge.success(String text) => StatusBadge(
    text: text,
    backgroundColor: AppTheme.successLight,
    textColor: AppTheme.success,
  );

  factory StatusBadge.warning(String text) => StatusBadge(
    text: text,
    backgroundColor: AppTheme.warningLight,
    textColor: AppTheme.warning,
  );

  factory StatusBadge.danger(String text) => StatusBadge(
    text: text,
    backgroundColor: AppTheme.errorLight,
    textColor: AppTheme.error,
  );

  factory StatusBadge.info(String text) => StatusBadge(
    text: text,
    backgroundColor: AppTheme.infoLight,
    textColor: AppTheme.info,
  );

  factory StatusBadge.neutral(String text) => StatusBadge(
    text: text,
    backgroundColor: AppTheme.borderLight,
    textColor: AppTheme.textSecondary,
  );

  /// Auto-detect status type from common status strings
  factory StatusBadge.fromStatus(String status) {
    final upper = status.toUpperCase();

    // Success statuses
    if ([
      'PAID',
      'APPROVED',
      'COMPLETED',
      'ACTIVE',
      'SUCCESS',
      'DONE',
    ].contains(upper)) {
      return StatusBadge.success(status);
    }

    // Warning statuses
    if ([
      'PENDING',
      'IN_PROGRESS',
      'IN PROGRESS',
      'ASSIGNED',
      'PROCESSING',
      'WAITING',
    ].contains(upper)) {
      return StatusBadge.warning(status);
    }

    // Danger statuses
    if ([
      'FAILED',
      'REJECTED',
      'OVERDUE',
      'CANCELLED',
      'ERROR',
      'EXPIRED',
      'CLOSED',
    ].contains(upper)) {
      return StatusBadge.danger(status);
    }

    // Info statuses
    if (['NEW', 'OPEN', 'INFO', 'SCHEDULED'].contains(upper)) {
      return StatusBadge.info(status);
    }

    // Default to neutral
    return StatusBadge.neutral(status);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusFull),
      ),
      child: Text(
        text.toUpperCase(),
        style: AppTheme.badgeText.copyWith(color: textColor),
      ),
    );
  }
}

// ============================================================
// KPI CARD WIDGET
// ============================================================
/// Enterprise KPI display card
class KpiCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color? iconColor;
  final Color? iconBgColor;
  final String? trend;
  final bool trendUp;

  const KpiCard({
    super.key,
    required this.value,
    required this.label,
    required this.icon,
    this.iconColor,
    this.iconBgColor,
    this.trend,
    this.trendUp = true,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor = iconColor ?? AppTheme.primaryColor;
    final effectiveIconBg = iconBgColor ?? AppTheme.primaryBg;

    return Container(
      padding: const EdgeInsets.all(AppTheme.spaceLg),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: effectiveIconBg,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                ),
                child: Icon(icon, color: effectiveIconColor, size: 22),
              ),
              if (trend != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: trendUp
                        ? AppTheme.successLight
                        : AppTheme.errorLight,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                  ),
                  child: Text(
                    trend!,
                    style: AppTheme.helperText.copyWith(
                      color: trendUp ? AppTheme.success : AppTheme.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppTheme.spaceMd),
          Text(value, style: AppTheme.kpiValue),
          const SizedBox(height: AppTheme.spaceXs),
          Text(label, style: AppTheme.kpiLabel),
        ],
      ),
    );
  }
}

// ============================================================
// EMPTY STATE WIDGET
// ============================================================
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  const EmptyState({
    super.key,
    this.icon = Icons.inbox_outlined,
    required this.title,
    required this.message,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.space2xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: AppTheme.textMuted),
            const SizedBox(height: AppTheme.spaceLg),
            Text(title, style: AppTheme.cardTitle, textAlign: TextAlign.center),
            const SizedBox(height: AppTheme.spaceSm),
            Text(
              message,
              style: AppTheme.helperText,
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[
              const SizedBox(height: AppTheme.spaceXl),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

// ============================================================
// LOADING STATE WIDGET
// ============================================================
class LoadingState extends StatelessWidget {
  final String? message;

  const LoadingState({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.space2xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppTheme.primaryColor,
                ),
              ),
            ),
            if (message != null) ...[
              const SizedBox(height: AppTheme.spaceLg),
              Text(message!, style: AppTheme.helperText),
            ],
          ],
        ),
      ),
    );
  }
}

// ============================================================
// ERROR STATE WIDGET
// ============================================================
class ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorState({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spaceXl),
        child: Container(
          padding: const EdgeInsets.all(AppTheme.spaceLg),
          decoration: BoxDecoration(
            color: AppTheme.errorLight,
            border: Border.all(color: AppTheme.error),
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppTheme.error, size: 32),
              const SizedBox(height: AppTheme.spaceMd),
              Text(
                message,
                style: AppTheme.bodyText.copyWith(color: AppTheme.error),
                textAlign: TextAlign.center,
              ),
              if (onRetry != null) ...[
                const SizedBox(height: AppTheme.spaceLg),
                TextButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                  style: TextButton.styleFrom(foregroundColor: AppTheme.error),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
