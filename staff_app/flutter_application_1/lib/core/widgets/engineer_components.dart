import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/service_engineer_theme.dart';
import '../utils/animations.dart';

// ═════════════════════════════════════════════════════════════════════════════
// SERVICE ENGINEER UI COMPONENTS
// Professional, field-ready widgets with subtle animations
// ═════════════════════════════════════════════════════════════════════════════

/// Status chip with color transition animation
/// 
/// Use for: Job status indicators, priority badges
class EngineerStatusChip extends StatelessWidget {
  final String status;
  final bool showIcon;
  final double fontSize;

  const EngineerStatusChip({
    super.key,
    required this.status,
    this.showIcon = true,
    this.fontSize = 12,
  });

  @override
  Widget build(BuildContext context) {
    final color = ServiceEngineerTheme.getStatusColor(status);
    final lightColor = ServiceEngineerTheme.getStatusLightColor(status);
    final icon = ServiceEngineerTheme.getStatusIcon(status);
    final displayText = status.toUpperCase().replaceAll('_', ' ');

    return AnimatedContainer(
      duration: AnimationConstants.fast,
      curve: AnimationConstants.defaultCurve,
      padding: EdgeInsets.symmetric(
        horizontal: showIcon ? 10 : 12,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: lightColor,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusSmall),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Icon(icon, size: fontSize + 2, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            displayText,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: fontSize,
            ),
          ),
        ],
      ),
    );
  }
}

/// Priority badge with appropriate color
class EngineerPriorityBadge extends StatelessWidget {
  final String priority;

  const EngineerPriorityBadge({super.key, required this.priority});

  @override
  Widget build(BuildContext context) {
    final color = ServiceEngineerTheme.getPriorityColor(priority);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '${priority.toUpperCase()} PRIORITY',
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 10,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

/// SLA indicator with visual urgency
class EngineerSlaIndicator extends StatelessWidget {
  final String remainingText;
  final bool isBreached;
  final bool isWarning;
  final bool compact;

  const EngineerSlaIndicator({
    super.key,
    required this.remainingText,
    this.isBreached = false,
    this.isWarning = false,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = ServiceEngineerTheme.getSlaColor(
      isBreached: isBreached,
      isWarning: isWarning,
    );

    return AnimatedContainer(
      duration: AnimationConstants.fast,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusSmall),
        border: Border.all(color: color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isBreached ? Icons.error : Icons.timer,
            size: compact ? 14 : 16,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            remainingText,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: compact ? 11 : 13,
            ),
          ),
        ],
      ),
    );
  }
}

/// Animated stat card for dashboard
/// 
/// Use for: Dashboard metrics (pending, completed, etc.)
class EngineerStatCard extends StatefulWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  final bool highlighted;
  final String? subtitle;

  const EngineerStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
    this.highlighted = false,
    this.subtitle,
  });

  @override
  State<EngineerStatCard> createState() => _EngineerStatCardState();
}

