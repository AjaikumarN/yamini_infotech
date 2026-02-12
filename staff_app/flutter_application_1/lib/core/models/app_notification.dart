/// App Notification Model
/// 
/// Represents a notification in the ERP system
/// Includes routing information for deep linking
class AppNotification {
  final int id;
  final int userId;
  final String role;
  final String title;
  final String body;
  final String type;
  final String route;
  final int? referenceId;
  final bool isRead;
  final DateTime createdAt;
  
  AppNotification({
    required this.id,
    required this.userId,
    required this.role,
    required this.title,
    required this.body,
    required this.type,
    required this.route,
    this.referenceId,
    this.isRead = false,
    required this.createdAt,
  });
  
  /// Create from JSON
  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      role: json['role'] as String,
      title: json['title'] as String,
      body: json['message'] as String,
      type: json['type'] as String,
      route: json['route'] as String,
      referenceId: json['reference_id'] as int?,
      isRead: json['is_read'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
  
  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'role': role,
      'title': title,
      'message': body,
      'type': type,
      'route': route,
      'reference_id': referenceId,
      'is_read': isRead,
      'created_at': createdAt.toIso8601String(),
    };
  }
  
  /// Create from FCM notification payload
  factory AppNotification.fromFcmPayload(Map<String, dynamic> payload) {
    return AppNotification(
      id: 0, // Not available from FCM, will be fetched from backend
      userId: int.parse(payload['user_id'] ?? '0'),
      role: payload['role'] ?? '',
      title: payload['title'] ?? 'Notification',
      body: payload['body'] ?? '',
      type: payload['type'] ?? 'GENERAL',
      route: payload['route'] ?? '/',
      referenceId: int.tryParse(payload['reference_id'] ?? ''),
      isRead: false,
      createdAt: DateTime.now(),
    );
  }
  
  /// Copy with modifications
  AppNotification copyWith({
    int? id,
    int? userId,
    String? role,
    String? title,
    String? body,
    String? type,
    String? route,
    int? referenceId,
    bool? isRead,
    DateTime? createdAt,
  }) {
    return AppNotification(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      role: role ?? this.role,
      title: title ?? this.title,
      body: body ?? this.body,
      type: type ?? this.type,
      route: route ?? this.route,
      referenceId: referenceId ?? this.referenceId,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

/// Notification types by role
class NotificationType {
  // Admin notifications
  static const String SALESMAN_CHECKED_IN = 'SALESMAN_CHECKED_IN';
  static const String SALESMAN_INACTIVE = 'SALESMAN_INACTIVE';
  static const String NEW_ORDER_CREATED = 'NEW_ORDER_CREATED';
  static const String DAILY_SUMMARY = 'DAILY_SUMMARY';
  
  // Reception notifications
  static const String NEW_ENQUIRY = 'NEW_ENQUIRY';
  static const String FOLLOW_UP_DUE = 'FOLLOW_UP_DUE';
  static const String CALL_MISSED = 'CALL_MISSED';
  
  // Salesman notifications
  static const String ENQUIRY_ASSIGNED = 'ENQUIRY_ASSIGNED';
  static const String FOLLOW_UP_REMINDER = 'FOLLOW_UP_REMINDER';
  static const String ORDER_APPROVED = 'ORDER_APPROVED';
  
  // Service Engineer notifications
  static const String JOB_ASSIGNED = 'JOB_ASSIGNED';
  static const String JOB_RESCHEDULED = 'JOB_RESCHEDULED';
  static const String FEEDBACK_RECEIVED = 'FEEDBACK_RECEIVED';
  
  // General
  static const String GENERAL = 'GENERAL';
}
