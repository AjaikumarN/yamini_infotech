import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Shimmer loading card - replacement for CircularProgressIndicator
///
/// Shows a pulsing skeleton that matches the layout of the final content
/// Much better perceived performance than a spinner
class ShimmerCard extends StatelessWidget {
  final double height;
  final double? width;
  final double borderRadius;

  const ShimmerCard({
    super.key,
    this.height = 80,
    this.width,
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Container(
        height: height,
        width: width ?? double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Shimmer loading for dashboard KPI cards
class ShimmerDashboard extends StatelessWidget {
  final int cardCount;
  const ShimmerDashboard({super.key, this.cardCount = 4});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header shimmer
            Container(
              height: 24,
              width: 200,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              height: 16,
              width: 140,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            const SizedBox(height: 24),
            // KPI grid shimmer based on cardCount
            ...List.generate((cardCount / 2).ceil(), (i) {
              final isLast = i == (cardCount / 2).ceil() - 1;
              final hasTwo = (i * 2 + 1) < cardCount;
              return Padding(
                padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
                child: Row(
                  children: [
                    Expanded(child: _shimmerKpiCard()),
                    if (hasTwo) ...[
                      const SizedBox(width: 12),
                      Expanded(child: _shimmerKpiCard()),
                    ] else
                      const Spacer(),
                  ],
                ),
              );
            }),
            const SizedBox(height: 24),
            // List items shimmer
            _shimmerListItem(),
            const SizedBox(height: 12),
            _shimmerListItem(),
            const SizedBox(height: 12),
            _shimmerListItem(),
          ],
        ),
      ),
    );
  }

  static Widget _shimmerKpiCard() {
    return Container(
      height: 90,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }

  static Widget _shimmerListItem() {
    return Container(
      height: 64,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }
}

/// Shimmer list loader - for lists that are loading
class ShimmerList extends StatelessWidget {
  final int itemCount;
  final double itemHeight;

  const ShimmerList({
    super.key,
    this.itemCount = 5,
    this.itemHeight = 72,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: List.generate(
            itemCount,
            (i) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                height: itemHeight,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Debounced button - prevents double-submit and shows loading state
class DebouncedButton extends StatefulWidget {
  final String label;
  final IconData? icon;
  final Future<void> Function() onPressed;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool enabled;
  final double? width;
  final double height;
  final double borderRadius;

  const DebouncedButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.backgroundColor,
    this.foregroundColor,
    this.enabled = true,
    this.width,
    this.height = 52,
    this.borderRadius = 12,
  });

  @override
  State<DebouncedButton> createState() => _DebouncedButtonState();
}

class _DebouncedButtonState extends State<DebouncedButton> {
  bool _isProcessing = false;

  Future<void> _handlePress() async {
    if (_isProcessing || !widget.enabled) return;
    setState(() => _isProcessing = true);
    try {
      await widget.onPressed();
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bg = widget.backgroundColor ?? Theme.of(context).primaryColor;
    final fg = widget.foregroundColor ?? Colors.white;

    return SizedBox(
      width: widget.width ?? double.infinity,
      height: widget.height,
      child: ElevatedButton(
        onPressed: (widget.enabled && !_isProcessing) ? _handlePress : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          disabledBackgroundColor: bg.withOpacity(0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(widget.borderRadius),
          ),
        ),
        child: _isProcessing
            ? SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: fg,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (widget.icon != null) ...[
                    Icon(widget.icon, size: 20),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    widget.label,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Optimistic submit wrapper
///
/// Shows success immediately, syncs in background
/// If sync fails, shows a subtle "retry" indicator
class OptimisticAction {
  /// Execute an action optimistically
  ///
  /// [onSuccess] is called immediately
  /// [apiCall] runs in background
  /// [onFailure] is called only if apiCall fails
  static Future<void> execute({
    required VoidCallback onSuccess,
    required Future<bool> Function() apiCall,
    VoidCallback? onFailure,
  }) async {
    // Show success immediately
    onSuccess();

    // Sync in background
    try {
      final success = await apiCall();
      if (!success) {
        onFailure?.call();
      }
    } catch (e) {
      onFailure?.call();
    }
  }
}

/// Location status indicator widget - shows updating state without blocking
class LocationStatusBadge extends StatelessWidget {
  final bool isUpdating;
  final bool hasLocation;

  const LocationStatusBadge({
    super.key,
    required this.isUpdating,
    required this.hasLocation,
  });

  @override
  Widget build(BuildContext context) {
    if (hasLocation && !isUpdating) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isUpdating
            ? Colors.orange.withOpacity(0.1)
            : Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isUpdating)
            const SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(
                strokeWidth: 1.5,
                color: Colors.orange,
              ),
            )
          else
            const Icon(Icons.location_on, size: 12, color: Colors.green),
          const SizedBox(width: 4),
          Text(
            isUpdating ? 'Updating...' : 'Located',
            style: TextStyle(
              fontSize: 11,
              color: isUpdating ? Colors.orange : Colors.green,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

/// Pending sync badge - shows count of queued actions
class PendingSyncBadge extends StatelessWidget {
  final int pendingCount;

  const PendingSyncBadge({super.key, required this.pendingCount});

  @override
  Widget build(BuildContext context) {
    if (pendingCount == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.amber.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade300),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.sync, size: 14, color: Colors.amber.shade800),
          const SizedBox(width: 4),
          Text(
            '$pendingCount pending',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.amber.shade800,
            ),
          ),
        ],
      ),
    );
  }
}