class _EngineerStatCardState extends State<EngineerStatCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: widget.onTap != null ? (_) => setState(() => _isPressed = false) : null,
      onTapCancel: widget.onTap != null ? () => setState(() => _isPressed = false) : null,
      onTap: () {
        if (widget.onTap != null) {
          HapticFeedback.lightImpact();
          widget.onTap!();
        }
      },
      child: AnimatedContainer(
        duration: AnimationConstants.instant,
        curve: AnimationConstants.defaultCurve,
        transform: Matrix4.identity()..scale(_isPressed ? 0.97 : 1.0),
        decoration: BoxDecoration(
          color: widget.highlighted 
              ? widget.color.withOpacity(0.1) 
              : ServiceEngineerTheme.surface,
          borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
          border: Border.all(
            color: widget.highlighted 
                ? widget.color.withOpacity(0.3) 
                : ServiceEngineerTheme.border,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(_isPressed ? 0.02 : 0.04),
              blurRadius: _isPressed ? 4 : 8,
              offset: Offset(0, _isPressed ? 1 : 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(widget.icon, color: widget.color, size: 26),
                  const SizedBox(width: 8),
                  // Animated number
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: double.tryParse(widget.value) ?? 0),
                    duration: AnimationConstants.slow,
                    curve: AnimationConstants.enterCurve,
                    builder: (context, value, _) {
                      return Text(
                        value.toInt().toString(),
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: widget.color,
                        ),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                widget.title,
                style: ServiceEngineerTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              if (widget.subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  widget.subtitle!,
                  style: ServiceEngineerTheme.caption.copyWith(
                    color: widget.color,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Large action button for primary actions
/// 
/// Use for: Check-in, Check-out, Complete Job
class EngineerActionButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool isLoading;
  final bool isDestructive;
  final String? disabledReason;

  const EngineerActionButton({
    super.key,
    required this.label,
    required this.icon,
    this.onPressed,
    this.backgroundColor,
    this.foregroundColor,
    this.isLoading = false,
    this.isDestructive = false,
    this.disabledReason,
  });

  @override
  State<EngineerActionButton> createState() => _EngineerActionButtonState();
}

class _EngineerActionButtonState extends State<EngineerActionButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDisabled = widget.onPressed == null || widget.isLoading;
    final bgColor = widget.isDestructive 
        ? ServiceEngineerTheme.statusError
        : widget.backgroundColor ?? ServiceEngineerTheme.primary;
    final fgColor = widget.foregroundColor ?? Colors.white;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTapDown: !isDisabled ? (_) => setState(() => _isPressed = true) : null,
          onTapUp: !isDisabled ? (_) => setState(() => _isPressed = false) : null,
          onTapCancel: () => setState(() => _isPressed = false),
          onTap: () {
            if (!isDisabled) {
              HapticFeedback.mediumImpact();
              widget.onPressed!();
            }
          },
          child: AnimatedContainer(
            duration: AnimationConstants.instant,
            curve: AnimationConstants.defaultCurve,
            transform: Matrix4.identity()..scale(_isPressed ? 0.98 : 1.0),
            height: ServiceEngineerTheme.touchTargetXL,
            decoration: BoxDecoration(
              color: isDisabled ? bgColor.withOpacity(0.5) : bgColor,
              borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
              boxShadow: isDisabled ? null : [
                BoxShadow(
                  color: bgColor.withOpacity(_isPressed ? 0.2 : 0.3),
                  blurRadius: _isPressed ? 4 : 12,
                  offset: Offset(0, _isPressed ? 2 : 4),
                ),
              ],
            ),
            child: Center(
              child: AnimatedSwitcher(
                duration: AnimationConstants.fast,
                child: widget.isLoading
                    ? SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: fgColor,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(widget.icon, color: fgColor, size: 22),
                          const SizedBox(width: 10),
                          Text(
                            widget.label,
                            style: TextStyle(
                              color: fgColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
        // Disabled reason text
        if (widget.disabledReason != null && isDisabled) ...[
          const SizedBox(height: 8),
          Text(
            widget.disabledReason!,
            style: ServiceEngineerTheme.caption.copyWith(
              color: ServiceEngineerTheme.textMuted,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}

/// Success confirmation widget with animation
/// 
/// Use for: Check-in success, Job completion
class EngineerSuccessConfirmation extends StatelessWidget {
  final String title;
  final String message;
  final String? timestamp;
  final String? additionalInfo;
  final VoidCallback? onContinue;
  final String continueLabel;

  const EngineerSuccessConfirmation({
    super.key,
    required this.title,
    required this.message,
    this.timestamp,
    this.additionalInfo,
    this.onContinue,
    this.continueLabel = 'Continue',
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Animated checkmark
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: AnimationConstants.slow,
          curve: AnimationConstants.enterCurve,
          builder: (context, value, child) {
            return Transform.scale(
              scale: 0.5 + (value * 0.5),
              child: Opacity(
                opacity: value,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: ServiceEngineerTheme.statusCompletedLight,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.check_circle,
                    size: 60,
                    color: ServiceEngineerTheme.statusCompleted,
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 24),
        // Title
        FadeIn(
          delay: const Duration(milliseconds: 150),
          child: Text(
            title,
            style: ServiceEngineerTheme.headlineMedium.copyWith(
              color: ServiceEngineerTheme.statusCompleted,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 8),
        // Message
        FadeIn(
          delay: const Duration(milliseconds: 200),
          child: Text(
            message,
            style: ServiceEngineerTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
        ),
        // Timestamp
        if (timestamp != null) ...[
          const SizedBox(height: 16),
          FadeIn(
            delay: const Duration(milliseconds: 250),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: ServiceEngineerTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusSmall),
                border: Border.all(color: ServiceEngineerTheme.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: ServiceEngineerTheme.textMuted,
                  ),
                  const SizedBox(width: 6),
                  Text(timestamp!, style: ServiceEngineerTheme.bodyMedium),
                ],
              ),
            ),
          ),
        ],
        // Additional info
        if (additionalInfo != null) ...[
          const SizedBox(height: 12),
          FadeIn(
            delay: const Duration(milliseconds: 300),
            child: Text(
              additionalInfo!,
              style: ServiceEngineerTheme.caption,
              textAlign: TextAlign.center,
            ),
          ),
        ],
        // Continue button
        if (onContinue != null) ...[
          const SizedBox(height: 32),
          FadeIn(
            delay: const Duration(milliseconds: 350),
            child: EngineerActionButton(
              label: continueLabel,
              icon: Icons.arrow_forward,
              onPressed: onContinue,
            ),
          ),
        ],
      ],
    );
  }
}

/// Job card for lists
/// 
/// Use for: Jobs list screen
class EngineerJobCard extends StatefulWidget {
  final String ticketNumber;
  final String customerName;
  final String description;
  final String status;
  final String priority;
  final String? slaText;
  final bool isSlaBreached;
  final bool isSlaWarning;
  final VoidCallback? onTap;
  final int animationIndex;

  const EngineerJobCard({
    super.key,
    required this.ticketNumber,
    required this.customerName,
    required this.description,
    required this.status,
    required this.priority,
    this.slaText,
    this.isSlaBreached = false,
    this.isSlaWarning = false,
    this.onTap,
    this.animationIndex = 0,
  });

  @override
  State<EngineerJobCard> createState() => _EngineerJobCardState();
}

class _EngineerJobCardState extends State<EngineerJobCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final statusColor = ServiceEngineerTheme.getStatusColor(widget.status);

    return StaggeredFadeIn(
      index: widget.animationIndex,
      child: GestureDetector(
        onTapDown: widget.onTap != null ? (_) => setState(() => _isPressed = true) : null,
        onTapUp: widget.onTap != null ? (_) => setState(() => _isPressed = false) : null,
        onTapCancel: () => setState(() => _isPressed = false),
        onTap: () {
          if (widget.onTap != null) {
            HapticFeedback.selectionClick();
            widget.onTap!();
          }
        },
        child: AnimatedContainer(
          duration: AnimationConstants.instant,
          transform: Matrix4.identity()..scale(_isPressed ? 0.98 : 1.0),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: ServiceEngineerTheme.surface,
            borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
            border: Border.all(color: ServiceEngineerTheme.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(_isPressed ? 0.02 : 0.05),
                blurRadius: _isPressed ? 2 : 8,
                offset: Offset(0, _isPressed ? 1 : 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  children: [
                    // Status icon
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusSmall),
                      ),
                      child: Icon(
                        ServiceEngineerTheme.getStatusIcon(widget.status),
                        color: statusColor,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Ticket and customer
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.ticketNumber,
                            style: ServiceEngineerTheme.caption,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            widget.customerName,
                            style: ServiceEngineerTheme.titleMedium,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    // SLA indicator
                    if (widget.slaText != null && widget.status.toUpperCase() != 'COMPLETED')
                      EngineerSlaIndicator(
                        remainingText: widget.slaText!,
                        isBreached: widget.isSlaBreached,
                        isWarning: widget.isSlaWarning,
                        compact: true,
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                // Description
                Text(
                  widget.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: ServiceEngineerTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                // Footer: Status + Priority
                Row(
                  children: [
                    EngineerStatusChip(status: widget.status, fontSize: 11),
                    const SizedBox(width: 8),
                    EngineerPriorityBadge(priority: widget.priority),
                    const Spacer(),
                    Icon(
                      Icons.chevron_right,
                      color: ServiceEngineerTheme.textMuted,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Information row with icon
class EngineerInfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? iconColor;

  const EngineerInfoRow({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 18,
            color: iconColor ?? ServiceEngineerTheme.textMuted,
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: ServiceEngineerTheme.caption,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: ServiceEngineerTheme.bodyLarge.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Section card with header
class EngineerSectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color? iconColor;
  final Widget child;
  final Widget? trailing;
  final bool isRequired;

  const EngineerSectionCard({
    super.key,
    required this.title,
    required this.icon,
    this.iconColor,
    required this.child,
    this.trailing,
    this.isRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ServiceEngineerTheme.surface,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
        border: Border.all(color: ServiceEngineerTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
            child: Row(
              children: [
                Icon(icon, color: iconColor ?? ServiceEngineerTheme.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Row(
                    children: [
                      Text(title, style: ServiceEngineerTheme.titleMedium),
                      if (isRequired) ...[
                        const SizedBox(width: 4),
                        Text('*', style: TextStyle(color: ServiceEngineerTheme.statusError, fontWeight: FontWeight.bold)),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
          Divider(height: 1, color: ServiceEngineerTheme.divider),
          // Content
          Padding(
            padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
            child: child,
          ),
        ],
      ),
    );
  }
}

/// Offline banner
class EngineerOfflineBanner extends StatelessWidget {
  final String? message;

  const EngineerOfflineBanner({
    super.key,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: ServiceEngineerTheme.statusWarningLight,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.wifi_off,
            size: 18,
            color: ServiceEngineerTheme.statusWarning,
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              message ?? 'You are offline. Changes will sync when connected.',
              style: TextStyle(
                color: ServiceEngineerTheme.statusWarning,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Empty state widget
class EngineerEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const EngineerEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: ServiceEngineerTheme.surfaceElevated,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 40,
                color: ServiceEngineerTheme.textMuted,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: ServiceEngineerTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: ServiceEngineerTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 24),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Loading state with skeleton
class EngineerLoadingSkeleton extends StatefulWidget {
  final int itemCount;
  
  const EngineerLoadingSkeleton({super.key, this.itemCount = 3});

  @override
  State<EngineerLoadingSkeleton> createState() => _EngineerLoadingSkeletonState();
}

class _EngineerLoadingSkeletonState extends State<EngineerLoadingSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(ServiceEngineerTheme.screenPadding),
      itemCount: widget.itemCount,
      itemBuilder: (context, index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
              decoration: BoxDecoration(
                color: ServiceEngineerTheme.surface,
                borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
                border: Border.all(color: ServiceEngineerTheme.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _shimmerBox(44, 44, borderRadius: 8),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _shimmerBox(80, 12),
                            const SizedBox(height: 6),
                            _shimmerBox(150, 16),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _shimmerBox(double.infinity, 14),
                  const SizedBox(height: 6),
                  _shimmerBox(200, 14),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _shimmerBox(80, 24, borderRadius: 8),
                      const SizedBox(width: 8),
                      _shimmerBox(100, 24, borderRadius: 6),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _shimmerBox(double width, double height, {double borderRadius = 4}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        gradient: LinearGradient(
          begin: Alignment(-1.0 + (_controller.value * 2), 0),
          end: Alignment(_controller.value * 2, 0),
          colors: [
            ServiceEngineerTheme.divider,
            ServiceEngineerTheme.surfaceElevated,
            ServiceEngineerTheme.divider,
          ],
        ),
      ),
    );
  }
}

/// Location status indicator
class EngineerLocationStatus extends StatelessWidget {
  final bool isCapturing;
  final bool hasLocation;
  final bool hasError;
  final String? errorMessage;
  final double? latitude;
  final double? longitude;
  final VoidCallback? onRetry;

  const EngineerLocationStatus({
    super.key,
    this.isCapturing = false,
    this.hasLocation = false,
    this.hasError = false,
    this.errorMessage,
    this.latitude,
    this.longitude,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color iconColor;
    IconData icon;
    String title;
    String? subtitle;

    if (isCapturing) {
      bgColor = ServiceEngineerTheme.statusPendingLight;
      iconColor = ServiceEngineerTheme.statusPending;
      icon = Icons.my_location;
      title = 'Capturing location...';
      subtitle = 'Please wait';
    } else if (hasError) {
      bgColor = ServiceEngineerTheme.statusErrorLight;
      iconColor = ServiceEngineerTheme.statusError;
      icon = Icons.location_off;
      title = 'Location Error';
      subtitle = errorMessage;
    } else if (hasLocation) {
      bgColor = ServiceEngineerTheme.statusCompletedLight;
      iconColor = ServiceEngineerTheme.statusCompleted;
      icon = Icons.location_on;
      title = 'Location Captured';
      subtitle = latitude != null && longitude != null
          ? '${latitude!.toStringAsFixed(6)}, ${longitude!.toStringAsFixed(6)}'
          : 'GPS coordinates verified';
    } else {
      bgColor = ServiceEngineerTheme.surfaceElevated;
      iconColor = ServiceEngineerTheme.textMuted;
      icon = Icons.location_searching;
      title = 'Waiting for location';
      subtitle = null;
    }

    return AnimatedContainer(
      duration: AnimationConstants.normal,
      curve: AnimationConstants.defaultCurve,
      padding: const EdgeInsets.all(ServiceEngineerTheme.cardPadding),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(ServiceEngineerTheme.radiusMedium),
        border: Border.all(color: iconColor.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              if (isCapturing)
                SizedBox(
                  width: 40,
                  height: 40,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    color: iconColor,
                  ),
                )
              else
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: iconColor, size: 22),
                ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: ServiceEngineerTheme.titleMedium.copyWith(
                        color: iconColor,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: ServiceEngineerTheme.caption,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              if (hasLocation)
                Icon(
                  Icons.check_circle,
                  color: iconColor,
                  size: 24,
                ),
            ],
          ),
          if (hasError && onRetry != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: iconColor,
                  side: BorderSide(color: iconColor),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
