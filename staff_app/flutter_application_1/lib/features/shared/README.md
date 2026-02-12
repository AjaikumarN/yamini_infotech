# Shared Feature Module

This module contains functionality shared across all roles.

## Structure

```
shared/
├── screens/          # Screens accessible by all roles
│   ├── profile_screen.dart
│   └── notifications_screen.dart
├── widgets/          # Reusable widgets used across features (TODO)
└── utils/            # Shared utilities and helpers (TODO)
```

## Shared Screens

- **Profile**: User profile management (all roles)
- **Notifications**: System notifications (all roles)
- **Settings**: App settings (TODO)
- **Help**: Help and support (TODO)

## Shared Widgets to Add

- Custom buttons
- Form fields
- Cards
- Dialogs
- Loading indicators
- Empty states
- Error displays

## Shared Utilities to Add

- Date formatters
- Validators
- String helpers
- Number formatters
- File handlers

## Notes

- These components should be role-agnostic
- Keep shared code reusable and well-documented
- Avoid role-specific logic in shared components
