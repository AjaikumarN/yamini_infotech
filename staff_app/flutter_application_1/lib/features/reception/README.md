# Reception Feature Module

This module contains all Reception-specific functionality.

## Structure

```
reception/
├── screens/          # UI screens for reception role
│   └── reception_dashboard_screen.dart
├── services/         # Reception-specific business logic (TODO)
├── widgets/          # Reusable reception widgets (TODO)
└── models/           # Reception-specific data models (TODO)
```

## Features to Implement

- Customer Check-in/Check-out
- Appointment Scheduling
- Visitor Management
- Customer Directory
- Daily Schedule View
- Walk-in Registration
- Queue Management

## Adding New Screens

1. Create screen file in `screens/` directory
2. Add route in `lib/core/constants/route_constants.dart`
3. Register route in `lib/core/routing/app_router.dart`
4. Ensure route guard checks for Reception role

## API Integration

Reception-specific API endpoints are defined in:
`lib/core/constants/api_constants.dart`

## Notes

- Only users with `UserRole.reception` can access these screens
- Import your existing reception UI files into this directory
- Keep reception logic separated from other roles
