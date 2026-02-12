# Firebase Setup Checklist

## 🚨 CRITICAL: Firebase Configuration Required Before Running

The app **WILL NOT BUILD** until Firebase is properly configured. Follow these steps:

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: **"Yamini Infotech ERP"** (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

---

## Step 2: Add Android App

### 2.1 Register Android App

1. In Firebase Console, click "Add app" → Select Android icon
2. Enter package name: `com.yaminiinfotech.staff_app`
   - To verify: Check `android/app/build.gradle` → `applicationId`
3. App nickname: "Staff App Android"
4. SHA-1 certificate: (optional for now, required for production)
5. Click "Register app"

### 2.2 Download Configuration File

1. Download `google-services.json`
2. Place it at: `android/app/google-services.json`
3. **IMPORTANT:** This file must be committed to your repository

### 2.3 Verify File Location

```
android/
  app/
    google-services.json  ✅ Place here
    build.gradle
    src/
```

---

## Step 3: Add iOS App

### 3.1 Register iOS App

1. In Firebase Console, click "Add app" → Select iOS icon
2. Enter Bundle ID: `com.yaminiinfotech.staffApp`
   - To verify: Check `ios/Runner.xcodeproj/project.pbxproj` → search for `PRODUCT_BUNDLE_IDENTIFIER`
3. App nickname: "Staff App iOS"
4. App Store ID: (leave blank for now)
5. Click "Register app"

### 3.2 Download Configuration File

1. Download `GoogleService-Info.plist`
2. Place it at: `ios/Runner/GoogleService-Info.plist`

### 3.3 Add to Xcode Project

1. Open `ios/Runner.xcworkspace` in Xcode
2. Right-click on "Runner" folder
3. Select "Add Files to Runner"
4. Select `GoogleService-Info.plist`
5. **IMPORTANT:** Make sure "Copy items if needed" is checked
6. Click "Add"

### 3.4 Verify File Location

```
ios/
  Runner/
    GoogleService-Info.plist  ✅ Place here
    AppDelegate.swift
    Info.plist
```

---

## Step 4: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Select **Cloud Messaging** tab
3. Verify **Cloud Messaging API** is enabled
4. Copy **Server key** (you'll need this for backend)

---

## Step 5: Update Android Build Configuration

### 5.1 Project-level build.gradle

File: `android/build.gradle`

Add Google services classpath (should already be there):

```gradle
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:8.7.3'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
        classpath 'com.google.gms:google-services:4.4.2'  // Add this
    }
}
```

### 5.2 App-level build.gradle

File: `android/app/build.gradle`

Add Google services plugin at the **bottom** of the file:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'
apply from: "$flutterRoot/packages/flutter_tools/gradle/flutter.gradle"
apply plugin: 'com.google.gms.google-services'  // Add this

// ... rest of file ...
```

---

## Step 6: Verify Package Name

### Android

File: `android/app/build.gradle`

```gradle
android {
    defaultConfig {
        applicationId "com.yaminiinfotech.staff_app"  // Verify this matches Firebase
        // ...
    }
}
```

### iOS

File: `ios/Runner.xcodeproj/project.pbxproj`

Search for `PRODUCT_BUNDLE_IDENTIFIER` and verify:

```
PRODUCT_BUNDLE_IDENTIFIER = com.yaminiinfotech.staffApp;
```

---

## Step 7: Test Firebase Connection

Run these commands to verify setup:

```bash
# Clean and get dependencies
cd /Users/ajaikumarn/Desktop/erp/staff_app/flutter_application_1
flutter clean
flutter pub get

# Verify Android can find google-services.json
ls -la android/app/google-services.json

# Verify iOS can find GoogleService-Info.plist
ls -la ios/Runner/GoogleService-Info.plist

# Build Android (will fail if Firebase not configured)
flutter build apk --debug

# Build iOS (will fail if Firebase not configured)
flutter build ios --debug --no-codesign
```

---

## Step 8: Backend Configuration

### 8.1 Download Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json`
4. Place in backend directory (DO NOT commit to git)

### 8.2 Update Backend .env

Add to `yamini/backend/.env`:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccountKey.json
```

### 8.3 Install Firebase Admin SDK

```bash
cd /Users/ajaikumarn/Desktop/erp/yamini/backend
pip install firebase-admin
```

---

## ✅ Verification Checklist

Before running the app, verify:

- [ ] Firebase project created
- [ ] Android app registered in Firebase
- [ ] `android/app/google-services.json` exists
- [ ] iOS app registered in Firebase
- [ ] `ios/Runner/GoogleService-Info.plist` exists
- [ ] GoogleService-Info.plist added to Xcode project
- [ ] Cloud Messaging API enabled
- [ ] Package names match Firebase configuration
- [ ] Google services plugin applied in `android/app/build.gradle`
- [ ] Dependencies installed (`flutter pub get` ran successfully)
- [ ] Backend service account key downloaded
- [ ] Backend `.env` updated
- [ ] `firebase-admin` installed on backend

---

## 🐛 Common Issues

### "FirebaseApp is not initialized"

**Cause:** Firebase configuration files missing  
**Solution:** 
1. Verify `google-services.json` and `GoogleService-Info.plist` exist
2. Verify files are in correct locations
3. Run `flutter clean && flutter pub get`

### "Default FirebaseApp is not initialized"

**Cause:** Firebase not initialized in main.dart  
**Solution:** Already handled - check `lib/main.dart` line 16-17

### Android Build Fails with "google-services plugin not found"

**Cause:** Google services plugin not applied  
**Solution:**
1. Check `android/build.gradle` has `classpath 'com.google.gms:google-services:4.4.2'`
2. Check `android/app/build.gradle` has `apply plugin: 'com.google.gms.google-services'`

### iOS Build Fails with "GoogleService-Info.plist not found"

**Cause:** Plist file not added to Xcode project  
**Solution:**
1. Open `ios/Runner.xcworkspace` in Xcode
2. Drag `GoogleService-Info.plist` into Runner folder
3. Ensure "Copy items if needed" is checked

---

## 🔧 Alternative: FlutterFire CLI (Automated)

For automatic Firebase setup:

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Run FlutterFire configure
flutterfire configure
```

This will:
- Create Firebase project (if needed)
- Register Android/iOS apps
- Download configuration files
- Place them in correct locations

---

## 📱 Test Notifications

After setup is complete:

1. Run the app
2. Grant notification permissions
3. Login with "Keep me logged in" checked
4. Check terminal for FCM token
5. Use Firebase Console → Cloud Messaging → "Send test message"
6. Enter FCM token
7. Send notification
8. Verify notification appears on device

---

## 📞 Support

If you encounter issues:

1. Check [Firebase Flutter Docs](https://firebase.flutter.dev/docs/overview)
2. Check [FlutterFire Issues](https://github.com/firebase/flutterfire/issues)
3. Verify all files are in correct locations
4. Try `flutter clean && flutter pub get`

---

**Status:** ⚠️ Setup Required  
**Next Step:** Complete Steps 1-6 above  
**Estimated Time:** 15-20 minutes  
**Last Updated:** January 14, 2026
