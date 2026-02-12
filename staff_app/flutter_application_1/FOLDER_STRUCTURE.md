# Folder Structure

```
flutter_application_1/
│
├── lib/
│   ├── core/                                    # Core application infrastructure
│   │   ├── constants/
│   │   │   ├── api_constants.dart              # API endpoints and config
│   │   │   ├── app_constants.dart              # App-wide constants
│   │   │   └── route_constants.dart            # Route paths
│   │   │
│   │   ├── models/
│   │   │   ├── api_response.dart               # Generic API response wrapper
│   │   │   ├── auth_response.dart              # Login response model
│   │   │   ├── user.dart                       # User data model
│   │   │   └── user_role.dart                  # Role enumeration
│   │   │
│   │   ├── routing/
│   │   │   ├── app_router.dart                 # GoRouter configuration
│   │   │   └── route_guard.dart                # Auth/Role guards
│   │   │
│   │   ├── services/
│   │   │   ├── api_service.dart                # HTTP client wrapper
│   │   │   ├── auth_service.dart               # Authentication logic
│   │   │   └── storage_service.dart            # Local storage
│   │   │
│   │   └── utils/
│   │       └── helpers.dart                    # Utility functions
│   │
│   ├── features/                                # Feature modules (role-based)
│   │   │
│   │   ├── auth/                               # Authentication feature
│   │   │   ├── screens/
│   │   │   │   ├── login_screen.dart
│   │   │   │   ├── splash_screen.dart
│   │   │   │   └── unauthorized_screen.dart
│   │   │   └── README.md
│   │   │
│   │   ├── admin/                              # Admin-only features
│   │   │   ├── screens/
│   │   │   │   └── admin_dashboard_screen.dart
│   │   │   ├── services/                       # (TODO: Add admin services)
│   │   │   ├── widgets/                        # (TODO: Add admin widgets)
│   │   │   ├── models/                         # (TODO: Add admin models)
│   │   │   └── README.md
│   │   │
│   │   ├── reception/                          # Reception-only features
│   │   │   ├── screens/
│   │   │   │   └── reception_dashboard_screen.dart
│   │   │   ├── services/                       # (TODO: Add reception services)
│   │   │   ├── widgets/                        # (TODO: Add reception widgets)
│   │   │   ├── models/                         # (TODO: Add reception models)
│   │   │   └── README.md
│   │   │
│   │   ├── salesman/                           # Salesman-only features
│   │   │   ├── screens/
│   │   │   │   └── salesman_dashboard_screen.dart
│   │   │   ├── services/                       # (TODO: Add salesman services)
│   │   │   ├── widgets/                        # (TODO: Add salesman widgets)
│   │   │   ├── models/                         # (TODO: Add salesman models)
│   │   │   └── README.md
│   │   │
│   │   ├── service/                            # Service Engineer features
│   │   │   ├── screens/
│   │   │   │   └── service_dashboard_screen.dart
│   │   │   ├── services/                       # (TODO: Add service services)
│   │   │   ├── widgets/                        # (TODO: Add service widgets)
│   │   │   ├── models/                         # (TODO: Add service models)
│   │   │   └── README.md
│   │   │
│   │   └── shared/                             # Shared across all roles
│   │       ├── screens/
│   │       │   ├── notifications_screen.dart
│   │       │   └── profile_screen.dart
│   │       ├── widgets/                        # (TODO: Add shared widgets)
│   │       ├── utils/                          # (TODO: Add shared utilities)
│   │       └── README.md
│   │
│   ├── main.dart                               # Application entry point
│   └── README.md                               # Project documentation
│
├── test/                                        # Unit and widget tests
│   └── widget_test.dart
│
├── android/                                     # Android platform files
├── ios/                                         # iOS platform files
├── linux/                                       # Linux platform files
├── macos/                                       # macOS platform files
├── web/                                         # Web platform files
├── windows/                                     # Windows platform files
│
├── pubspec.yaml                                # Dependencies
├── analysis_options.yaml                       # Linter rules
├── ARCHITECTURE.md                             # Architecture documentation
├── QUICKSTART.md                               # Quick start guide
└── README.md                                   # Project README

```

## File Counts

- **Core Files**: 12 files
- **Feature Screens**: 10 screens (placeholders)
- **Documentation**: 8 README/docs
- **Total Dart Files**: ~22 files created

## Key Directories

### Core (Infrastructure)
- `/lib/core/` - All shared infrastructure code
- Non-role-specific, reusable across the app

### Features (Business Logic)
- `/lib/features/` - All feature modules
- Role-based isolation (admin, reception, salesman, service)
- Shared features accessible to all roles

### Platform (Native)
- `/android/`, `/ios/`, etc. - Platform-specific configurations
- Not modified in this setup

## Import Paths Examples

```dart
// Core imports
import 'package:flutter_application_1/core/models/user.dart';
import 'package:flutter_application_1/core/services/auth_service.dart';
import 'package:flutter_application_1/core/constants/route_constants.dart';

// Feature imports
import 'package:flutter_application_1/features/admin/screens/admin_dashboard_screen.dart';
import 'package:flutter_application_1/features/auth/screens/login_screen.dart';

// Shared imports
import 'package:flutter_application_1/features/shared/screens/profile_screen.dart';
```

## Where to Add Your Files

| File Type | Location |
|-----------|----------|
| Admin screens | `lib/features/admin/screens/` |
| Admin services | `lib/features/admin/services/` |
| Admin widgets | `lib/features/admin/widgets/` |
| Reception screens | `lib/features/reception/screens/` |
| Salesman screens | `lib/features/salesman/screens/` |
| Service screens | `lib/features/service/screens/` |
| Shared widgets | `lib/features/shared/widgets/` |
| Shared utilities | `lib/features/shared/utils/` |
| Data models | `lib/features/<role>/models/` or `lib/core/models/` |
| API services | `lib/features/<role>/services/` |

## Notes

- ✅ Clean separation between core and features
- ✅ Role-based isolation prevents conflicts
- ✅ Shared folder for common components
- ✅ Scalable structure for large applications
- ✅ Easy to navigate and maintain
- ✅ Future-proof architecture

---

This structure follows Flutter best practices and Clean Architecture principles.
