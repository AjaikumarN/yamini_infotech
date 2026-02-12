import 'package:flutter/material.dart';
import '../theme/admin_theme.dart';

/// Admin UI Components - Reusable Widgets
/// 
/// Clean, professional components for the Admin control panel.
/// No flashy animations, focus on data clarity.

// ==================== FADE IN ANIMATION ====================

/// Simple fade-in with optional slide
class AdminFadeIn extends StatefulWidget {
  final Widget child;
  final Duration delay;
  final double slideOffset;
  
  const AdminFadeIn({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.slideOffset = 10.0,
  });
  
  @override
  State<AdminFadeIn> createState() => _AdminFadeInState();
}

class _AdminFadeInState extends State<AdminFadeIn>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<Offset> _slide;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: AdminAnimations.slideDuration,
      vsync: this,
    );
    
    _opacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: AdminAnimations.defaultCurve),
    );
    
    _slide = Tween<Offset>(
      begin: Offset(0, widget.slideOffset / 100),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _controller, curve: AdminAnimations.defaultCurve),
    );
    
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _slide,
        child: widget.child,
      ),
    );
  }
}

// ==================== STAGGERED FADE IN ====================

/// Staggered animation for lists
class AdminStaggeredList extends StatelessWidget {
  final List<Widget> children;
  final Duration baseDelay;
  
  const AdminStaggeredList({
    super.key,
    required this.children,
    this.baseDelay = Duration.zero,
  });
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(children.length, (index) {
        return AdminFadeIn(
          delay: baseDelay + (AdminAnimations.staggerDelay * index),
          child: children[index],
        );
      }),
    );
  }
}

// ==================== KPI CARD ====================

/// Professional KPI Card with status awareness
class AdminKPICard extends StatefulWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? accentColor;
  final bool isPositive;
  final VoidCallback? onTap;
  
  const AdminKPICard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.accentColor,
    this.isPositive = false,
    this.onTap,
  });
  
  @override
  State<AdminKPICard> createState() => _AdminKPICardState();
}

class _AdminKPICardState extends State<AdminKPICard> {
  bool _isPressed = false;
  
  @override
  Widget build(BuildContext context) {
    final hasValue = widget.value != '0' && widget.value != '-';
    final cardColor = widget.accentColor ??
        (hasValue && widget.isPositive
            ? AdminTheme.accentPositive
            : AdminTheme.surface);
    final iconColor = widget.accentColor != null
        ? widget.accentColor!
        : (hasValue && widget.isPositive
            ? AdminTheme.statusSuccess
            : AdminTheme.textSecondary);
    
    return GestureDetector(
      onTapDown: widget.onTap != null ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: widget.onTap != null ? (_) => setState(() => _isPressed = false) : null,
      onTapCancel: widget.onTap != null ? () => setState(() => _isPressed = false) : null,
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: AdminAnimations.buttonTapDuration,
        transform: Matrix4.identity()..scale(_isPressed ? 0.98 : 1.0),
        transformAlignment: Alignment.center,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
          boxShadow: AdminTheme.cardShadow,
          border: Border.all(
            color: hasValue && widget.isPositive
                ? AdminTheme.statusSuccess.withOpacity(0.15)
                : Colors.transparent,
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AdminTheme.radiusSmall),
              ),
              child: Icon(
                widget.icon,
                size: 20,
                color: iconColor,
              ),
            ),
            const SizedBox(height: 8),
            AnimatedSwitcher(
              duration: AdminAnimations.fadeDuration,
              child: Text(
                widget.value,
                key: ValueKey(widget.value),
                style: AdminTheme.kpiNumber.copyWith(
                  color: hasValue ? AdminTheme.textPrimary : AdminTheme.textMuted,
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              widget.label,
              style: AdminTheme.kpiLabel,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ==================== SECTION HEADER ====================

class AdminSectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;
  
  const AdminSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AdminTheme.spacingMD),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AdminTheme.headingSmall),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(subtitle!, style: AdminTheme.bodySmall),
              ],
            ],
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

// ==================== QUICK ACTION TILE ====================

class AdminActionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  
  const AdminActionTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return Material(
      color: AdminTheme.surface,
      borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
        child: Container(
          padding: const EdgeInsets.all(AdminTheme.cardPadding),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AdminTheme.radiusMedium),
            boxShadow: AdminTheme.cardShadow,
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AdminTheme.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(AdminTheme.radiusSmall),
                ),
                child: Icon(
                  icon,
                  color: AdminTheme.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AdminTheme.bodyLarge),
                    const SizedBox(height: 2),
                    Text(subtitle, style: AdminTheme.bodySmall),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: AdminTheme.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ==================== STATUS CHIP ====================

class AdminStatusChip extends StatelessWidget {
  final String label;
  final Color color;
  final bool filled;
  
  const AdminStatusChip({
    super.key,
    required this.label,
    required this.color,
    this.filled = false,
  });
  
  factory AdminStatusChip.present() => const AdminStatusChip(
    label: 'Present',
    color: AdminTheme.statusSuccess,
    filled: true,
  );
  
  factory AdminStatusChip.late() => const AdminStatusChip(
    label: 'Late',
    color: AdminTheme.statusWarning,
    filled: true,
  );
  
  factory AdminStatusChip.absent() => const AdminStatusChip(
    label: 'Absent',
    color: AdminTheme.statusError,
    filled: true,
  );
  
  factory AdminStatusChip.active() => const AdminStatusChip(
    label: 'Active',
    color: AdminTheme.statusActive,
    filled: true,
  );
  
  factory AdminStatusChip.idle() => const AdminStatusChip(
    label: 'Idle',
    color: AdminTheme.statusIdle,
    filled: true,
  );
  
  factory AdminStatusChip.offline() => const AdminStatusChip(
    label: 'Offline',
    color: AdminTheme.statusOffline,
    filled: true,
  );
  
  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: AdminAnimations.statusChangeDuration,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: filled ? color.withOpacity(0.12) : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        border: filled ? null : Border.all(color: color, width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

// ==================== LOCATION STATUS INDICATOR ====================

class AdminLocationIndicator extends StatelessWidget {
  final String status;
  final String lastUpdate;
  
  const AdminLocationIndicator({
    super.key,
    required this.status,
    required this.lastUpdate,
  });
  
  Color get _statusColor {
    switch (status.toLowerCase()) {
      case 'active':
        return AdminTheme.statusActive;
      case 'idle':
        return AdminTheme.statusIdle;
      default:
        return AdminTheme.statusOffline;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedContainer(
          duration: AdminAnimations.statusChangeDuration,
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: _statusColor,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          lastUpdate,
          style: AdminTheme.bodySmall.copyWith(color: _statusColor),
        ),
      ],
    );
  }
}

// ==================== EMPTY STATE ====================

class AdminEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;
  
  const AdminEmptyState({
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
        padding: const EdgeInsets.all(AdminTheme.spacingXL),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: AdminTheme.textMuted,
            ),
            const SizedBox(height: AdminTheme.spacingMD),
            Text(
              title,
              style: AdminTheme.headingSmall.copyWith(
                color: AdminTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: AdminTheme.spacingSM),
              Text(
                subtitle!,
                style: AdminTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: AdminTheme.spacingLG),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

// ==================== LOADING STATE ====================

class AdminLoadingState extends StatelessWidget {
  final String? message;
  
  const AdminLoadingState({super.key, this.message});
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: AdminTheme.primary,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: AdminTheme.spacingMD),
            Text(message!, style: AdminTheme.bodyMedium),
          ],
        ],
      ),
    );
  }
}

// ==================== INFO BAR ====================

class AdminInfoBar extends StatelessWidget {
  final String text;
  final IconData? icon;
  final Color? color;
  
  const AdminInfoBar({
    super.key,
    required this.text,
    this.icon,
    this.color,
  });
  
  @override
  Widget build(BuildContext context) {
    final bgColor = color ?? AdminTheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AdminTheme.spacingMD,
        vertical: AdminTheme.spacingSM,
      ),
      decoration: BoxDecoration(
        color: bgColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(AdminTheme.radiusSmall),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: bgColor),
            const SizedBox(width: 8),
          ],
          Text(
            text,
            style: AdminTheme.bodySmall.copyWith(
              color: bgColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
