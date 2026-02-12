import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Animation Constants
/// 
/// Centralized timing and curve definitions for consistent animations
/// Following "Soft Motion UI" principles: subtle, fast, purpose-driven
class AnimationConstants {
  // Durations (in milliseconds)
  static const Duration instant = Duration(milliseconds: 100);
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 200);
  static const Duration slow = Duration(milliseconds: 300);
  
  // Curves - prefer ease-out for natural deceleration
  static const Curve defaultCurve = Curves.easeOut;
  static const Curve enterCurve = Curves.easeOutCubic;
  static const Curve exitCurve = Curves.easeIn;
  
  // Movement distances (in logical pixels)
  static const double slideSmall = 8.0;
  static const double slideMedium = 16.0;
  static const double slideLarge = 24.0;
}

/// Fade In widget with optional slide
/// 
/// Use for: Cards appearing, content loading, screen elements
class FadeIn extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Duration delay;
  final double slideOffset;
  final Axis slideDirection;

  const FadeIn({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 200),
    this.delay = Duration.zero,
    this.slideOffset = 0,
    this.slideDirection = Axis.vertical,
  });

  @override
  State<FadeIn> createState() => _FadeInState();
}

class _FadeInState extends State<FadeIn> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    
    _opacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: AnimationConstants.defaultCurve),
    );
    
    final slideBegin = widget.slideDirection == Axis.vertical
        ? Offset(0, widget.slideOffset / 100)
        : Offset(widget.slideOffset / 100, 0);
    
    _slide = Tween<Offset>(begin: slideBegin, end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: AnimationConstants.enterCurve),
    );

    if (widget.delay == Duration.zero) {
      _controller.forward();
    } else {
      Future.delayed(widget.delay, () {
        if (mounted) _controller.forward();
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
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _slide,
        child: widget.child,
      ),
    );
  }
}

/// Staggered list animation
/// 
/// Use for: List items appearing one by one
class StaggeredFadeIn extends StatelessWidget {
  final int index;
  final Widget child;
  final Duration baseDelay;
  final Duration staggerDelay;

  const StaggeredFadeIn({
    super.key,
    required this.index,
    required this.child,
    this.baseDelay = const Duration(milliseconds: 50),
    this.staggerDelay = const Duration(milliseconds: 50),
  });

  @override
  Widget build(BuildContext context) {
    return FadeIn(
      delay: baseDelay + (staggerDelay * index),
      slideOffset: AnimationConstants.slideSmall,
      child: child,
    );
  }
}

/// Animated status indicator
/// 
/// Use for: Check-in success, job completion, status changes
class AnimatedStatusIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;
  final bool animate;

  const AnimatedStatusIcon({
    super.key,
    required this.icon,
    required this.color,
    this.size = 24,
    this.animate = true,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: animate ? 0.0 : 1.0, end: 1.0),
      duration: AnimationConstants.slow,
      curve: AnimationConstants.enterCurve,
      builder: (context, value, child) {
        return Transform.scale(
          scale: 0.5 + (value * 0.5),
          child: Opacity(
            opacity: value,
            child: Icon(icon, color: color, size: size),
          ),
        );
      },
    );
  }
}

/// Animated card wrapper
/// 
/// Use for: Dashboard stat cards, list items with press feedback
class AnimatedCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets? margin;
  final double elevation;

  const AnimatedCard({
    super.key,
    required this.child,
    this.onTap,
    this.margin,
    this.elevation = 1,
  });

  @override
  State<AnimatedCard> createState() => _AnimatedCardState();
}

class _AnimatedCardState extends State<AnimatedCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? (_) => setState(() => _isPressed = true) : null,
      onTapUp: widget.onTap != null ? (_) => setState(() => _isPressed = false) : null,
      onTapCancel: widget.onTap != null ? () => setState(() => _isPressed = false) : null,
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: AnimationConstants.instant,
        curve: AnimationConstants.defaultCurve,
        margin: widget.margin,
        transform: Matrix4.identity()..scale(_isPressed ? 0.98 : 1.0),
        child: Card(
          elevation: _isPressed ? widget.elevation * 0.5 : widget.elevation,
          child: widget.child,
        ),
      ),
    );
  }
}

/// Loading state transition
/// 
/// Use for: Loading → Content transitions
class AnimatedLoadingState extends StatelessWidget {
  final bool isLoading;
  final Widget loadingWidget;
  final Widget child;

