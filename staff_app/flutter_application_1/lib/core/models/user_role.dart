/// User Role Enumeration
/// 
/// Defines all possible staff roles in the application
/// These should match the roles defined in your FastAPI backend
enum UserRole {
  admin('ADMIN'),
  reception('RECEPTION'),
  salesman('SALESMAN'),
  serviceEngineer('SERVICE_ENGINEER');
  
  final String value;
  const UserRole(this.value);
  
  /// Parse role from string (typically from JWT token)
  static UserRole? fromString(String? role) {
    if (role == null) return null;
    
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return UserRole.admin;
      case 'RECEPTION':
        return UserRole.reception;
      case 'SALESMAN':
        return UserRole.salesman;
      case 'SERVICE_ENGINEER':
      case 'SERVICE':
        return UserRole.serviceEngineer;
      default:
        return null;
    }
  }
  
  /// Check if role has admin privileges
  bool get isAdmin => this == UserRole.admin;
  
  /// Get display name for role
  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'Administrator';
      case UserRole.reception:
        return 'Reception';
      case UserRole.salesman:
        return 'Salesman';
      case UserRole.serviceEngineer:
        return 'Service Engineer';
    }
  }
}
