import 'user_role.dart';

/// User Model
/// 
/// Represents a staff user in the application
/// This model is populated from JWT token payload after successful login
/// 
/// TODO: Add additional fields based on your backend user structure
class User {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String? phone;
  final String? profileImage;
  final DateTime? lastLogin;
  final Map<String, dynamic>? metadata;
  
  const User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.profileImage,
    this.lastLogin,
    this.metadata,
  });
  
  /// Create User from JSON (typically from API response or JWT payload)
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? json['user_id']?.toString() ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? json['full_name'] ?? '',
      role: UserRole.fromString(json['role']) ?? UserRole.reception,
      phone: json['phone'],
      profileImage: json['photograph'] ?? json['profile_image'] ?? json['avatar'],
      lastLogin: json['last_login'] != null 
          ? DateTime.tryParse(json['last_login']) 
          : null,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
  
  /// Convert User to JSON (for storage)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role.value,
      'phone': phone,
      'profile_image': profileImage,
      'last_login': lastLogin?.toIso8601String(),
      'metadata': metadata,
    };
  }
  
  /// Create a copy with updated fields
  User copyWith({
    String? id,
    String? email,
    String? name,
    UserRole? role,
    String? phone,
    String? profileImage,
    DateTime? lastLogin,
    Map<String, dynamic>? metadata,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      profileImage: profileImage ?? this.profileImage,
      lastLogin: lastLogin ?? this.lastLogin,
      metadata: metadata ?? this.metadata,
    );
  }
  
  @override
  String toString() => 'User(id: $id, email: $email, role: ${role.value})';
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.id == id;
  }
  
  @override
  int get hashCode => id.hashCode;
}
