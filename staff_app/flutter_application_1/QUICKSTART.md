# Quick Start Guide

## ✅ Setup Complete!

Your Flutter Staff ERP application structure is now ready!

## What Has Been Created

### 1. Core Infrastructure ✅
- **Services**: API client, Authentication, Storage
- **Routing**: GoRouter with role-based guards
- **Models**: User, Role, API responses
- **Constants**: API endpoints, Routes, App config

### 2. Feature Modules ✅
- **Auth**: Login, Splash, Unauthorized screens
- **Admin**: Dashboard + infrastructure
- **Reception**: Dashboard + infrastructure
- **Salesman**: Dashboard + infrastructure
- **Service**: Dashboard + infrastructure
- **Shared**: Profile, Notifications, common widgets

### 3. Documentation ✅
- `lib/README.md`: Comprehensive project guide
- `ARCHITECTURE.md`: Architecture diagrams and flows
- Feature-specific README in each module

## Next Steps

### Step 1: Configure Backend URL

Open `lib/core/constants/api_constants.dart` and update:

```dart
static const String BASE_URL = 'https://your-actual-api.com/api';
```

### Step 2: Test the App

Run the app to see the structure:

```bash
flutter run
```

You'll see:
- Splash Screen → Login Screen flow
- Placeholder dashboards for each role

### Step 3: Import Your Existing UI Files

Copy your existing Dart files into the appropriate feature folders:

**Admin files** → `lib/features/admin/screens/`
**Reception files** → `lib/features/reception/screens/`
**Salesman files** → `lib/features/salesman/screens/`
**Service files** → `lib/features/service/screens/`
**Shared widgets** → `lib/features/shared/widgets/`

### Step 4: Wire Up Screens

After importing, add routes for new screens:

1. Add route constant in `lib/core/constants/route_constants.dart`
2. Register in `lib/core/routing/app_router.dart`
3. Navigate using `context.go()` or `context.push()`

### Step 5: Implement Login

Update `lib/features/auth/screens/login_screen.dart`:

```dart
// Example login implementation
ElevatedButton(
  onPressed: () async {
    final authService = AuthService.instance;
    final result = await authService.login(
      email: emailController.text,
      password: passwordController.text,
    );
    
    if (result.success) {
      // Navigation handled by route guard automatically
      context.go('/'); // Will redirect to role dashboard
    } else {
      // Show error
      UIHelpers.showError(context, result.message ?? 'Login failed');
    }
  },
  child: Text('Login'),
)
```

### Step 6: Add JWT Decoding (Optional but Recommended)

If your backend returns JWT token with user data:

1. Uncomment `jwt_decoder` in `pubspec.yaml`
2. Run `flutter pub get`
3. Update `AuthService.login()` to decode token:

```dart
import 'package:jwt_decoder/jwt_decoder.dart';

// In login method:
final decodedToken = JwtDecoder.decode(authData.accessToken);
final user = User.fromJson(decodedToken);
```

### Step 7: Add Secure Storage (Recommended)

For production, use secure storage for tokens:

1. Uncomment `flutter_secure_storage` in `pubspec.yaml`
2. Run `flutter pub get`
3. Update `StorageService` to use FlutterSecureStorage for tokens

## Project Structure Reference

```
lib/
├── core/                      # Core infrastructure
│   ├── constants/            # API, Routes, App constants
│   ├── models/               # User, Role, API responses
│   ├── routing/              # Router + Guards
│   ├── services/             # API, Auth, Storage
│   └── utils/                # Helpers, Validators
│
├── features/                  # Feature modules
│   ├── auth/                 # Authentication
│   ├── admin/                # Admin features
│   ├── reception/            # Reception features
│   ├── salesman/             # Salesman features
│   ├── service/              # Service features
│   └── shared/               # Shared components
│
└── main.dart                 # Entry point
```

## Common Tasks

### Add New API Endpoint

```dart
// lib/core/constants/api_constants.dart
static const String MY_ENDPOINT = '/path/to/endpoint';
```

### Make API Call

```dart
final response = await ApiService.instance.get<MyModel>(
  ApiConstants.MY_ENDPOINT,
  fromJson: (json) => MyModel.fromJson(json),
);

if (response.success) {
  final data = response.data;
  // Use data
} else {
  // Handle error
  print(response.message);
}
```

### Navigate Between Screens

```dart
// Using route names
context.go(RouteConstants.ADMIN_USERS);

// With parameters
context.push('/admin/users/123');

// Go back
context.pop();
```

### Access Current User

```dart
final authService = AuthService.instance;
final user = authService.currentUser;

if (user != null) {
  print('User: ${user.name}');
  print('Role: ${user.role.displayName}');
}
```

### Store/Retrieve Data

```dart
// Save
await StorageService.instance.setString('key', 'value');

// Retrieve
final value = StorageService.instance.getString('key');
```

## Testing Routes

You can test different roles by temporarily hardcoding in `AuthService`:

```dart
// For testing only - remove in production
_currentUser = User(
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.admin, // Change to test different roles
);
_isAuthenticated = true;
```

## Troubleshooting

### "Cannot find package"
Run: `flutter pub get`

### "Route not found"
Check that route is registered in `app_router.dart`

### "Unauthorized access"
Verify role in `route_guard.dart` matches user role

### API errors
- Check `BASE_URL` in `api_constants.dart`
- Verify backend is running
- Check network connectivity

## Important Files to Review

1. **lib/README.md** - Complete project documentation
2. **ARCHITECTURE.md** - Architecture diagrams
3. **lib/core/routing/app_router.dart** - All routes
4. **lib/core/services/auth_service.dart** - Auth logic
5. **lib/features/[role]/README.md** - Role-specific guides

## Production Checklist

Before deploying:

- [ ] Update `BASE_URL` to production API
- [ ] Remove debug print statements
- [ ] Set `debugShowCheckedModeBanner: false`
- [ ] Add error tracking (Sentry/Crashlytics)
- [ ] Implement proper JWT validation
- [ ] Use FlutterSecureStorage for tokens
- [ ] Add loading states for API calls
- [ ] Implement proper error handling
- [ ] Add analytics (if needed)
- [ ] Test all role flows
- [ ] Security audit

## Resources

- [Flutter Documentation](https://docs.flutter.dev/)
- [GoRouter Guide](https://pub.dev/packages/go_router)
- [HTTP Package](https://pub.dev/packages/http)
- [SharedPreferences](https://pub.dev/packages/shared_preferences)

---

**Need Help?**
- Check inline comments marked with `TODO`
- Review README files in each module
- Verify your FastAPI backend structure matches expected endpoints

**Happy Coding! 🚀**
