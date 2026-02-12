# Flutter ERP App - User Features Guide

## 🔐 Keep Me Logged In

### Overview
Stay signed in to the app even after closing it completely. No need to enter credentials every time!

### How It Works

#### First Login
1. Open the app
2. Enter your username and password
3. ✅ **Check the "Keep me logged in" checkbox**
4. Tap "Sign In"
5. You'll be redirected to your dashboard

#### Automatic Login
- Close the app completely
- Reopen the app
- 🎉 **You're automatically logged in!**
- Goes directly to your role-based dashboard

#### Security Features
- Your password is **never** stored
- Only encrypted tokens are saved
- Tokens are stored in device keychain (iOS) or Keystore (Android)
- Automatic token refresh when expired
- Complete data wipe on logout

#### When to Use
✅ **Use "Keep Me Logged In":**
- On your personal device
- For convenience and quick access
- When you trust the device security

❌ **Don't Use "Keep Me Logged In":**
- On shared/public devices
- On borrowed phones
- If device is not password-protected

#### Logout
To completely sign out:
1. Go to your dashboard
2. Tap the menu icon
3. Select "Logout"
4. All your data will be cleared
5. You'll be redirected to login screen

---

## 🔔 Push Notifications

### Overview
Receive real-time notifications about important events based on your role. Tap notifications to go directly to the relevant page.

### Notification Types by Role

#### 👨‍💼 Admin
- **Salesman Check-In:** When a salesman marks attendance
- **Salesman Inactive:** When a salesman hasn't checked in
- **New Order:** When a new order is placed
- **Daily Summary:** End-of-day reports

#### 📞 Reception
- **New Enquiry:** When a customer calls
- **Follow-Up Due:** Reminder to call customers
- **Call Missed:** When important calls need attention

#### 💼 Salesman
- **Enquiry Assigned:** New customer visit assigned
- **Follow-Up Reminder:** Customer needs follow-up
- **Order Approved:** Your order has been approved

#### 🔧 Service Engineer
- **Job Assigned:** New service job assigned
- **Job Rescheduled:** Job timing changed
- **Feedback Received:** Customer left feedback

### How Notifications Work

#### Receiving Notifications

**App is Open (Foreground):**
- Notification appears as banner at top
- Stays in notification list
- Can tap to navigate

**App in Background:**
- Notification appears in system tray
- Tap notification → opens app → goes to relevant page

**App Closed Completely:**
- Notification appears in system tray
- Tap notification → opens app → goes to relevant page

#### Notification Permissions
On first launch, the app will ask for notification permission:
- **iOS:** "Allow notifications?" → Tap "Allow"
- **Android:** "Allow notifications?" → Tap "Allow"

Without permission, you won't receive push notifications!

#### Deep Linking (Smart Navigation)

When you tap a notification:
1. **If logged in:** Opens the relevant page directly
   - Example: "New Follow-up" → Opens Follow-ups page
   
2. **If logged out:** 
   - Opens login screen
   - After login → automatically navigates to the notification page

### Managing Notifications

#### View All Notifications
1. Open the app
2. Tap the bell icon in header
3. See all your notifications
4. Tap any notification to navigate

#### Mark as Read
- Tap a notification to mark it as read
- Read notifications appear dimmed

#### Notification Settings
- Enable/disable in device settings
- App Settings → Notifications → Toggle on/off

---

## 🔒 Security & Privacy

### Data Storage
- **Tokens:** Encrypted in device keychain/keystore
- **User Data:** Encrypted at rest
- **Notifications:** Stored in database, cleared on logout

### Auto-Logout
The app will automatically log you out if:
- You manually log out
- Token refresh fails (after 30 days)
- You clear app data

### Token Refresh
- Access tokens expire after 15 minutes
- Refresh tokens last 30 days
- Auto-refresh happens in background
- No interruption to your work

---

## ❓ FAQ

### Keep Me Logged In

**Q: Is "Keep Me Logged In" safe?**  
A: Yes, if your device is password-protected. Tokens are encrypted and stored in device keychain.

**Q: How long does login persist?**  
A: Up to 30 days. After that, you'll need to login again.

**Q: What if I forget to logout on a shared device?**  
A: You can logout remotely (feature coming soon). For now, ask someone to logout for you.

**Q: Does it work after phone restart?**  
A: Yes! Login persists even after device reboot.

**Q: What if I uninstall the app?**  
A: All data is cleared. You'll need to login again after reinstalling.

### Notifications

**Q: Why am I not receiving notifications?**  
A: Check:
- Notification permission is granted
- Internet connection is active
- You're logged in to the app
- Backend server is running

**Q: Can I disable specific notification types?**  
A: Not yet. Currently it's all or nothing. Feature coming in next update.

**Q: Do notifications work offline?**  
A: No. Notifications require internet connection.

**Q: What happens to notifications when logged out?**  
A: They're saved. After login, you can view all past notifications.

**Q: Can I get notifications on multiple devices?**  
A: Yes! Login on each device with "Keep Me Logged In" enabled.

---

## 🐛 Troubleshooting

### "Keep Me Logged In" Issues

**Problem:** App doesn't auto-login after restart  
**Solution:**
1. Check if "Keep Me Logged In" was checked during login
2. Verify you didn't manually logout
3. Check if 30 days have passed (token expired)
4. Try logging in again with checkbox checked

**Problem:** "Session expired" message  
**Solution:**
- Tokens expire after 30 days
- This is normal security behavior
- Just login again

### Notification Issues

**Problem:** Not receiving notifications  
**Solution:**
1. Check notification permissions:
   - iOS: Settings → App → Notifications → Allow
   - Android: Settings → Apps → App → Notifications → On
2. Ensure you're logged in
3. Check internet connection
4. Contact admin if issue persists

**Problem:** Notification doesn't open correct page  
**Solution:**
- This is a backend issue
- Contact your system administrator
- They need to check notification payload

**Problem:** Notification appears but doesn't navigate  
**Solution:**
1. Ensure you're logged in
2. Check you have permission to access that page
3. Try tapping the notification again

---

## 📞 Support

For technical issues:
- Contact: IT Support
- Email: support@yaminiinfotech.com
- Phone: +91-XXXX-XXXX

For feature requests:
- Submit through app feedback form
- Or email: feedback@yaminiinfotech.com

---

**Last Updated:** January 14, 2026  
**Version:** 1.0  
**App Version:** 1.0.0+1
