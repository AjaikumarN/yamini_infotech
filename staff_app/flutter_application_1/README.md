# Staff ERP Mobile App

**Version:** v1.0  
**Architecture:** Single backend, single database, role-based web and mobile clients.

## 🚀 NEW FEATURES (v1.0)

### 🔐 Keep Me Logged In
- Secure token-based authentication
- Automatic login on app restart
- Token auto-refresh (no interruptions)
- Complete data wipe on logout
- **See [USER_GUIDE.md](USER_GUIDE.md) for details**

### 🔔 Role-Based Push Notifications
- Firebase Cloud Messaging integration
- Real-time notifications by role
- Deep linking to specific pages
- Smart navigation (works when logged out)
- **See [USER_GUIDE.md](USER_GUIDE.md) for details**

---

## Tech Stack

- **Framework:** Flutter 3.10+
- **State Management:** StatefulWidget + ChangeNotifier
- **Routing:** go_router 14.6+ with deep linking
- **HTTP:** http package
- **Secure Storage:** flutter_secure_storage 9.2+
- **Push Notifications:** firebase_messaging 15.1+
- **Platforms:** Web, iOS, Android

## Roles Supported

| Role | Features |
|------|----------|
| **Admin** | Dashboard stats, View users, Sales & Service reports |
| **Reception** | Service requests, Assign engineers |
| **Salesman** | Enquiries, Follow-ups, Orders, Attendance, Location |
| **Engineer** | Jobs, Schedule, Check-in/out, Status updates |

## ⚠️ BEFORE RUNNING

### 1. Firebase Setup (REQUIRED)
The app requires Firebase for push notifications.

**Follow the complete guide:** [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

Quick checklist:
- [ ] Create Firebase project
- [ ] Add Android app → Download `google-services.json` → Place in `android/app/`
- [ ] Add iOS app → Download `GoogleService-Info.plist` → Place in `ios/Runner/`
- [ ] Enable Cloud Messaging API
- [ ] Run `flutter pub get`

### 2. Backend Setup
Ensure the FastAPI backend is running with the new features:

**Follow the backend guide:** [BACKEND_INTEGRATION_GUIDE.md](BACKEND_INTEGRATION_GUIDE.md)

Required endpoints:
- `POST /api/auth/login` - Must return `refresh_token`
- `POST /api/auth/refresh` - New endpoint for token refresh
- `POST /api/notifications/register-token` - New endpoint for FCM token
- `GET /api/notifications` - Fetch notifications
- `PATCH /api/notifications/{id}/read` - Mark as read

---

## How to Run

```bash
# Install dependencies
flutter pub get

# Run on device/simulator
# Web (NOT recommended - notifications won't work)
flutter run -d chrome

# iOS Simulator (recommended for testing)
flutter run -d ios

# Android Emulator (recommended for testing)
flutter run -d android

# Physical device (best for testing notifications)
flutter run
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [FIREBASE_SETUP.md](FIREBASE_SETUP.md) | **START HERE** - Complete Firebase configuration guide |
| [BACKEND_INTEGRATION_GUIDE.md](BACKEND_INTEGRATION_GUIDE.md) | Backend API implementation guide |
| [USER_GUIDE.md](USER_GUIDE.md) | End-user feature documentation |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Technical implementation details |
| [ARCHITECTURE.md](ARCHITECTURE.md) | App architecture and design patterns |
| [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) | Project structure explanation |

---

## Demo Flow

**With New Features:**

1. **First Launch**
   - Splash screen
   - Login screen
   - ✅ Check "Keep me logged in"
   - Enter credentials
   - Grant notification permissions
   - Redirected to role-based dashboard

2. **Subsequent Launches**
   - Splash screen
   - 🎉 **Auto-login** (no credentials needed)
   - Direct to dashboard

3. **Receiving Notifications**
   - Notification arrives
   - Tap notification
   - 🎉 **Auto-navigate** to relevant page

4. **Logout**
   - Tap logout
   - All data cleared
   - Next launch requires login

---
# Install dependencies
flutter pub get
# Web (recommended for demo)
flutter run -d chrome

# iOS Simulator
flutter run -d ios

# Android Emulator
flutter run -d android
```

## Demo Flow

1. **Splash** → Select Role
2. **Salesman** → Dashboard → Enquiries → Details
3. **Engineer** → Jobs → Check-in/out
4. **Reception** → Assign Engineer
5. **Admin** → Dashboard → Reports

## Project Structure

```
lib/
├── core/           # Constants, models, routing, services
├── features/
│   ├── admin/      # Admin dashboard, users, reports
│   ├── auth/       # Splash, login
│   ├── reception/  # Dashboard, service requests
│   ├── salesman/   # Full CRUD screens
│   └── service/    # Engineer jobs, schedule
└── main.dart
```

## Status

✅ Functionally complete  
✅ All 4 roles implemented  
✅ Mock data throughout (demo-ready)  
✅ Ready for backend wiring
