# Authentication Feature Module

This module handles user authentication and authorization.

## Structure

```
auth/
├── screens/          # Authentication-related screens
│   ├── splash_screen.dart
│   ├── login_screen.dart
│   └── unauthorized_screen.dart
└── widgets/          # Auth-specific widgets (TODO)
```

## Screens

- **Splash**: App initialization and auth check
- **Login**: Email/password authentication
- **Unauthorized**: Access denied page

## Features to Implement

- Login form with validation
- Remember me functionality
- Forgot password flow (if supported by backend)
- Biometric authentication (optional)
- Session timeout handling

## Integration Points

- Uses `AuthService` from `lib/core/services/`
- Integrates with routing via route guards
- Stores tokens using `StorageService`

## Notes

- JWT tokens are decoded to extract user role
- Role determines which dashboard user is redirected to after login
- All authentication logic is centralized in `AuthService`
