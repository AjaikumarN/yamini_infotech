# Service Engineer Feature Module

This module contains all Service Engineer-specific functionality.

## Structure

```
service/
├── screens/          # UI screens for service engineer role
│   └── service_dashboard_screen.dart
├── services/         # Service-specific business logic (TODO)
├── widgets/          # Reusable service widgets (TODO)
└── models/           # Service-specific data models (TODO)
```

## Features to Implement

- Service Ticket Management
- Work Order Tracking
- Schedule Management
- Inventory Management
- Service Reports
- Customer Equipment History
- Parts Management
- Time Tracking

## Adding New Screens

1. Create screen file in `screens/` directory
2. Add route in `lib/core/constants/route_constants.dart`
3. Register route in `lib/core/routing/app_router.dart`
4. Ensure route guard checks for Service Engineer role

## API Integration

Service Engineer-specific API endpoints are defined in:
`lib/core/constants/api_constants.dart`

## Notes

- Only users with `UserRole.serviceEngineer` can access these screens
- Import your existing service UI files into this directory
- Keep service logic separated from other roles
