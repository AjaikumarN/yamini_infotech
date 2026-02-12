import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/constants/reception_animation_constants.dart';

/// Reception UI Components
///
/// RECEPTION UI IDEOLOGY:
/// - Fast data entry, continuous task switching
/// - Light, Fast, Clear, Unobtrusive
/// - Feel like a well-organized front desk
///
/// Animation Rules:
/// - 150-220ms durations only
/// - Ease-out curves only
/// - Max 8px movement
/// - No bouncy/flashy/looping animations
/// - Zero animation during typing/scrolling

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CHIP - Color transition only (120ms)
// ═══════════════════════════════════════════════════════════════════════════════

/// Animated status chip with smooth color transition
/// Duration: 120ms, no size change, just color
class ReceptionStatusChip extends StatelessWidget {
  final String status;
  final bool compact;
  final bool muted;

  const ReceptionStatusChip({
    super.key,
    required this.status,
    this.compact = false,
    this.muted = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = ReceptionAnimationConstants.getStatusColor(status);
    final displayText = _formatStatus(status);
    final opacity = muted ? ReceptionAnimationConstants.closedItemOpacity : 1.0;

    return AnimatedContainer(
      duration: ReceptionAnimationConstants.chipTransition,
      curve: ReceptionAnimationConstants.defaultCurve,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 12,
        vertical: compact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(muted ? 0.08 : 0.12),
        borderRadius: BorderRadius.circular(
          ReceptionAnimationConstants.radiusSm,
        ),
        border: Border.all(color: color.withOpacity(muted ? 0.15 : 0.25)),
      ),
      child: Opacity(
        opacity: opacity,
        child: Text(
          displayText,
          style: TextStyle(
            color: color,
            fontSize: compact ? 10 : 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.4,
          ),
        ),
      ),
    );
  }

  String _formatStatus(String status) {
    return status.toUpperCase().replaceAll('_', ' ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST TYPE TAG - Visual scan helper (Sales=Blue, Service=Purple)
// ═══════════════════════════════════════════════════════════════════════════════

/// Request type indicator tag for quick visual scanning
class ReceptionTypeTag extends StatelessWidget {
  final String type;
  final bool compact;

  const ReceptionTypeTag({super.key, required this.type, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final isSales =
        type.toUpperCase() == 'SALES' || type.toUpperCase() == 'ENQUIRY';
    final color = isSales
        ? ReceptionAnimationConstants.typeSales
        : ReceptionAnimationConstants.typeService;
    final label = isSales ? 'SALES' : 'SERVICE';
    final icon = isSales ? Icons.storefront_outlined : Icons.build_outlined;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 8,
        vertical: compact ? 3 : 4,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: compact ? 10 : 12, color: color),
          SizedBox(width: compact ? 3 : 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: compact ? 9 : 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD KPI CARD - Slide up 8px + fade, staggered (180-200ms)
// ═══════════════════════════════════════════════════════════════════════════════

/// Dashboard KPI card with subtle entry animation
/// - Slides up 8px + fades in
/// - Duration: 180-200ms with 40ms stagger
/// - Status-aware accent color
class ReceptionDashboardCard extends StatefulWidget {
  final String title;
  final int value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  final int staggerIndex;
  final bool hasWarning; // Show warning accent when value > 0

  const ReceptionDashboardCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
    this.staggerIndex = 0,
    this.hasWarning = false,
  });

  @override
  State<ReceptionDashboardCard> createState() => _ReceptionDashboardCardState();
}

class _ReceptionDashboardCardState extends State<ReceptionDashboardCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  int _displayedValue = 0;

  @override
  void initState() {
    super.initState();
    _displayedValue = widget.value;

    _controller = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.slide,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: ReceptionAnimationConstants.entryCurve,
      ),
    );

    _slideAnimation =
        Tween<Offset>(
          begin: const Offset(0, 0.08), // ~8px
          end: Offset.zero,
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: ReceptionAnimationConstants.entryCurve,
          ),
        );

    // Staggered start
    Future.delayed(
      ReceptionAnimationConstants.getStaggerDelay(widget.staggerIndex),
      () {
        if (mounted) _controller.forward();
      },
    );
  }

