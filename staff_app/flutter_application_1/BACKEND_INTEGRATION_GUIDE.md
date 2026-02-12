# Backend Integration Guide: Keep Me Logged In & Role-Based Notifications

This document outlines the backend API changes required to support the new Flutter app features:
1. **Keep Me Logged In** with token refresh
2. **Role-Based Push Notifications** with FCM

---

## 🔐 FEATURE 1: KEEP ME LOGGED IN

### Overview
The app now supports persistent login sessions using secure token storage and automatic token refresh.

### Backend Changes Required

#### 1.1 Login Endpoint (UPDATED)

**Endpoint:** `POST /api/auth/login`

**Request (Form Data):**
```
username: string
password: string
fcm_token: string (optional) - Device FCM token for notifications
```

**Response (JSON):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",  // NEW: Required for token refresh
  "token_type": "bearer",
  "user": {
    "id": 7,
    "username": "john_salesman",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "salesman",
    "phone": "+919876543210",
    "is_active": true
  }
}
```

**Changes:**
- ✅ **CRITICAL:** Must return `refresh_token` (long-lived, 30 days recommended)
- ✅ `access_token` should be short-lived (15 minutes recommended)
- ✅ Accept optional `fcm_token` parameter and store it for notifications

#### 1.2 Token Refresh Endpoint (NEW)

**Endpoint:** `POST /api/auth/refresh`

**Request (JSON):**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (JSON):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",  // New access token
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...", // Optional: New refresh token (refresh token rotation)
  "token_type": "bearer"
}
```

**Implementation Notes:**
- Verify refresh token is valid and not expired
- Generate new access token
- Optionally implement refresh token rotation for enhanced security
- If refresh token is invalid/expired, return 401 Unauthorized

