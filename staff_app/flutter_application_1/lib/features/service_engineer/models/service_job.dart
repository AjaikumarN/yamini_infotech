/// Service Job Model
/// 
/// Represents a service request/job assigned to a service engineer
class ServiceJob {
  final int id;
  final String? ticketNumber;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String address;
  final String description;
  final String status;
  final String priority;
  final String? productName;
  final String? modelNumber;
  final String? serialNumber;
  final DateTime createdAt;
  final DateTime? slaTime;
  final DateTime? completedAt;
  final String? resolutionNotes;
  final String? partsReplaced;
  final String? feedbackUrl;
  final String? feedbackQr;
  final Map<String, dynamic>? slaStatus;
  final String? type;
  final String? feedbackToken;
  final DateTime? assignedDate;
  final String? engineerName;
  final double? checkinLatitude;
  final double? checkinLongitude;
  final DateTime? checkinTime;

  ServiceJob({
    required this.id,
    this.ticketNumber,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    required this.address,
    required this.description,
    required this.status,
    required this.priority,
    this.productName,
    this.modelNumber,
    this.serialNumber,
    required this.createdAt,
    this.slaTime,
    this.completedAt,
    this.resolutionNotes,
    this.partsReplaced,
    this.feedbackUrl,
    this.feedbackQr,
    this.slaStatus,
    this.type,
    this.feedbackToken,
    this.assignedDate,
    this.engineerName,
    this.checkinLatitude,
    this.checkinLongitude,
    this.checkinTime,
  });

  factory ServiceJob.fromJson(Map<String, dynamic> json) {
    return ServiceJob(
      id: json['id'] ?? 0,
      ticketNumber: json['ticket_no'] ?? json['ticket_number'],
      customerName: json['customer_name'] ?? 'Unknown',
      customerPhone: json['phone'] ?? json['customer_phone'] ?? '',
      customerEmail: json['email'] ?? json['customer_email'],
      address: json['address'] ?? '',
      description: json['fault_description'] ?? json['description'] ?? '',
      status: json['status'] ?? 'PENDING',
      priority: json['priority'] ?? 'NORMAL',
      productName: json['product_name'],
      modelNumber: json['machine_model'] ?? json['model_number'],
      serialNumber: json['serial_number'],
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
      slaTime: json['sla_time'] != null 
          ? DateTime.parse(json['sla_time']) 
          : null,
      completedAt: json['completed_at'] != null 
          ? DateTime.parse(json['completed_at']) 
          : null,
      resolutionNotes: json['resolution_notes'],
      partsReplaced: json['parts_replaced'],
      feedbackUrl: json['feedback_url'],
      feedbackQr: json['feedback_qr'],
      slaStatus: json['sla_status'],
      type: json['type'],
      feedbackToken: json['feedback_token'],
      assignedDate: json['assigned_date'] != null 
          ? DateTime.parse(json['assigned_date']) 
          : null,
      engineerName: json['engineer_name'],
      checkinLatitude: json['checkin_latitude'] != null 
          ? (json['checkin_latitude'] as num).toDouble() 
          : null,
      checkinLongitude: json['checkin_longitude'] != null 
          ? (json['checkin_longitude'] as num).toDouble() 
          : null,
      checkinTime: json['checkin_time'] != null 
          ? DateTime.parse(json['checkin_time']) 
          : null,
    );
  }

  /// Check if SLA is breached
  bool get isSlaBreached {
    if (slaStatus != null) {
      return slaStatus!['status'] == 'BREACHED';
    }
    if (slaTime == null) return false;
    return DateTime.now().isAfter(slaTime!);
  }

  /// Check if SLA is warning (less than 2 hours remaining)
  bool get isSlaWarning {
    if (slaStatus != null) {
      return slaStatus!['status'] == 'WARNING';
    }
    if (slaTime == null) return false;
    final remaining = slaTime!.difference(DateTime.now());
    return remaining.inHours < 2 && remaining.inSeconds > 0;
  }

  /// Get remaining SLA time as string
  String get slaRemainingText {
    if (slaStatus != null && slaStatus!['remaining'] != null) {
      final seconds = slaStatus!['remaining'] as int;
      if (seconds <= 0) return 'BREACHED';
      final hours = seconds ~/ 3600;
      final minutes = (seconds % 3600) ~/ 60;
      return '${hours}h ${minutes}m';
    }
    if (slaTime == null) return 'N/A';
    final remaining = slaTime!.difference(DateTime.now());
    if (remaining.isNegative) return 'BREACHED';
    return '${remaining.inHours}h ${remaining.inMinutes % 60}m';
  }

  // Convenience getters for compatibility
  String? get customerAddress => address;
  String get fullName => customerName;
  DateTime? get slaDeadline => slaTime;
  
  String get assignedDateFormatted {
    if (assignedDate == null) return 'N/A';
    return '${assignedDate!.day}/${assignedDate!.month}/${assignedDate!.year}';
  }
  
  String get completedAtFormatted {
    if (completedAt == null) return 'N/A';
    return '${completedAt!.day}/${completedAt!.month}/${completedAt!.year} ${completedAt!.hour}:${completedAt!.minute.toString().padLeft(2, '0')}';
  }
}