  @override
  void didUpdateWidget(ReceptionDashboardCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Cross-fade value change (no counting animation)
    if (oldWidget.value != widget.value) {
      setState(() => _displayedValue = widget.value);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Status-aware accent: warning color when has warning and value > 0
    final showWarningAccent = widget.hasWarning && widget.value > 0;
    final accentColor = showWarningAccent
        ? ReceptionAnimationConstants.warning
        : widget.color;

    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: _ReceptionTappableCard(
          onTap: widget.onTap,
          child: Container(
            constraints: BoxConstraints(
              minHeight: ReceptionAnimationConstants.cardMinHeight,
            ),
            padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(
                ReceptionAnimationConstants.radiusMd,
              ),
              border: showWarningAccent
                  ? Border.all(color: accentColor.withOpacity(0.4), width: 1.5)
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Icon container
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(
                      ReceptionAnimationConstants.radiusSm,
                    ),
                  ),
                  child: Icon(widget.icon, color: accentColor, size: 20),
                ),
                SizedBox(height: ReceptionAnimationConstants.spacingMd),
                // Value - Cross-fades on change (no counting)
                AnimatedSwitcher(
                  duration: ReceptionAnimationConstants.fade,
                  switchInCurve: ReceptionAnimationConstants.defaultCurve,
                  child: Text(
                    '$_displayedValue',
                    key: ValueKey(_displayedValue),
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: accentColor,
                      height: 1.1,
                    ),
                  ),
                ),
                SizedBox(height: ReceptionAnimationConstants.spacingXs),
                // Title
                Text(
                  widget.title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[600],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAPPABLE CARD - Subtle press feedback (scale 0.985, 90ms)
// ═══════════════════════════════════════════════════════════════════════════════

/// Internal tappable card with scale + ripple feedback
class _ReceptionTappableCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;

  const _ReceptionTappableCard({required this.child, this.onTap});

  @override
  State<_ReceptionTappableCard> createState() => _ReceptionTappableCardState();
}

class _ReceptionTappableCardState extends State<_ReceptionTappableCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.buttonTap,
    );

