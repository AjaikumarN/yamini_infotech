import 'package:flutter/material.dart';
import '../../../core/constants/salesman_animation_constants.dart';

/// Salesman UI Components
///
/// Subtle, professional animated components for Salesman field app.
/// Following strict animation rules:
/// - 150-250ms durations
/// - Ease-out curves only
/// - Max 12px movement
/// - No bouncy, flashy, or looping animations
/// - Animation confirms action, not decoration

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/// Animated dashboard stat card with staggered fade + slide
class SalesmanDashboardCard extends StatefulWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final int staggerIndex;
  final VoidCallback? onTap;

  const SalesmanDashboardCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.staggerIndex = 0,
    this.onTap,
  });

  @override
  State<SalesmanDashboardCard> createState() => _SalesmanDashboardCardState();
}

class _SalesmanDashboardCardState extends State<SalesmanDashboardCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: SalesmanAnimationConstants.cardEntry,
      vsync: this,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.entryCurve,
    );

    _slideAnimation = Tween<Offset>(
      begin: Offset(0, SalesmanAnimationConstants.cardSlideOffset / 100),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.entryCurve,
    ));

    // Staggered start
    Future.delayed(
      SalesmanAnimationConstants.getCardStaggerDelay(widget.staggerIndex),
      () {
        if (mounted) _controller.forward();
      },
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: GestureDetector(
          onTapDown: (_) => setState(() => _isPressed = true),
          onTapUp: (_) => setState(() => _isPressed = false),
          onTapCancel: () => setState(() => _isPressed = false),
          onTap: widget.onTap,
          child: AnimatedScale(
            scale: _isPressed ? SalesmanAnimationConstants.cardPressScale : 1.0,
            duration: SalesmanAnimationConstants.buttonTap,
            curve: SalesmanAnimationConstants.defaultCurve,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    widget.color.withOpacity(0.15),
                    widget.color.withOpacity(0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: widget.color.withOpacity(0.3),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: widget.color.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: widget.color.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(widget.icon, size: 24, color: widget.color),
                        ),
                        const Spacer(),
                        AnimatedSwitcher(
                          duration: SalesmanAnimationConstants.fade,
                          switchInCurve: SalesmanAnimationConstants.defaultCurve,
                          child: Text(
                            widget.value,
                            key: ValueKey(widget.value),
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: widget.color,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      widget.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Animated attendance banner with status-aware styling
class SalesmanAttendanceBanner extends StatefulWidget {
  final bool isCheckedIn;
  final bool isLate;
  final VoidCallback onMarkAttendance;

  const SalesmanAttendanceBanner({
    super.key,
    required this.isCheckedIn,
    this.isLate = false,
    required this.onMarkAttendance,
  });

  @override
  State<SalesmanAttendanceBanner> createState() =>
      _SalesmanAttendanceBannerState();
}

class _SalesmanAttendanceBannerState extends State<SalesmanAttendanceBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: SalesmanAnimationConstants.cardEntry,
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.entryCurve,
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
    if (widget.isCheckedIn) return const SizedBox.shrink();

    final bannerColor =
        widget.isLate ? Colors.red : SalesmanAnimationConstants.attendanceNotCheckedIn;

    return FadeTransition(
      opacity: _fadeAnimation,
      child: AnimatedContainer(
        duration: SalesmanAnimationConstants.statusTransition,
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bannerColor.withOpacity(0.1),
          border: Border.all(color: bannerColor, width: widget.isLate ? 2 : 1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(
              widget.isLate ? Icons.warning : Icons.schedule,
              color: bannerColor.withOpacity(0.8),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.isLate
                        ? 'You are running late!'
                        : 'Attendance Not Marked',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: bannerColor.withOpacity(0.9),
                    ),
                  ),
                  Text(
                    'Mark attendance to enable all features',
                    style: TextStyle(
                      fontSize: 12,
                      color: bannerColor.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
            SalesmanActionButton(
              label: 'Mark Now',
              onPressed: widget.onMarkAttendance,
              color: bannerColor,
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/// Animated action button with press scale feedback
class SalesmanActionButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color? color;
  final IconData? icon;
  final bool isLoading;
  final bool isSuccess;

  const SalesmanActionButton({
    super.key,
    required this.label,
    this.onPressed,
    this.color,
    this.icon,
    this.isLoading = false,
    this.isSuccess = false,
  });

  @override
  State<SalesmanActionButton> createState() => _SalesmanActionButtonState();
}

class _SalesmanActionButtonState extends State<SalesmanActionButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? SalesmanAnimationConstants.buttonPressScale : 1.0,
        duration: SalesmanAnimationConstants.buttonTap,
        curve: SalesmanAnimationConstants.defaultCurve,
        child: ElevatedButton.icon(
          onPressed: widget.isLoading ? null : widget.onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: widget.color,
          ),
          icon: AnimatedSwitcher(
            duration: SalesmanAnimationConstants.fade,
            child: widget.isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : widget.isSuccess
                    ? const Icon(Icons.check, key: ValueKey('success'))
                    : widget.icon != null
                        ? Icon(widget.icon, key: ValueKey('icon'))
                        : const SizedBox.shrink(),
          ),
          label: Text(widget.label),
        ),
      ),
    );
  }
}

/// Large attendance action button with status feedback
class SalesmanAttendanceButton extends StatefulWidget {
  final bool isCheckedIn;
  final bool isLoading;
  final VoidCallback onPressed;

  const SalesmanAttendanceButton({
    super.key,
    required this.isCheckedIn,
    this.isLoading = false,
    required this.onPressed,
  });

  @override
  State<SalesmanAttendanceButton> createState() =>
      _SalesmanAttendanceButtonState();
}

class _SalesmanAttendanceButtonState extends State<SalesmanAttendanceButton> {
  bool _isPressed = false;
  bool _showSuccess = false;

  @override
  Widget build(BuildContext context) {
    final color = widget.isCheckedIn ? Colors.red : Colors.green;
    final label = widget.isCheckedIn ? 'CHECK OUT' : 'CHECK IN';
    final icon = widget.isCheckedIn ? Icons.logout : Icons.login;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? SalesmanAnimationConstants.buttonPressScale : 1.0,
        duration: SalesmanAnimationConstants.buttonTap,
        curve: SalesmanAnimationConstants.defaultCurve,
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton.icon(
            onPressed: widget.isLoading
                ? null
                : () {
                    widget.onPressed();
                    setState(() => _showSuccess = true);
                    Future.delayed(SalesmanAnimationConstants.success, () {
                      if (mounted) setState(() => _showSuccess = false);
                    });
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: AnimatedSwitcher(
              duration: SalesmanAnimationConstants.fade,
              child: widget.isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : _showSuccess
                      ? const Icon(Icons.check_circle,
                          key: ValueKey('success'), size: 24)
                      : Icon(icon, key: ValueKey(icon), size: 24),
            ),
            label: Text(
              label,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST ITEM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/// Animated list item with fade + slide entry
class SalesmanListItem extends StatefulWidget {
  final Widget child;
  final int staggerIndex;
  final VoidCallback? onTap;

  const SalesmanListItem({
    super.key,
    required this.child,
    this.staggerIndex = 0,
    this.onTap,
  });

  @override
  State<SalesmanListItem> createState() => _SalesmanListItemState();
}

class _SalesmanListItemState extends State<SalesmanListItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: SalesmanAnimationConstants.listEntry,
      vsync: this,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.defaultCurve,
    );

    _slideAnimation = Tween<Offset>(
      begin: Offset(0, SalesmanAnimationConstants.listSlideOffset / 100),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.entryCurve,
    ));

    Future.delayed(
      SalesmanAnimationConstants.getListStaggerDelay(widget.staggerIndex),
      () {
        if (mounted) _controller.forward();
      },
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: widget.child,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS CHIPS & BADGES
// ═══════════════════════════════════════════════════════════════════════════

/// Animated priority chip (HOT/WARM/COLD)
class SalesmanPriorityChip extends StatelessWidget {
  final String priority;

  const SalesmanPriorityChip({super.key, required this.priority});

  @override
  Widget build(BuildContext context) {
    final color = SalesmanAnimationConstants.getPriorityColor(priority);
    final icon = _getIcon();

    return AnimatedContainer(
      duration: SalesmanAnimationConstants.chipTransition,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            priority.toUpperCase(),
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getIcon() {
    switch (priority.toUpperCase()) {
      case 'HOT':
        return Icons.local_fire_department;
      case 'WARM':
        return Icons.thermostat;
      default:
        return Icons.ac_unit;
    }
  }
}

/// Animated status chip with color transition
class SalesmanStatusChip extends StatelessWidget {
  final String status;
  final String type; // 'enquiry', 'followup', 'order'

  const SalesmanStatusChip({
    super.key,
    required this.status,
    this.type = 'enquiry',
  });

  @override
  Widget build(BuildContext context) {
    final color = _getColor();

    return AnimatedContainer(
      duration: SalesmanAnimationConstants.statusTransition,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 11,
        ),
      ),
    );
  }

  Color _getColor() {
    switch (type) {
      case 'followup':
        return SalesmanAnimationConstants.getFollowupStatusColor(status);
      case 'order':
        return SalesmanAnimationConstants.getOrderStatusColor(status);
      default:
        return SalesmanAnimationConstants.getEnquiryStatusColor(status);
    }
  }
}

/// Order health indicator (pending > 3 days = amber, overdue = red)
class SalesmanOrderHealthIndicator extends StatelessWidget {
  final int daysOld;
  final bool isOverdue;

  const SalesmanOrderHealthIndicator({
    super.key,
    required this.daysOld,
    this.isOverdue = false,
  });

  @override
  Widget build(BuildContext context) {
    Color color;
    if (isOverdue) {
      color = SalesmanAnimationConstants.statusOverdue;
    } else if (daysOld > 3) {
      color = SalesmanAnimationConstants.statusPending;
    } else {
      return const SizedBox.shrink();
    }

    return AnimatedContainer(
      duration: SalesmanAnimationConstants.statusTransition,
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/// Animated filter chip with selection state
class SalesmanFilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color? color;

  const SalesmanFilterChip({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final chipColor = color ?? Theme.of(context).primaryColor;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: SalesmanAnimationConstants.chipTransition,
        curve: SalesmanAnimationConstants.defaultCurve,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? chipColor : chipColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? chipColor : chipColor.withOpacity(0.3),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : chipColor,
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY & LOADING STATES
// ═══════════════════════════════════════════════════════════════════════════

/// Animated empty state with guidance text
class SalesmanEmptyState extends StatefulWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? action;

  const SalesmanEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.action,
  });

  @override
  State<SalesmanEmptyState> createState() => _SalesmanEmptyStateState();
}

class _SalesmanEmptyStateState extends State<SalesmanEmptyState>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: SalesmanAnimationConstants.fade,
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.entryCurve,
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
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(widget.icon, size: 80, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              widget.title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.grey.shade700,
                  ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                widget.subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600),
              ),
            ),
            if (widget.action != null) ...[
              const SizedBox(height: 24),
              widget.action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Loading state with skeleton placeholder
class SalesmanLoadingState extends StatelessWidget {
  final int itemCount;

  const SalesmanLoadingState({super.key, this.itemCount = 3});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 16,
                        width: double.infinity,
                        color: Colors.grey.shade200,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        height: 12,
                        width: 100,
                        color: Colors.grey.shade100,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════

/// Animated success indicator with scale-in check icon
class SalesmanSuccessIndicator extends StatefulWidget {
  final String message;
  final VoidCallback? onComplete;

  const SalesmanSuccessIndicator({
    super.key,
    required this.message,
    this.onComplete,
  });

  @override
  State<SalesmanSuccessIndicator> createState() =>
      _SalesmanSuccessIndicatorState();
}

class _SalesmanSuccessIndicatorState extends State<SalesmanSuccessIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: SalesmanAnimationConstants.success,
      vsync: this,
    );
    _scaleAnimation = CurvedAnimation(
      parent: _controller,
      curve: SalesmanAnimationConstants.entryCurve,
    );
    _controller.forward().then((_) {
      Future.delayed(const Duration(seconds: 1), () {
        widget.onComplete?.call();
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: SalesmanAnimationConstants.statusCompleted.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle,
              size: 64,
              color: SalesmanAnimationConstants.statusCompleted,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            widget.message,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: SalesmanAnimationConstants.statusCompleted,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION & TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/// Battery-aware status message for tracking
class SalesmanTrackingStatus extends StatelessWidget {
  final bool isActive;
  final String? message;

  const SalesmanTrackingStatus({
    super.key,
    required this.isActive,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: SalesmanAnimationConstants.statusTransition,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isActive
            ? SalesmanAnimationConstants.statusCompleted.withOpacity(0.1)
            : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive
              ? SalesmanAnimationConstants.statusCompleted
              : Colors.grey.shade300,
        ),
      ),
      child: Row(
        children: [
          AnimatedSwitcher(
            duration: SalesmanAnimationConstants.fade,
            child: Icon(
              isActive ? Icons.location_on : Icons.location_off,
              key: ValueKey(isActive),
              color: isActive
                  ? SalesmanAnimationConstants.statusCompleted
                  : Colors.grey,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isActive ? 'Live Tracking Active' : 'Tracking Inactive',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isActive
                        ? SalesmanAnimationConstants.statusCompleted
                        : Colors.grey.shade700,
                  ),
                ),
                if (message != null)
                  Text(
                    message!,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                if (isActive)
                  Text(
                    'Tracking optimized for battery',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade500,
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

// ═══════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/// Expandable section with smooth animation
class SalesmanExpandableSection extends StatefulWidget {
  final String title;
  final IconData icon;
  final Color? color;
  final Widget child;
  final bool initiallyExpanded;

  const SalesmanExpandableSection({
    super.key,
    required this.title,
    required this.icon,
    this.color,
    required this.child,
    this.initiallyExpanded = true,
  });

  @override
  State<SalesmanExpandableSection> createState() =>
      _SalesmanExpandableSectionState();
}

class _SalesmanExpandableSectionState extends State<SalesmanExpandableSection>
    with SingleTickerProviderStateMixin {
  late bool _isExpanded;
  late AnimationController _controller;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;
    _controller = AnimationController(
      duration: SalesmanAnimationConstants.sectionToggle,
      vsync: this,
    );
    _rotationAnimation = Tween<double>(begin: 0, end: 0.5).animate(
      CurvedAnimation(
        parent: _controller,
        curve: SalesmanAnimationConstants.defaultCurve,
      ),
    );
    if (_isExpanded) _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final sectionColor = widget.color ?? Theme.of(context).primaryColor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: _toggle,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Icon(widget.icon, color: sectionColor, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: sectionColor,
                    ),
                  ),
                ),
                RotationTransition(
                  turns: _rotationAnimation,
                  child: Icon(
                    Icons.keyboard_arrow_down,
                    color: sectionColor,
                  ),
                ),
              ],
            ),
          ),
        ),
        AnimatedCrossFade(
          firstChild: widget.child,
          secondChild: const SizedBox.shrink(),
          crossFadeState:
              _isExpanded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
          duration: SalesmanAnimationConstants.sectionToggle,
          sizeCurve: SalesmanAnimationConstants.defaultCurve,
        ),
      ],
    );
  }
}

/// Overdue badge for follow-ups
class SalesmanOverdueBadge extends StatelessWidget {
  final bool isOverdue;
  final bool isDueToday;

  const SalesmanOverdueBadge({
    super.key,
    this.isOverdue = false,
    this.isDueToday = false,
  });

  @override
  Widget build(BuildContext context) {
    if (!isOverdue && !isDueToday) return const SizedBox.shrink();

    final color = isOverdue
        ? SalesmanAnimationConstants.statusOverdue
        : SalesmanAnimationConstants.statusPending;
    final text = isOverdue ? 'OVERDUE' : 'DUE TODAY';

    return AnimatedContainer(
      duration: SalesmanAnimationConstants.statusTransition,
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