**Python/FastAPI Example:**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    # Verify refresh token
    try:
        payload = jwt.decode(
            request.refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        username = payload.get("sub")
        
        # Verify token type
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        # Generate new access token
        access_token = create_access_token(
            data={"sub": username, "type": "access"},
            expires_delta=timedelta(minutes=15)
        )
        
        # Optional: Generate new refresh token (rotation)
        new_refresh_token = create_access_token(
            data={"sub": username, "type": "refresh"},
            expires_delta=timedelta(days=30)
        )
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
```

#### 1.3 Logout Endpoint (UPDATED)

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Changes:**
- ✅ Invalidate access token (add to blacklist or delete from whitelist)
- ✅ Invalidate refresh token
- ✅ Clear FCM token for this user/device

---

## 🔔 FEATURE 2: ROLE-BASED NOTIFICATIONS

### Overview
The app uses Firebase Cloud Messaging (FCM) for push notifications with role-based routing and deep linking.

### Backend Changes Required

#### 2.1 Notification Data Model

**Database Table:** `notifications`

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    route VARCHAR(255) NOT NULL,  -- Deep link route (e.g., "/salesman/followups")
    reference_id INTEGER,         -- ID of related entity (enquiry, job, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    INDEX idx_is_read (is_read)
);
```

**Python/SQLAlchemy Model:**
```python
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    route = Column(String(255), nullable=False)
    reference_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")
```

#### 2.2 FCM Token Registration

**Endpoint:** `POST /api/notifications/register-token`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request (JSON):**
```json
{
  "fcm_token": "dKJz8fX4TkKm...",
  "user_id": 7,
  "role": "salesman"
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token registered"
}
```

**Implementation:**
- Store FCM token in `user_devices` table
- Associate token with user_id and device info
- Support multiple devices per user

**Database Table:** `user_devices`
```sql
CREATE TABLE user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    fcm_token VARCHAR(255) NOT NULL UNIQUE,
    device_type VARCHAR(50),  -- 'android' or 'ios'
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_fcm_token (fcm_token)
);
```

#### 2.3 Send Notification (Backend Helper Function)

**Python Example:**
```python
from firebase_admin import messaging
import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin SDK (do this once at startup)
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

async def send_notification_to_user(
    user_id: int,
    title: str,
    body: str,
    notification_type: str,
    route: str,
    reference_id: int = None
):
    """
    Send push notification to user and store in database
    """
    # 1. Get user and role
    user = await get_user_by_id(user_id)
    
    # 2. Create notification record in database
    notification = Notification(
        user_id=user_id,
        role=user.role,
        title=title,
        message=body,
        type=notification_type,
        route=route,
        reference_id=reference_id,
        is_read=False
    )
    db.add(notification)
    await db.commit()
    
    # 3. Get user's FCM tokens (support multiple devices)
    devices = await db.query(UserDevice).filter(
        UserDevice.user_id == user_id
    ).all()
    
    if not devices:
        print(f"No FCM tokens found for user {user_id}")
        return
    
    # 4. Send FCM push notification to all devices
    for device in devices:
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={
                    'title': title,
                    'body': body,
                    'type': notification_type,
                    'route': route,
                    'reference_id': str(reference_id) if reference_id else '',
                    'user_id': str(user_id),
                    'role': user.role,
                },
                token=device.fcm_token,
            )
            
            response = messaging.send(message)
            print(f"✅ Notification sent to device {device.id}: {response}")
        except Exception as e:
            print(f"❌ Failed to send to device {device.id}: {e}")
```

#### 2.4 Notification Examples by Role

**Admin Notifications:**
```python
# Salesman checked in
await send_notification_to_user(
    user_id=1,  # Admin user ID
    title="Salesman Check-In",
    body="John Doe checked in at Office",
    notification_type="SALESMAN_CHECKED_IN",
    route="/admin/attendance",
    reference_id=attendance_id
)

# New order created
await send_notification_to_user(
    user_id=1,
    title="New Order Pending",
    body="Order #1234 requires approval",
    notification_type="NEW_ORDER_CREATED",
    route="/admin/orders",
    reference_id=order_id
)
```

**Reception Notifications:**
```python
# New enquiry
await send_notification_to_user(
    user_id=3,  # Reception user ID
    title="New Enquiry",
    body="Customer Arun called about AC repair",
    notification_type="NEW_ENQUIRY",
    route="/reception/enquiries",
    reference_id=enquiry_id
)

# Follow-up due
await send_notification_to_user(
    user_id=3,
    title="Follow-up Due",
    body="Call Mrs. Sharma for pending quotation",
    notification_type="FOLLOW_UP_DUE",
    route="/reception/followups",
    reference_id=followup_id
)
```

**Salesman Notifications:**
```python
# Enquiry assigned
await send_notification_to_user(
    user_id=7,  # Salesman user ID
    title="New Enquiry Assigned",
    body="Visit customer Rajesh for AC installation",
    notification_type="ENQUIRY_ASSIGNED",
    route="/salesman/enquiries",
    reference_id=enquiry_id
)

# Follow-up reminder
await send_notification_to_user(
    user_id=7,
    title="Follow-up Reminder",
    body="Customer Arun - Quote sent, awaiting response",
    notification_type="FOLLOW_UP_REMINDER",
    route="/salesman/followups",
    reference_id=followup_id
)

# Order approved
await send_notification_to_user(
    user_id=7,
    title="Order Approved",
    body="Your order #1234 has been approved",
    notification_type="ORDER_APPROVED",
    route="/salesman/orders",
    reference_id=order_id
)
```

**Service Engineer Notifications:**
```python
# Job assigned
await send_notification_to_user(
    user_id=10,  # Engineer user ID
    title="New Job Assigned",
    body="AC repair at customer location - Priority: High",
    notification_type="JOB_ASSIGNED",
    route="/service/jobs",
    reference_id=job_id
)

# Job rescheduled
await send_notification_to_user(
    user_id=10,
    title="Job Rescheduled",
    body="Job #567 moved to tomorrow 2 PM",
    notification_type="JOB_RESCHEDULED",
    route="/service/jobs",
    reference_id=job_id
)
```

#### 2.5 Fetch Notifications API

**Endpoint:** `GET /api/notifications`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
?unread_only=true   // Optional: filter unread only
?limit=50           // Optional: pagination
?offset=0           // Optional: pagination
```

**Response:**
```json
[
  {
    "id": 101,
    "user_id": 7,
    "role": "salesman",
    "title": "New Follow-up Assigned",
    "message": "Customer Arun requires follow-up today",
    "type": "FOLLOW_UP_REMINDER",
    "route": "/salesman/followups",
    "reference_id": 12,
    "is_read": false,
    "created_at": "2026-01-13T20:15:00Z"
  }
]
```

#### 2.6 Mark as Read API

**Endpoint:** `PATCH /api/notifications/{notification_id}/read`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend Requirements

- [ ] Install Firebase Admin SDK: `pip install firebase-admin`
- [ ] Download Firebase service account JSON from Firebase Console
- [ ] Add `refresh_token` to login response
- [ ] Implement `/api/auth/refresh` endpoint
- [ ] Create `notifications` table
- [ ] Create `user_devices` table
- [ ] Implement `/api/notifications/register-token` endpoint
- [ ] Implement notification fetch and mark-as-read APIs
- [ ] Initialize Firebase Admin SDK on server startup
- [ ] Test token refresh flow
- [ ] Test FCM notification delivery

### Environment Variables

```env
# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

---

## 📱 TESTING GUIDE

### Test Keep Me Logged In

1. Login with checkbox checked
2. Close app completely
3. Reopen app → should auto-login to dashboard
4. Wait 15 minutes (access token expires)
5. Make API call → should auto-refresh token
6. Logout → should clear all data
7. Reopen app → should show login screen

### Test Notifications

1. **Foreground:** App open → notification arrives → banner shows
2. **Background:** App in background → tap notification → opens correct page
3. **Terminated:** App closed → tap notification → opens app → navigates to page
4. **Logged Out:** Notification arrives while logged out → tap → login → then navigate

---

## 🔧 TROUBLESHOOTING

### Token Refresh Not Working
- Verify `/api/auth/refresh` endpoint exists
- Check refresh token expiry (should be 30 days)
- Ensure refresh token is saved in login response

### Notifications Not Received
- Check FCM token is registered with backend
- Verify Firebase service account JSON is valid
- Check user has notification permissions
- Verify backend is sending correct payload format

### Deep Link Not Working
- Check `route` field in notification payload
- Verify route exists in `app_router.dart`
- Check user role has access to the route

---

## 📚 ADDITIONAL RESOURCES

- [Firebase Admin SDK Python](https://firebase.google.com/docs/admin/setup)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [JWT Refresh Tokens Best Practices](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)

---

**Last Updated:** January 14, 2026  
**Version:** 1.0
