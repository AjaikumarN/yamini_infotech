# Staff ERP - Flutter Application

A role-based mobile application for staff management, built with Flutter.

## Overview

This is a staff-only mobile application designed for an ERP system with role-based access control. The app supports four distinct roles:
- **Admin**: System administration and configuration
- **Reception**: Customer management and appointments
- **Salesman**: Lead and sales management
- **Service Engineer**: Service tickets and work orders

## Architecture

### Folder Structure

```
lib/
├── core/                          # Core application infrastructure
│   ├── constants/                 # Application-wide constants
│   │   ├── api_constants.dart    # API endpoints and configuration
│   │   ├── app_constants.dart    # App-wide constants
│   │   └── route_constants.dart  # Route path definitions
│   ├── models/                    # Core data models
│   │   ├── user.dart             # User model
│   │   ├── user_role.dart        # Role enumeration
│   │   ├── auth_response.dart    # Authentication response
│   │   └── api_response.dart     # Generic API response wrapper
│   ├── routing/                   # Navigation and routing
│   │   ├── app_router.dart       # GoRouter configuration
│   │   └── route_guard.dart      # Authorization guards
│   └── services/                  # Core services
│       ├── api_service.dart      # HTTP client wrapper
│       ├── auth_service.dart     # Authentication logic
│       └── storage_service.dart  # Local storage management
│
├── features/                      # Feature modules (role-based)
│   ├── auth/                     # Authentication feature
│   │   └── screens/
│   │       ├── splash_screen.dart
│   │       ├── login_screen.dart
│   │       └── unauthorized_screen.dart
│   ├── admin/                    # Admin-specific features
│   │   ├── screens/
│   │   ├── services/             # (TODO)
│   │   ├── widgets/              # (TODO)
│   │   └── models/               # (TODO)
│   ├── reception/                # Reception-specific features
│   │   ├── screens/
│   │   ├── services/             # (TODO)
│   │   ├── widgets/              # (TODO)
│   │   └── models/               # (TODO)
│   ├── salesman/                 # Salesman-specific features
│   │   ├── screens/
│   │   ├── services/             # (TODO)
│   │   ├── widgets/              # (TODO)
│   │   └── models/               # (TODO)
│   ├── service/                  # Service Engineer features
│   │   ├── screens/
│   │   ├── services/             # (TODO)
│   │   ├── widgets/              # (TODO)
│   │   └── models/               # (TODO)
│   └── shared/                   # Shared across all roles
│       ├── screens/
│       ├── widgets/              # (TODO)
│       └── utils/                # (TODO)
│
└── main.dart                      # Application entry point
```

## Key Features

### Implemented ✅

- **Clean Architecture**: Separation of concerns with clear folder structure
- **Role-Based Access Control**: Route guards for role-specific navigation
- **Centralized Routing**: GoRouter with authentication and authorization
- **Service Layer**: API, Auth, and Storage services ready for integration
- **Type-Safe Models**: User, Role, and API response models
- **Constants Management**: Centralized API endpoints and app constants
- **Session Management**: Token storage and authentication state

### To Be Implemented 🔧

- UI screens for each role (placeholders provided)
- API integration with FastAPI backend
- JWT token decoding and validation
- Form validation
- Error handling and user feedback
- Offline support (optional)
- Push notifications (optional)

## Getting Started

### Prerequisites

- Flutter SDK (>=3.10.7)
- Dart SDK
- Android Studio / VS Code
- Connected device or emulator

### Installation

1. **Clone the repository** (or you've already created it)

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Configure API endpoint**:
   - Open `lib/core/constants/api_constants.dart`
   - Update `BASE_URL` with your FastAPI backend URL

4. **Run the app**:
   ```bash
   flutter run
   ```

## Configuration

### API Configuration

Update the following in `lib/core/constants/api_constants.dart`:

```dart
static const String BASE_URL = 'https://your-api-domain.com/api';
```

Add your specific API endpoints as needed.

### Authentication Flow

1. User opens app → **Splash Screen** (service initialization)
2. Not authenticated → **Login Screen**
3. Successful login → Token stored, user data extracted
4. **Route Guard** checks role
5. Redirect to role-specific dashboard:
   - Admin → `/admin/dashboard`
   - Reception → `/reception/dashboard`
   - Salesman → `/salesman/dashboard`
   - Service Engineer → `/service/dashboard`

### Adding New Features

#### Adding a New Screen

1. Create screen file in appropriate feature folder:
   ```
   lib/features/<role>/screens/new_screen.dart
   ```

2. Add route constant:
   ```dart
   // lib/core/constants/route_constants.dart
   static const String ADMIN_NEW_FEATURE = '/admin/new-feature';
   ```

3. Register route in router:
   ```dart
   // lib/core/routing/app_router.dart
   GoRoute(
     path: RouteConstants.ADMIN_NEW_FEATURE,
     name: 'admin_new_feature',
     builder: (context, state) => const NewFeatureScreen(),
   ),
   ```

#### Adding API Endpoints

```dart
// lib/core/constants/api_constants.dart
static const String NEW_ENDPOINT = '/path/to/endpoint';
```

#### Creating Services

Create role-specific services in:
```
lib/features/<role>/services/
```

Use `ApiService` for HTTP calls:
```dart
final response = await ApiService.instance.get<YourModel>(
  ApiConstants.YOUR_ENDPOINT,
  fromJson: (json) => YourModel.fromJson(json),
);
```

## Dependencies

### Essential (Already Added)
- `go_router`: ^14.6.2 - Declarative routing
- `http`: ^1.2.2 - HTTP client
- `shared_preferences`: ^2.3.3 - Local storage

### Recommended (Commented Out)
- `flutter_secure_storage`: For sensitive data (tokens)
- `provider` or `riverpod`: State management
- `intl`: Date/Time formatting
- `jwt_decoder`: JWT token parsing

Uncomment in `pubspec.yaml` and run `flutter pub get` to add them.

## Project Principles

1. **Single Responsibility**: Each file has one clear purpose
2. **Separation of Concerns**: Business logic separate from UI
3. **DRY**: Reusable components in shared/ folder
4. **Type Safety**: Strong typing with proper models
5. **Scalability**: Easy to add new features without refactoring
6. **Security**: Role-based access control at routing level

## Next Steps

1. **Backend Integration**:
   - Update API endpoints in `api_constants.dart`
   - Implement JWT decoding in `auth_service.dart`
   - Test login flow with actual API

2. **UI Development**:
   - Replace placeholder screens with actual UI
   - Import your existing Dart/UI files into appropriate feature folders
   - Create reusable widgets in `shared/widgets/`

3. **Testing**:
   - Unit tests for services
   - Widget tests for screens
   - Integration tests for flows

4. **Production Readiness**:
   - Error tracking (Sentry, Crashlytics)
   - Analytics integration
   - Performance optimization
   - Security audit

## Notes

- **DO NOT** modify backend logic or APIs in this app
- **DO NOT** assume Firebase unless explicitly needed
- Each role has isolated routes and features
- Existing UI files should be imported into feature folders
- Route guards prevent unauthorized access automatically

## Support

For issues or questions:
- Check README files in each feature folder
- Review inline code comments marked with TODO
- Ensure API endpoints match your backend structure

---

**Version**: 1.0.0  
**Last Updated**: January 10, 2026  
**Architecture**: Clean Architecture + Feature-based  
**State Management**: ChangeNotifier (expandable)
