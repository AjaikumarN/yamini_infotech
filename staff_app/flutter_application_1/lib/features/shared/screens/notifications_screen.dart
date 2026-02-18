import 'package:flutter/material.dart';
import '../../../core/services/dio_client.dart';
import '../../../core/services/navigation_service.dart';

/// Notifications Screen
///
/// Displays system notifications with real API data, mark-as-read,
/// pull-to-refresh, category filtering, and tap-to-navigate.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;
  bool _markingAll = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchNotifications();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _loading = true);
    try {
      final response = await DioClient.instance.dio.get(
        '/api/notifications/my',
        queryParameters: {'limit': 50},
      );
      if (response.data is List) {
        _notifications = List<Map<String, dynamic>>.from(response.data);
      }
    } catch (e) {
      debugPrint('Failed to fetch notifications: $e');
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _markAsRead(int id) async {
    try {
      await DioClient.instance.dio.put('/api/notifications/$id/read');
      setState(() {
        final idx = _notifications.indexWhere((n) => n['id'] == id);
        if (idx != -1) _notifications[idx]['is_read'] = true;
      });
    } catch (e) {
      debugPrint('Failed to mark notification read: $e');
    }
  }

  Future<void> _markAllRead() async {
    setState(() => _markingAll = true);
    try {
      await DioClient.instance.dio.put('/api/notifications/read-all');
      setState(() {
        for (var n in _notifications) {
          n['is_read'] = true;
        }
      });
    } catch (e) {
      debugPrint('Failed to mark all read: $e');
    }
    if (mounted) setState(() => _markingAll = false);
  }

  void _onNotificationTap(Map<String, dynamic> notif) {
    // Mark as read
    if (notif['is_read'] != true) {
      _markAsRead(notif['id']);
    }

    final actionUrl = notif['action_url'] as String?;
    final module = (notif['module'] ?? notif['entity_type'] ?? '').toString().toLowerCase();

    // Try to use deep-link route from action_url
    if (actionUrl != null && actionUrl.isNotEmpty && actionUrl.startsWith('/')) {
      NavigationService.instance.navigateTo(actionUrl);
      return;
    }

    // Navigate based on module type
    String? route;
    if (module.contains('enquir')) {
      route = '/enquiries';
    } else if (module.contains('service') || module.contains('complaint')) {
      route = '/service-requests';
    } else if (module.contains('order')) {
      route = '/orders';
    } else if (module.contains('attendance')) {
      route = '/attendance';
    }

    if (route != null) {
      NavigationService.instance.navigateTo(route);
    }
  }

  int get _unreadCount => _notifications.where((n) => n['is_read'] != true).length;

  _NotifStyle _getStyle(Map<String, dynamic> notif) {
    final module = (notif['module'] ?? notif['notification_type'] ?? notif['entity_type'] ?? '').toString().toLowerCase();
    final priority = (notif['priority'] ?? '').toString().toUpperCase();

    if (module.contains('enquir')) {
      return _NotifStyle(Icons.contact_page_outlined, const Color(0xFF3b82f6), const Color(0xFFeff6ff));
    }
    if (module.contains('service') || module.contains('complaint')) {
      return _NotifStyle(Icons.build_outlined, const Color(0xFFf59e0b), const Color(0xFFfffbeb));
    }
    if (module.contains('order')) {
      return _NotifStyle(Icons.receipt_long_outlined, const Color(0xFF8b5cf6), const Color(0xFFf5f3ff));
    }
    if (module.contains('attendance')) {
      return _NotifStyle(Icons.location_on_outlined, const Color(0xFF10b981), const Color(0xFFecfdf5));
    }
    if (module.contains('stock')) {
      return _NotifStyle(Icons.inventory_2_outlined, const Color(0xFFef4444), const Color(0xFFfef2f2));
    }
    if (priority == 'URGENT' || priority == 'CRITICAL' || priority == 'HIGH') {
      return _NotifStyle(Icons.priority_high_rounded, const Color(0xFFef4444), const Color(0xFFfef2f2));
    }
    return _NotifStyle(Icons.notifications_outlined, const Color(0xFF6366f1), const Color(0xFFeef2ff));
  }

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = _notifications.where((n) => n['is_read'] != true).toList();
    final all = _notifications;
    final read = _notifications.where((n) => n['is_read'] == true).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: Row(
          children: [
            const Text(
              'Notifications',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 20,
                color: Color(0xFF0f172a),
              ),
            ),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF3b82f6), Color(0xFF6366f1)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$_unreadCount new',
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ],
        ),
        iconTheme: const IconThemeData(color: Color(0xFF374151)),
        actions: [
          if (_unreadCount > 0)
            TextButton.icon(
              onPressed: _markingAll ? null : _markAllRead,
              icon: _markingAll
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.done_all, size: 18),
              label: const Text('Read all', style: TextStyle(fontSize: 13)),
            ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF3b82f6),
          unselectedLabelColor: const Color(0xFF94a3b8),
          indicatorColor: const Color(0xFF3b82f6),
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          tabs: [
            Tab(text: 'Unread (${unread.length})'),
            Tab(text: 'All (${all.length})'),
            Tab(text: 'Read (${read.length})'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildNotifList(unread, emptyIcon: Icons.celebration_outlined, emptyTitle: 'All caught up!', emptySubtitle: 'No unread notifications'),
                _buildNotifList(all, emptyIcon: Icons.notifications_off_outlined, emptyTitle: 'No notifications', emptySubtitle: 'Notifications will appear here'),
                _buildNotifList(read, emptyIcon: Icons.mark_email_read_outlined, emptyTitle: 'No read notifications', emptySubtitle: 'Read notifications appear here'),
              ],
            ),
    );
  }

  Widget _buildNotifList(
    List<Map<String, dynamic>> items, {
    required IconData emptyIcon,
    required String emptyTitle,
    required String emptySubtitle,
  }) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(emptyIcon, size: 72, color: const Color(0xFFcbd5e1)),
            const SizedBox(height: 16),
            Text(emptyTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
            const SizedBox(height: 6),
            Text(emptySubtitle, style: const TextStyle(fontSize: 14, color: Color(0xFF94a3b8))),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchNotifications,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final notif = items[index];
          final style = _getStyle(notif);
          final isRead = notif['is_read'] == true;
          final priority = (notif['priority'] ?? '').toString().toUpperCase();
          final isUrgent = priority == 'URGENT' || priority == 'HIGH' || priority == 'CRITICAL';

          return Dismissible(
            key: Key('notif-${notif['id']}'),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20),
              color: const Color(0xFF3b82f6),
              child: const Icon(Icons.done, color: Colors.white),
            ),
            onDismissed: (_) {
              _markAsRead(notif['id']);
              setState(() => items.removeAt(index));
            },
            child: InkWell(
              onTap: () => _onNotificationTap(notif),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isRead ? Colors.white : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isRead ? const Color(0xFFF1F5F9) : const Color(0xFFe2e8f0),
                    width: 1,
                  ),
                  boxShadow: isRead
                      ? []
                      : [
                          BoxShadow(
                            color: style.color.withValues(alpha: 0.06),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: style.bg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(style.icon, color: style.color, size: 22),
                    ),
                    const SizedBox(width: 12),
                    // Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  notif['title'] ?? 'Notification',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: isRead ? FontWeight.w500 : FontWeight.w600,
                                    color: const Color(0xFF0f172a),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (!isRead)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF3b82f6),
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF3b82f6).withValues(alpha: 0.3),
                                        blurRadius: 6,
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            notif['message'] ?? '',
                            style: TextStyle(
                              fontSize: 13,
                              color: isRead ? const Color(0xFF94a3b8) : const Color(0xFF64748b),
                              height: 1.4,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              // Module tag
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: style.bg,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  (notif['module'] ?? 'General').toString().replaceAll('_', ' '),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: style.color,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Time ago
                              Text(
                                _timeAgo(notif['created_at']),
                                style: const TextStyle(fontSize: 12, color: Color(0xFF94a3b8)),
                              ),
                              if (isUrgent) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFfef2f2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    '! URGENT',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFFef4444)),
                                  ),
                                ),
                              ],
                              const Spacer(),
                              Icon(
                                Icons.chevron_right,
                                size: 18,
                                color: Colors.grey.shade300,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _NotifStyle {
  final IconData icon;
  final Color color;
  final Color bg;
  const _NotifStyle(this.icon, this.color, this.bg);
}
