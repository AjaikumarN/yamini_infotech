# Architecture Overview

## Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN.DART                                │
│  • Initialize StorageService                                     │
│  • Initialize AuthService                                        │
│  • Setup MaterialApp with GoRouter                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SPLASH SCREEN                               │
│  • Check authentication status                                   │
│  • Decide initial route                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │         │
              Not Auth    Authenticated
                    │         │
                    ▼         ▼
             ┌──────────┐  ┌──────────────────────────────────┐
             │  LOGIN   │  │   ROLE-BASED DASHBOARD          │
             │  SCREEN  │  │   (via Route Guard)             │
             └─────┬────┘  └──────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  AuthService    │
         │  Login API Call │
         └────────┬────────┘
                  │
            Success ──────────────┐
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   Extract User & Role    │
                    │   from JWT/Response      │
                    └────────┬─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Route Guard    │
                    │  Check Role     │
                    └────┬────────────┘
                         │
         ┌───────────────┼───────────────┬──────────────┐
         │               │               │              │
         ▼               ▼               ▼              ▼
    ┌────────┐    ┌───────────┐   ┌──────────┐   ┌─────────┐
    │ ADMIN  │    │ RECEPTION │   │ SALESMAN │   │ SERVICE │
    │  /admin│    │ /reception│   │ /salesman│   │ /service│
    └────────┘    └───────────┘   └──────────┘   └─────────┘
```

## Role-Based Navigation

### Admin Routes
```
/admin
├── /admin/dashboard
├── /admin/users
├── /admin/settings
└── /admin/reports
```

### Reception Routes
```
/reception
├── /reception/dashboard
├── /reception/customers
├── /reception/appointments
└── /reception/checkin
```

### Salesman Routes
```
/salesman
├── /salesman/dashboard
├── /salesman/leads
├── /salesman/customers
├── /salesman/orders
└── /salesman/reports
```

### Service Engineer Routes
```
/service
├── /service/dashboard
├── /service/tickets
├── /service/schedule
└── /service/inventory
```

### Shared Routes (All Roles)
```
/profile
/notifications
/settings
/help
```

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
│  • Screens (role-based)                                      │
│  • Widgets (reusable components)                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │AuthService  │  │APIService   │  │StorageService│        │
│  │(ChangeNotify│  │(HTTP Client)│  │(SharedPrefs) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│  • Models (User, AuthResponse, etc.)                         │
│  • Constants (API endpoints, Routes)                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │  FastAPI      │
                │  BACKEND      │
                └───────────────┘
```

## Authentication Flow

```
┌─────────┐       ┌──────────┐       ┌──────────┐       ┌─────────┐
│ Login   │──────▶│  Auth    │──────▶│ FastAPI  │──────▶│ JWT     │
│ Screen  │       │ Service  │       │ Backend  │       │ Token   │
└─────────┘       └──────────┘       └──────────┘       └────┬────┘
                                                              │
                                                              ▼
                                                    ┌──────────────────┐
                                                    │ Store in         │
                                                    │ StorageService   │
                                                    └────────┬─────────┘
                                                             │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │ Decode JWT       │
                                                    │ Extract Role     │
                                                    │ Create User Model│
                                                    └────────┬─────────┘
                                                             │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │ Route Guard      │
                                                    │ Validates Access │
                                                    └────────┬─────────┘
                                                             │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │ Navigate to      │
                                                    │ Role Dashboard   │
                                                    └──────────────────┘
```

## State Management

```
Current: ChangeNotifier (AuthService)
├── Simple and built-in
├── Good for small to medium apps
└── Can be extended to Provider if needed

Optional Upgrades:
├── Provider: Dependency injection + ChangeNotifier
├── Riverpod: Modern, compile-safe state management
└── Bloc: Event-driven, complex state management
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  1. JWT Token Authentication                                │
│     • Token stored securely (SharedPreferences/SecureStorage)│
│     • Auto-injected in all API calls via ApiService         │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Route Guards (RouteGuard)                                │
│     • Check authentication before route access              │
│     • Validate role permissions for routes                  │
│     • Auto-redirect to login/unauthorized                   │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Backend Authorization                                    │
│     • FastAPI validates token on each request               │
│     • Role-based endpoints enforce permissions              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Example (Fetch Data)

```
Screen
  │
  ▼
AuthService/RoleService
  │
  ▼
ApiService.get()
  │  (adds auth token from StorageService)
  ▼
HTTP Request ──────▶ FastAPI Backend
  │                       │
  ◀───────────────────────┘
  │  (JSON Response)
  ▼
ApiService parses
  │
  ▼
Model.fromJson()
  │
  ▼
Return ApiResponse<Model>
  │
  ▼
Service updates state
  │
  ▼
Screen rebuilds with data
```

## Error Handling Strategy

```
API Error
  │
  ▼
ApiService catches
  │
  ├──▶ Network Error ──▶ "No internet connection"
  ├──▶ Timeout ────────▶ "Request timeout"
  ├──▶ 401 Unauthorized ▶ Clear auth, redirect to login
  ├──▶ 403 Forbidden ──▶ Show unauthorized screen
  ├──▶ 500 Server Error ▶ "Server error, try again"
  └──▶ Other ──────────▶ Generic error message
  │
  ▼
Return ApiResponse.error()
  │
  ▼
Service handles error
  │
  ▼
UI shows error
  (Snackbar/Dialog/ErrorWidget)
```

## Feature Addition Workflow

```
1. Define Feature
   │
   ▼
2. Create Models (if needed)
   │  lib/features/<role>/models/
   ▼
3. Add API Endpoints
   │  lib/core/constants/api_constants.dart
   ▼
4. Create Service (if complex logic)
   │  lib/features/<role>/services/
   ▼
5. Create Screens
   │  lib/features/<role>/screens/
   ▼
6. Add Routes
   │  • lib/core/constants/route_constants.dart
   │  • lib/core/routing/app_router.dart
   ▼
7. Create Widgets (if reusable)
   │  lib/features/<role>/widgets/
   ▼
8. Test Flow
   │
   ▼
9. Done ✅
```

## Scalability Considerations

- **Modular**: Each role is isolated, easy to add/remove
- **Service-Based**: Business logic separated from UI
- **Routing**: Centralized, easy to manage deep links
- **Type-Safe**: Models prevent runtime errors
- **Constants**: Easy to maintain endpoints and configs
- **Clean Separation**: Core vs Features structure

## Performance Optimization

- **Lazy Loading**: Screens loaded only when accessed
- **Caching**: StorageService for offline data (TODO)
- **State Management**: Minimal rebuilds with ChangeNotifier
- **API Efficiency**: Single HTTP client, connection pooling
- **Route Guards**: Fast auth checks before rendering

---

This architecture is designed to scale from MVP to production-ready ERP system.