  const AnimatedLoadingState({
    super.key,
    required this.isLoading,
    required this.child,
    this.loadingWidget = const Center(child: CircularProgressIndicator()),
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: AnimationConstants.normal,
      switchInCurve: AnimationConstants.enterCurve,
      switchOutCurve: AnimationConstants.exitCurve,
      child: isLoading
          ? KeyedSubtree(key: const ValueKey('loading'), child: loadingWidget)
          : KeyedSubtree(key: const ValueKey('content'), child: child),
    );
  }
}

/// Success checkmark animation
/// 
/// Use for: Check-in success, form submission, job completion
class SuccessCheckmark extends StatelessWidget {
  final double size;
  final Color? color;

  const SuccessCheckmark({
    super.key,
    this.size = 64,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final checkColor = color ?? Colors.green;
    
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: AnimationConstants.slow,
      curve: AnimationConstants.enterCurve,
      builder: (context, value, _) {
        return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: checkColor.withOpacity(0.1 * value),
          ),
          child: Transform.scale(
            scale: 0.5 + (value * 0.5),
            child: Icon(
              Icons.check_circle,
              size: size * 0.8,
              color: checkColor.withOpacity(value),
            ),
          ),
        );
      },
    );
  }
}

/// Animated button with subtle press feedback
/// 
/// Use for: Primary action buttons
class AnimatedButton extends StatefulWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final EdgeInsets? padding;
  final bool isLoading;

  const AnimatedButton({
    super.key,
    required this.child,
    this.onPressed,
    this.backgroundColor,
    this.foregroundColor,
    this.padding,
    this.isLoading = false,
  });

  @override
  State<AnimatedButton> createState() => _AnimatedButtonState();
}

class _AnimatedButtonState extends State<AnimatedButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onPressed != null && !widget.isLoading
          ? (_) => setState(() => _isPressed = true)
          : null,
      onTapUp: widget.onPressed != null && !widget.isLoading
          ? (_) => setState(() => _isPressed = false)
          : null,
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.isLoading ? null : widget.onPressed,
      child: AnimatedContainer(
        duration: AnimationConstants.instant,
        curve: AnimationConstants.defaultCurve,
        transform: Matrix4.identity()..scale(_isPressed ? 0.97 : 1.0),
        child: ElevatedButton(
          onPressed: widget.isLoading ? null : widget.onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: widget.backgroundColor,
            foregroundColor: widget.foregroundColor,
            padding: widget.padding,
          ),
          child: AnimatedSwitcher(
            duration: AnimationConstants.fast,
            child: widget.isLoading
                ? SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: widget.foregroundColor ?? Colors.white,
                    ),
                  )
                : widget.child,
          ),
        ),
      ),
    );
  }
}

/// Shimmer loading placeholder
/// 
/// Use for: Skeleton loading states
class ShimmerLoading extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;

  const ShimmerLoading({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius,
  });

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
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
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(4),
            gradient: LinearGradient(
              begin: Alignment(-1.0 + (_controller.value * 2), 0),
              end: Alignment(_controller.value * 2, 0),
              colors: [
                Colors.grey.shade300,
                Colors.grey.shade100,
                Colors.grey.shade300,
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Page transition builder for GoRouter
/// 
/// Use for: Screen transitions
/// 
/// Usage in GoRouter:
/// ```dart
/// GoRoute(
///   path: '/details',
///   pageBuilder: (context, state) => SoftPageTransition.buildPage(
///     context: context,
///     state: state,
///     child: DetailsScreen(),
///   ),
/// )
/// ```
class SoftPageTransition {
  static Page<void> buildPage({
    required BuildContext context,
    required GoRouterState state,
    required Widget child,
    LocalKey? key,
  }) {
    return CustomTransitionPage<void>(
      key: key ?? state.pageKey,
      child: child,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: CurvedAnimation(
            parent: animation,
            curve: AnimationConstants.enterCurve,
          ),
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0.02, 0),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: animation,
              curve: AnimationConstants.enterCurve,
            )),
            child: child,
          ),
        );
      },
      transitionDuration: AnimationConstants.normal,
      reverseTransitionDuration: AnimationConstants.fast,
    );
  }
}

/// Animated visibility wrapper
/// 
/// Use for: Conditional content that fades in/out
class AnimatedVisibility extends StatelessWidget {
  final bool visible;
  final Widget child;
  final Duration duration;

  const AnimatedVisibility({
    super.key,
    required this.visible,
    required this.child,
    this.duration = const Duration(milliseconds: 200),
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: visible ? 1.0 : 0.0,
      duration: duration,
      curve: AnimationConstants.defaultCurve,
      child: AnimatedContainer(
        duration: duration,
        height: visible ? null : 0,
        child: visible ? child : const SizedBox.shrink(),
      ),
    );
  }
}