    _scaleAnimation =
        Tween<double>(
          begin: 1.0,
          end: ReceptionAnimationConstants.cardPressScale,
        ).animate(
          CurvedAnimation(
            parent: _scaleController,
            curve: ReceptionAnimationConstants.defaultCurve,
          ),
        );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    if (widget.onTap != null) {
      HapticFeedback.selectionClick();
      _scaleController.forward();
    }
  }

  void _handleTapUp(TapUpDetails _) {
    _scaleController.reverse();
    widget.onTap?.call();
  }

  void _handleTapCancel() {
    _scaleController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? _handleTapDown : null,
      onTapUp: widget.onTap != null ? _handleTapUp : null,
      onTapCancel: widget.onTap != null ? _handleTapCancel : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          decoration: BoxDecoration(
            color: ReceptionAnimationConstants.cardBg,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
            child: widget.child,
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST LIST ITEM - Large touch target, flat card (170ms entry)
// ═══════════════════════════════════════════════════════════════════════════════

/// Request list item with large touch target (72px min height)
/// - Fade + slight slide (170ms)
/// - No animation during scroll
class ReceptionRequestListItem extends StatefulWidget {
  final String customerName;
  final String requestType;
  final String status;
  final String? subtitle;
  final String? assignedTo;
  final VoidCallback? onTap;
  final int staggerIndex;
  final bool animateEntry;
  final bool isMuted; // For closed items

  const ReceptionRequestListItem({
    super.key,
    required this.customerName,
    required this.requestType,
    required this.status,
    this.subtitle,
    this.assignedTo,
    this.onTap,
    this.staggerIndex = 0,
    this.animateEntry = true,
    this.isMuted = false,
  });

  @override
  State<ReceptionRequestListItem> createState() =>
      _ReceptionRequestListItemState();
}

class _ReceptionRequestListItemState extends State<ReceptionRequestListItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.listEntry,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: ReceptionAnimationConstants.defaultCurve,
      ),
    );

    _slideAnimation =
        Tween<Offset>(
          begin: const Offset(0, 0.06), // ~6px
          end: Offset.zero,
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: ReceptionAnimationConstants.entryCurve,
          ),
        );

    if (widget.animateEntry) {
      Future.delayed(
        ReceptionAnimationConstants.getListStaggerDelay(widget.staggerIndex),
        () {
          if (mounted) _controller.forward();
        },
      );
    } else {
      _controller.value = 1.0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final typeColor = ReceptionAnimationConstants.getTypeColor(
      widget.requestType,
    );
    final opacity = widget.isMuted
        ? ReceptionAnimationConstants.closedItemOpacity
        : 1.0;

    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Opacity(
          opacity: opacity,
          child: Container(
            margin: EdgeInsets.only(
              bottom: ReceptionAnimationConstants.spacingSm,
            ),
            decoration: BoxDecoration(
              color: ReceptionAnimationConstants.cardBg,
              borderRadius: BorderRadius.circular(
                ReceptionAnimationConstants.radiusMd,
              ),
              border: Border.all(color: ReceptionAnimationConstants.border),
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(
                ReceptionAnimationConstants.radiusMd,
              ),
              child: InkWell(
                onTap: widget.onTap,
                borderRadius: BorderRadius.circular(
                  ReceptionAnimationConstants.radiusMd,
                ),
                child: Container(
                  constraints: BoxConstraints(
                    minHeight: ReceptionAnimationConstants.cardMinHeight,
                  ),
                  padding: EdgeInsets.all(
                    ReceptionAnimationConstants.spacingLg,
                  ),
                  child: Row(
                    children: [
                      // Type icon
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: typeColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(
                            ReceptionAnimationConstants.radiusSm,
                          ),
                        ),
                        child: Icon(_getTypeIcon(), color: typeColor, size: 22),
                      ),
                      SizedBox(width: ReceptionAnimationConstants.spacingMd),
                      // Content
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    widget.customerName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                SizedBox(
                                  width: ReceptionAnimationConstants.spacingSm,
                                ),
                                ReceptionStatusChip(
                                  status: widget.status,
                                  compact: true,
                                  muted: widget.isMuted,
                                ),
                              ],
                            ),
                            SizedBox(
                              height: ReceptionAnimationConstants.spacingXs,
                            ),
                            Row(
                              children: [
                                ReceptionTypeTag(
                                  type: widget.requestType,
                                  compact: true,
                                ),
                                if (widget.subtitle != null) ...[
                                  SizedBox(
                                    width:
                                        ReceptionAnimationConstants.spacingSm,
                                  ),
                                  Expanded(
                                    child: Text(
                                      widget.subtitle!,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[600],
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            if (widget.assignedTo != null) ...[
                              SizedBox(
                                height: ReceptionAnimationConstants.spacingXs,
                              ),
                              Row(
                                children: [
                                  Icon(
                                    Icons.person_outline,
                                    size: 12,
                                    color: Colors.grey[500],
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    widget.assignedTo!,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      // Chevron
                      Icon(
                        Icons.chevron_right,
                        color: Colors.grey[400],
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _getTypeIcon() {
    return widget.requestType.toUpperCase() == 'SERVICE'
        ? Icons.build_outlined
        : Icons.storefront_outlined;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBMIT BUTTON - Press feedback + inline loading (52px height)
// ═══════════════════════════════════════════════════════════════════════════════

/// Submit button with:
/// - Large touch target (52px height)
/// - Press scale (0.98, 90ms)
/// - Inline loading spinner
/// - Success checkmark transition
class ReceptionSubmitButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isSuccess;
  final bool isDisabled;
  final String? disabledReason;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? width;

  const ReceptionSubmitButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isSuccess = false,
    this.isDisabled = false,
    this.disabledReason,
    this.icon,
    this.backgroundColor,
    this.foregroundColor,
    this.width,
  });

  @override
  State<ReceptionSubmitButton> createState() => _ReceptionSubmitButtonState();
}

class _ReceptionSubmitButtonState extends State<ReceptionSubmitButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.buttonTap,
    );

    _scaleAnimation =
        Tween<double>(
          begin: 1.0,
          end: ReceptionAnimationConstants.buttonPressScale,
        ).animate(
          CurvedAnimation(
            parent: _scaleController,
            curve: ReceptionAnimationConstants.defaultCurve,
          ),
        );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    if (!widget.isLoading && !widget.isSuccess && !widget.isDisabled) {
      HapticFeedback.lightImpact();
      _scaleController.forward();
    }
  }

  void _handleTapUp(TapUpDetails _) {
    _scaleController.reverse();
  }

  void _handleTapCancel() {
    _scaleController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = widget.isSuccess
        ? ReceptionAnimationConstants.success
        : widget.backgroundColor ?? ReceptionAnimationConstants.primary;
    final fgColor = widget.foregroundColor ?? Colors.white;
    final isEnabled =
        !widget.isLoading &&
        !widget.isSuccess &&
        !widget.isDisabled &&
        widget.onPressed != null;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTapDown: _handleTapDown,
          onTapUp: _handleTapUp,
          onTapCancel: _handleTapCancel,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: SizedBox(
              width: widget.width,
              height: ReceptionAnimationConstants.buttonHeight,
              child: AnimatedContainer(
                duration: ReceptionAnimationConstants.fade,
                curve: ReceptionAnimationConstants.defaultCurve,
                decoration: BoxDecoration(
                  color: isEnabled ? bgColor : bgColor.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(
                    ReceptionAnimationConstants.radiusMd,
                  ),
                  boxShadow: isEnabled
                      ? [
                          BoxShadow(
                            color: bgColor.withOpacity(0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : null,
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: isEnabled ? widget.onPressed : null,
                    borderRadius: BorderRadius.circular(
                      ReceptionAnimationConstants.radiusMd,
                    ),
                    child: Center(
                      child: AnimatedSwitcher(
                        duration: ReceptionAnimationConstants.fade,
                        switchInCurve: ReceptionAnimationConstants.defaultCurve,
                        child: widget.isLoading
                            ? SizedBox(
                                key: const ValueKey('loading'),
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: fgColor,
                                ),
                              )
                            : widget.isSuccess
                            ? Row(
                                key: const ValueKey('success'),
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.check_rounded,
                                    size: 22,
                                    color: fgColor,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Done',
                                    style: TextStyle(
                                      color: fgColor,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              )
                            : Row(
                                key: const ValueKey('label'),
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (widget.icon != null) ...[
                                    Icon(widget.icon, size: 20, color: fgColor),
                                    const SizedBox(width: 8),
                                  ],
                                  Text(
                                    widget.label,
                                    style: TextStyle(
                                      color: fgColor,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        // Disabled reason explanation
        if (widget.isDisabled && widget.disabledReason != null)
          Padding(
            padding: EdgeInsets.only(
              top: ReceptionAnimationConstants.spacingSm,
            ),
            child: Text(
              widget.disabledReason!,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),
          ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM LOADING OVERLAY - Opacity fade during submission
// ═══════════════════════════════════════════════════════════════════════════════

/// Wraps form content and fades to 0.65 opacity during loading
class ReceptionFormLoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;

  const ReceptionFormLoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      duration: ReceptionAnimationConstants.fade,
      curve: ReceptionAnimationConstants.defaultCurve,
      opacity: isLoading ? ReceptionAnimationConstants.formLoadingOpacity : 1.0,
      child: AbsorbPointer(absorbing: isLoading, child: child),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER CROSS-FADE - List cross-fade on filter change (160ms)
// ═══════════════════════════════════════════════════════════════════════════════

/// Wraps list content for cross-fade on filter change
class ReceptionFilterCrossFade extends StatelessWidget {
  final Object filterKey;
  final Widget child;

  const ReceptionFilterCrossFade({
    super.key,
    required this.filterKey,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: ReceptionAnimationConstants.fade,
      switchInCurve: ReceptionAnimationConstants.defaultCurve,
      switchOutCurve: ReceptionAnimationConstants.exitCurve,
      child: KeyedSubtree(key: ValueKey(filterKey), child: child),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGNMENT SUCCESS HIGHLIGHT - Green flash (100ms)
// ═══════════════════════════════════════════════════════════════════════════════

/// Green highlight flash for assignment success
class ReceptionAssignmentHighlight extends StatefulWidget {
  final bool show;
  final Widget child;

  const ReceptionAssignmentHighlight({
    super.key,
    required this.show,
    required this.child,
  });

  @override
  State<ReceptionAssignmentHighlight> createState() =>
      _ReceptionAssignmentHighlightState();
}

class _ReceptionAssignmentHighlightState
    extends State<ReceptionAssignmentHighlight>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.instant,
    );

    _colorAnimation =
        ColorTween(
          begin: Colors.transparent,
          end: ReceptionAnimationConstants.success.withOpacity(0.15),
        ).animate(
          CurvedAnimation(
            parent: _controller,
            curve: ReceptionAnimationConstants.defaultCurve,
          ),
        );
  }

  @override
  void didUpdateWidget(ReceptionAssignmentHighlight oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.show && !oldWidget.show) {
      _controller.forward().then((_) {
        Future.delayed(ReceptionAnimationConstants.instant, () {
          if (mounted) _controller.reverse();
        });
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            color: _colorAnimation.value,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
          ),
          child: widget.child,
        );
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE - Clear guidance with fade entry
// ═══════════════════════════════════════════════════════════════════════════════

/// Clear empty state with guidance
class ReceptionEmptyState extends StatefulWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const ReceptionEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  State<ReceptionEmptyState> createState() => _ReceptionEmptyStateState();
}

class _ReceptionEmptyStateState extends State<ReceptionEmptyState>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.slide,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: ReceptionAnimationConstants.defaultCurve,
      ),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _controller,
            curve: ReceptionAnimationConstants.entryCurve,
          ),
        );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(ReceptionAnimationConstants.spacingXl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: ReceptionAnimationConstants.neutralBg,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(widget.icon, size: 40, color: Colors.grey[400]),
                ),
                SizedBox(height: ReceptionAnimationConstants.spacingLg),
                Text(
                  widget.title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                  textAlign: TextAlign.center,
                ),
                if (widget.subtitle != null) ...[
                  SizedBox(height: ReceptionAnimationConstants.spacingSm),
                  Text(
                    widget.subtitle!,
                    style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                    textAlign: TextAlign.center,
                  ),
                ],
                if (widget.action != null) ...[
                  SizedBox(height: ReceptionAnimationConstants.spacingLg),
                  widget.action!,
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATE - Simple centered loader with fade
// ═══════════════════════════════════════════════════════════════════════════════

/// Simple loading state with fade transition
class ReceptionLoadingState extends StatelessWidget {
  final bool isLoading;
  final Widget child;

  const ReceptionLoadingState({
    super.key,
    required this.isLoading,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: ReceptionAnimationConstants.fade,
      switchInCurve: ReceptionAnimationConstants.defaultCurve,
      child: isLoading
          ? Center(
              key: const ValueKey('loading'),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 36,
                    height: 36,
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      color: ReceptionAnimationConstants.primary,
                    ),
                  ),
                  SizedBox(height: ReceptionAnimationConstants.spacingMd),
                  Text(
                    'Loading...',
                    style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                  ),
                ],
              ),
            )
          : KeyedSubtree(key: const ValueKey('content'), child: child),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER - Clean section titles
// ═══════════════════════════════════════════════════════════════════════════════

/// Clean section header for dashboard and lists
class ReceptionSectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const ReceptionSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: ReceptionAnimationConstants.spacingMd),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[800],
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAV CARD - Quick navigation with tap feedback
// ═══════════════════════════════════════════════════════════════════════════════

/// Navigation card for dashboard quick actions
class ReceptionNavCard extends StatefulWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const ReceptionNavCard({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  State<ReceptionNavCard> createState() => _ReceptionNavCardState();
}

class _ReceptionNavCardState extends State<ReceptionNavCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.buttonTap,
    );

    _scaleAnimation =
        Tween<double>(
          begin: 1.0,
          end: ReceptionAnimationConstants.cardPressScale,
        ).animate(
          CurvedAnimation(
            parent: _scaleController,
            curve: ReceptionAnimationConstants.defaultCurve,
          ),
        );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    if (widget.onTap != null) {
      HapticFeedback.selectionClick();
      _scaleController.forward();
    }
  }

  void _handleTapUp(TapUpDetails _) {
    _scaleController.reverse();
    widget.onTap?.call();
  }

  void _handleTapCancel() {
    _scaleController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? _handleTapDown : null,
      onTapUp: widget.onTap != null ? _handleTapUp : null,
      onTapCancel: widget.onTap != null ? _handleTapCancel : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          decoration: BoxDecoration(
            color: ReceptionAnimationConstants.cardBg,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
            border: Border.all(color: ReceptionAnimationConstants.border),
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
            child: Padding(
              padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: widget.iconColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(
                        ReceptionAnimationConstants.radiusSm,
                      ),
                    ),
                    child: Icon(widget.icon, color: widget.iconColor, size: 22),
                  ),
                  SizedBox(width: ReceptionAnimationConstants.spacingMd),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.subtitle,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right, color: Colors.grey[400], size: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER CHIP BAR - Animated filter selection
// ═══════════════════════════════════════════════════════════════════════════════

/// Filter chip for list filtering with animated selection
class ReceptionFilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color? selectedColor;
  final int? count;

  const ReceptionFilterChip({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.selectedColor,
    this.count,
  });

  @override
  Widget build(BuildContext context) {
    final color = selectedColor ?? ReceptionAnimationConstants.primary;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: ReceptionAnimationConstants.chipTransition,
        curve: ReceptionAnimationConstants.defaultCurve,
        padding: EdgeInsets.symmetric(
          horizontal: ReceptionAnimationConstants.spacingMd,
          vertical: ReceptionAnimationConstants.spacingSm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? color : Colors.grey[300]!),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey[700],
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            if (count != null) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withOpacity(0.2)
                      : Colors.grey[200],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey[600],
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT FIELD - Large touch target with focus animation
// ═══════════════════════════════════════════════════════════════════════════════

/// Styled input field with large touch target and focus animation
class ReceptionInputField extends StatelessWidget {
  final TextEditingController? controller;
  final String label;
  final String? hint;
  final IconData? prefixIcon;
  final bool isRequired;
  final TextInputType? keyboardType;
  final int maxLines;
  final String? Function(String?)? validator;
  final bool enabled;

  const ReceptionInputField({
    super.key,
    this.controller,
    required this.label,
    this.hint,
    this.prefixIcon,
    this.isRequired = false,
    this.keyboardType,
    this.maxLines = 1,
    this.validator,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      enabled: enabled,
      validator: validator,
      style: TextStyle(
        fontSize: 15,
        color: enabled ? Colors.grey[800] : Colors.grey[500],
      ),
      decoration: InputDecoration(
        labelText: isRequired ? '$label *' : label,
        hintText: hint,
        prefixIcon: prefixIcon != null
            ? Icon(prefixIcon, size: 20, color: Colors.grey[500])
            : null,
        filled: true,
        fillColor: enabled ? Colors.white : Colors.grey[100],
        contentPadding: EdgeInsets.symmetric(
          horizontal: ReceptionAnimationConstants.spacingLg,
          vertical: ReceptionAnimationConstants.spacingMd + 2,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusMd,
          ),
          borderSide: BorderSide(color: ReceptionAnimationConstants.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusMd,
          ),
          borderSide: BorderSide(color: ReceptionAnimationConstants.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusMd,
          ),
          borderSide: BorderSide(
            color: ReceptionAnimationConstants.primary,
            width: 1.5,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusMd,
          ),
          borderSide: BorderSide(color: ReceptionAnimationConstants.danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(
            ReceptionAnimationConstants.radiusMd,
          ),
          borderSide: BorderSide(
            color: ReceptionAnimationConstants.danger,
            width: 1.5,
          ),
        ),
        labelStyle: TextStyle(color: Colors.grey[600], fontSize: 14),
        floatingLabelStyle: TextStyle(
          color: ReceptionAnimationConstants.primary,
          fontWeight: FontWeight.w500,
        ),
        errorStyle: TextStyle(
          color: ReceptionAnimationConstants.danger,
          fontSize: 12,
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIORITY BADGE - Priority indicator
// ═══════════════════════════════════════════════════════════════════════════════

/// Priority indicator badge
class ReceptionPriorityBadge extends StatelessWidget {
  final String priority;

  const ReceptionPriorityBadge({super.key, required this.priority});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        color = ReceptionAnimationConstants.danger;
        break;
      case 'HIGH':
        color = ReceptionAnimationConstants.warning;
        break;
      case 'LOW':
        color = ReceptionAnimationConstants.success;
        break;
      default:
        color = ReceptionAnimationConstants.primary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        priority.toUpperCase(),
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: color,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER SELECTION CARD - For assignment screen
// ═══════════════════════════════════════════════════════════════════════════════

/// User selection card with animated selection state
class ReceptionUserSelectionCard extends StatefulWidget {
  final String name;
  final String? subtitle;
  final bool isSelected;
  final VoidCallback onTap;
  final Color accentColor;

  const ReceptionUserSelectionCard({
    super.key,
    required this.name,
    this.subtitle,
    required this.isSelected,
    required this.onTap,
    this.accentColor = const Color(0xFF4A90D9),
  });

  @override
  State<ReceptionUserSelectionCard> createState() =>
      _ReceptionUserSelectionCardState();
}

class _ReceptionUserSelectionCardState extends State<ReceptionUserSelectionCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: ReceptionAnimationConstants.buttonTap,
    );

    _scaleAnimation =
        Tween<double>(
          begin: 1.0,
          end: ReceptionAnimationConstants.cardPressScale,
        ).animate(
          CurvedAnimation(
            parent: _scaleController,
            curve: ReceptionAnimationConstants.defaultCurve,
          ),
        );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    HapticFeedback.selectionClick();
    _scaleController.forward();
  }

  void _handleTapUp(TapUpDetails _) {
    _scaleController.reverse();
    widget.onTap();
  }

  void _handleTapCancel() {
    _scaleController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedContainer(
          duration: ReceptionAnimationConstants.chipTransition,
          curve: ReceptionAnimationConstants.defaultCurve,
          margin: EdgeInsets.only(
            bottom: ReceptionAnimationConstants.spacingSm,
          ),
          padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
          decoration: BoxDecoration(
            color: ReceptionAnimationConstants.cardBg,
            borderRadius: BorderRadius.circular(
              ReceptionAnimationConstants.radiusMd,
            ),
            border: Border.all(
              color: widget.isSelected
                  ? widget.accentColor
                  : ReceptionAnimationConstants.border,
              width: widget.isSelected ? 2 : 1,
            ),
            boxShadow: widget.isSelected
                ? [
                    BoxShadow(
                      color: widget.accentColor.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: widget.isSelected
                      ? widget.accentColor.withOpacity(0.15)
                      : Colors.grey[100],
                  borderRadius: BorderRadius.circular(
                    ReceptionAnimationConstants.radiusSm,
                  ),
                ),
                child: Icon(
                  Icons.person_outline,
                  color: widget.isSelected
                      ? widget.accentColor
                      : Colors.grey[500],
                  size: 22,
                ),
              ),
              SizedBox(width: ReceptionAnimationConstants.spacingMd),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: widget.isSelected
                            ? widget.accentColor
                            : Colors.grey[800],
                      ),
                    ),
                    if (widget.subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        widget.subtitle!,
                        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      ),
                    ],
                  ],
                ),
              ),
              AnimatedOpacity(
                duration: ReceptionAnimationConstants.fade,
                opacity: widget.isSelected ? 1.0 : 0.0,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: widget.accentColor,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, color: Colors.white, size: 14),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INFO CARD - Request summary card
// ═══════════════════════════════════════════════════════════════════════════════

/// Request summary info card for assignment screen
class ReceptionInfoCard extends StatelessWidget {
  final String type;
  final String customerName;
  final String? requestId;
  final String status;
  final bool showSuccessHighlight;

  const ReceptionInfoCard({
    super.key,
    required this.type,
    required this.customerName,
    this.requestId,
    required this.status,
    this.showSuccessHighlight = false,
  });

  @override
  Widget build(BuildContext context) {
    final isService = type.toUpperCase() == 'SERVICE';
    final typeColor = isService
        ? ReceptionAnimationConstants.typeService
        : ReceptionAnimationConstants.typeSales;

    return AnimatedContainer(
      duration: ReceptionAnimationConstants.instant,
      curve: ReceptionAnimationConstants.defaultCurve,
      padding: EdgeInsets.all(ReceptionAnimationConstants.spacingLg),
      decoration: BoxDecoration(
        color: showSuccessHighlight
            ? ReceptionAnimationConstants.success.withOpacity(0.08)
            : typeColor.withOpacity(0.06),
        borderRadius: BorderRadius.circular(
          ReceptionAnimationConstants.radiusMd,
        ),
        border: Border.all(
          color: showSuccessHighlight
              ? ReceptionAnimationConstants.success.withOpacity(0.3)
              : typeColor.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: typeColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(
                  isService ? Icons.build_outlined : Icons.storefront_outlined,
                  color: typeColor,
                  size: 18,
                ),
              ),
              SizedBox(width: ReceptionAnimationConstants.spacingMd),
              Expanded(
                child: Text(
                  isService ? 'Service Request' : 'Sales Enquiry',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: typeColor,
                    fontSize: 14,
                  ),
                ),
              ),
              ReceptionStatusChip(status: status, compact: true),
            ],
          ),
          SizedBox(height: ReceptionAnimationConstants.spacingMd),
          Text(
            customerName,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
          ),
          if (requestId != null) ...[
            SizedBox(height: ReceptionAnimationConstants.spacingXs),
            Text(
              'ID: $requestId',
              style: TextStyle(fontSize: 12, color: Colors.grey[500]),
            ),
          ],
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADDITIONAL COMPONENTS - Added for extended functionality
// ═══════════════════════════════════════════════════════════════════════════════

/// Simple loading indicator widget with message
class ReceptionSimpleLoading extends StatelessWidget {
  final String message;

  const ReceptionSimpleLoading({super.key, this.message = 'Loading...'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 36,
            height: 36,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: ReceptionAnimationConstants.primary,
            ),
          ),
          SizedBox(height: ReceptionAnimationConstants.spacingMd),
          Text(
            message,
            style: TextStyle(fontSize: 13, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }
}

/// Info row for displaying label-value pairs (icon, label, value)
class ReceptionInfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const ReceptionInfoRow({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: ReceptionAnimationConstants.spacingMd),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: Colors.grey[600]),
          ),
          SizedBox(width: ReceptionAnimationConstants.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[800],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
