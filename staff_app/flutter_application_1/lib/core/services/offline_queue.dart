import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dio_client.dart';

/// Offline queue for pending actions
///
/// When network is slow or unavailable:
/// - Queues POST/PUT requests locally
/// - Auto-syncs when connectivity returns
/// - Shows "pending sync" count to UI
class OfflineQueue extends ChangeNotifier {
  static OfflineQueue? _instance;
  static OfflineQueue get instance {
    _instance ??= OfflineQueue._();
    return _instance!;
  }

  final List<QueuedAction> _queue = [];
  bool _isSyncing = false;
  StreamSubscription? _connectivitySub;

  int get pendingCount => _queue.length;
  bool get hasPending => _queue.isNotEmpty;
  bool get isSyncing => _isSyncing;

  OfflineQueue._();

  /// Initialize - load persisted queue, listen for connectivity changes
  Future<void> init() async {
    await _loadQueue();
    _connectivitySub = Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      // Check if any result indicates connectivity
      final hasConnectivity = results.any((r) => r != ConnectivityResult.none);
      if (hasConnectivity && _queue.isNotEmpty) {
        syncAll();
      }
    });
  }

  /// Add an action to the queue
  Future<void> enqueue(QueuedAction action) async {
    _queue.add(action);
    await _persistQueue();
    notifyListeners();
    if (kDebugMode) {
      debugPrint('📥 Queued: ${action.method} ${action.path} (${_queue.length} pending)');
    }
  }

  /// Try to sync all queued actions
  Future<void> syncAll() async {
    if (_isSyncing || _queue.isEmpty) return;
    _isSyncing = true;
    notifyListeners();

    if (kDebugMode) debugPrint('🔄 Syncing ${_queue.length} queued actions...');

    final toRemove = <QueuedAction>[];

    for (final action in List.from(_queue)) {
      try {
        final client = DioClient.instance;
        if (action.method == 'POST') {
          await client.post(action.path, data: action.body);
        } else if (action.method == 'PUT') {
          await client.put(action.path, data: action.body);
        }
        toRemove.add(action);
        if (kDebugMode) {
          debugPrint('✅ Synced: ${action.method} ${action.path}');
        }
      } catch (e) {
        if (kDebugMode) {
          debugPrint('❌ Sync failed: ${action.method} ${action.path} - $e');
        }
        // Stop syncing on failure - will retry on next connectivity change
        break;
      }
    }

    _queue.removeWhere((a) => toRemove.contains(a));
    await _persistQueue();
    _isSyncing = false;
    notifyListeners();

    if (kDebugMode) {
      debugPrint('🔄 Sync complete. ${_queue.length} remaining.');
    }
  }

  /// Persist queue to SharedPreferences
  Future<void> _persistQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = _queue.map((a) => a.toJson()).toList();
      await prefs.setString('offline_queue', jsonEncode(encoded));
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Failed to persist queue: $e');
    }
  }

  /// Load queue from SharedPreferences
  Future<void> _loadQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('offline_queue');
      if (raw != null) {
        final List decoded = jsonDecode(raw);
        _queue.clear();
        _queue.addAll(decoded.map((e) => QueuedAction.fromJson(e)));
        if (_queue.isNotEmpty) {
          notifyListeners();
          if (kDebugMode) {
            debugPrint('📦 Loaded ${_queue.length} queued actions from disk');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) debugPrint('❌ Failed to load queue: $e');
    }
  }

  void dispose() {
    _connectivitySub?.cancel();
  }
}

/// A queued API action
class QueuedAction {
  final String method;
  final String path;
  final Map<String, dynamic>? body;
  final DateTime createdAt;

  QueuedAction({
    required this.method,
    required this.path,
    this.body,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'method': method,
        'path': path,
        'body': body,
        'createdAt': createdAt.toIso8601String(),
      };

  factory QueuedAction.fromJson(Map<String, dynamic> json) => QueuedAction(
        method: json['method'],
        path: json['path'],
        body: json['body'] as Map<String, dynamic>?,
        createdAt: DateTime.parse(json['createdAt']),
      );
}
