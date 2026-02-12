# Salesman Feature Module

This module contains all Salesman-specific functionality.

## Structure

```
salesman/
├── screens/          # UI screens for salesman role
│   └── salesman_dashboard_screen.dart
├── services/         # Salesman-specific business logic (TODO)
├── widgets/          # Reusable salesman widgets (TODO)
└── models/           # Salesman-specific data models (TODO)
```

## Features to Implement

- Lead Management
- Customer Pipeline
- Sales Order Processing
- Quotation Management
- Target Tracking
- Commission Calculation
- Sales Reports
- Customer Interaction History

## Adding New Screens

1. Create screen file in `screens/` directory
2. Add route in `lib/core/constants/route_constants.dart`
3. Register route in `lib/core/routing/app_router.dart`
4. Ensure route guard checks for Salesman role

## API Integration

Salesman-specific API endpoints are defined in:
`lib/core/constants/api_constants.dart`

## Notes

- Only users with `UserRole.salesman` can access these screens
- Import your existing salesman UI files into this directory
- Keep salesman logic separated from other roles
