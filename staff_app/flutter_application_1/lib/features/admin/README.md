# Admin Feature Module

This module contains all Admin-specific functionality.

## Structure

```
admin/
├── screens/          # UI screens for admin role
│   └── admin_dashboard_screen.dart
├── services/         # Admin-specific business logic (TODO)
├── widgets/          # Reusable admin widgets (TODO)
└── models/           # Admin-specific data models (TODO)
```

## Features to Implement

- User Management (CRUD operations)
- Role Assignment
- System Configuration
- Global Settings
- Reports and Analytics
- Audit Logs
- Staff Performance Tracking

## Adding New Screens

1. Create screen file in `screens/` directory
2. Add route in `lib/core/constants/route_constants.dart`
3. Register route in `lib/core/routing/app_router.dart`
4. Ensure route guard checks for Admin role

## API Integration

Admin-specific API endpoints are defined in:
`lib/core/constants/api_constants.dart`

## Notes

- Only users with `UserRole.admin` can access these screens
- Import your existing admin UI files into this directory
- Keep admin logic separated from other roles
