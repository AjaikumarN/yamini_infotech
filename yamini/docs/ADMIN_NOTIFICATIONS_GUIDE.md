# Admin Notification System - Implementation Guide

## 🎯 Core Principle
**Every notification is a shortcut to a decision**

When admin clicks a notification → they land on:
- ✅ The EXACT page
- ✅ With the EXACT filter
- ✅ For immediate action

## 📋 How to Send Admin Notifications

### Backend Usage

```python
from notification_service import NotificationService
from notification_routes import NotificationType

# Example 1: New Service Request
NotificationService.notify_admin(
    db=db,
    notification_type=NotificationType.SERVICE_NEW,
    title="New Service Request",
    message=f"Ticket: {ticket_no} | Customer: {customer_name}",
    params=None  # Uses default route with filter
)

# Example 2: Service Completed (with ID)
NotificationService.notify_admin(
    db=db,
    notification_type=NotificationType.SERVICE_COMPLETED,
    title="Service Completed",
    message=f"Ticket: {ticket_no} | PDF Ready",
    params={"id": ticket_no}  # Routes to specific service detail
)

# Example 3: SLA Breach
NotificationService.notify_admin(
    db=db,
    notification_type=NotificationType.SERVICE_SLA_BREACHED,
    title="SLA Breached",
    message=f"Ticket: {ticket_no} | Engineer: {engineer_name}",
    params={"id": ticket_no}
)

# Example 4: HOT Enquiry
NotificationService.notify_admin(
    db=db,
    notification_type=NotificationType.ENQUIRY_HOT,
    title="HOT Enquiry Alert",
    message=f"Customer: {customer_name} | Immediate attention required",
    params=None
)
```

### When to Send Notifications

#### Enquiries & Sales
- ✅ **ENQUIRY_NEW**: When customer/reception creates enquiry
- ✅ **ENQUIRY_HOT**: When priority is HOT
- ✅ **ENQUIRY_CONVERTED**: When salesman converts to order
- ✅ **ENQUIRY_FOLLOWUP_MISSED**: When salesman misses follow-up

#### Service & SLA
- ✅ **SERVICE_NEW**: When customer submits service request
- ✅ **SERVICE_EMERGENCY**: When priority is CRITICAL/EMERGENCY
- ✅ **SERVICE_ASSIGNED**: When reception assigns engineer
- ✅ **SERVICE_SLA_RISK**: When SLA remaining < 25%
- ✅ **SERVICE_SLA_BREACHED**: When SLA time exceeded
- ✅ **SERVICE_COMPLETED**: When engineer completes job

#### Orders & Billing
- ✅ **ORDER_PENDING**: When order created (awaiting approval)
- ✅ **ORDER_APPROVED**: When admin approves order
- ✅ **INVOICE_CREATED**: When invoice generated
- ✅ **OUTSTANDING_ALERT**: When payment overdue

#### Employees & Productivity
- ✅ **ENGINEER_INACTIVE**: When engineer hasn't started assigned job
- ✅ **SALESMAN_INACTIVE**: When salesman has no activity today
- ✅ **ATTENDANCE_MISSING**: When employee doesn't mark attendance
- ✅ **LATE_ATTENDANCE**: When employee checks in after cutoff

#### System & Risk
- ✅ **REPEAT_COMPLAINTS**: Multiple issues from same customer
- ✅ **STOCK_CRITICAL**: Stock below threshold
- ✅ **SYSTEM_ERROR**: Critical system failure

## 🛠 Adding New Notification Types

### Step 1: Add to notification_routes.py

```python
class NotificationType(str, Enum):
    # ... existing types ...
    NEW_TYPE = "NEW_TYPE"  # Add new type

# Add to ROUTES map
ROUTES = {
    # ... existing routes ...
    NotificationType.NEW_TYPE: "/admin/your-page?filter=value",
}

# Add to PRIORITY_MAP
PRIORITY_MAP = {
    # ... existing priorities ...
    NotificationType.NEW_TYPE: "high",  # critical, high, medium, low
}

# Add to ICON_MAP
ICON_MAP = {
    # ... existing icons ...
    NotificationType.NEW_TYPE: "🎯",  # Choose relevant emoji
}
```

### Step 2: Send Notification in Your Code

```python
# In your router/service file
from notification_service import NotificationService
from notification_routes import NotificationType

NotificationService.notify_admin(
    db=db,
    notification_type=NotificationType.NEW_TYPE,
    title="Your Title",
    message="Your message with details",
    params={"id": record_id} if needed else None
)
```

### Step 3: Create Frontend Route (if new)

```jsx
// In App.jsx or routes file
<Route path="/admin/your-page" element={<YourPage />} />
```

## 🎨 Frontend Usage

### In React Components

```jsx
import { useNotificationRouter } from '../hooks/useNotificationRouter';

function NotificationBell() {
  const { handleNotificationClick, getPriorityColor } = useNotificationRouter();

  return (
    <div onClick={() => handleNotificationClick(notification)}>
      <div style={{ color: getPriorityColor(notification.priority) }}>
        {notification.title}
      </div>
    </div>
  );
}
```

## 📊 Notification Flow

```
[Event Occurs]
     ↓
[Backend: notification_service.py]
     ↓
[Uses: notification_routes.py to get URL]
     ↓
[Creates: Notification in DB with action_url]
     ↓
[Frontend: Fetches notification]
     ↓
[User: Clicks notification]
     ↓
[useNotificationRouter: Navigates to action_url]
     ↓
[Admin: Lands on exact page with filter]
```

## ✅ Validation Checklist

Before deploying notification:
- [ ] Does it route to a real page?
- [ ] Does the filter/parameter work?
- [ ] Is the priority appropriate?
- [ ] Is the icon descriptive?
- [ ] Does the message give enough context?
- [ ] Can admin take immediate action?

## 🚫 Anti-Patterns (Don't Do This)

❌ **Generic Route**
```python
action_url="/admin"  # BAD - where should admin go?
```

✅ **Specific Route**
```python
action_url="/admin/service/requests?filter=sla_risk"  # GOOD
```

❌ **No Context in Message**
```python
message="New service request"  # BAD - which one?
```

✅ **Full Context**
```python
message=f"Ticket: {ticket_no} | Customer: {name}"  # GOOD
```

❌ **Missing Parameters**
```python
params=None  # when route needs {id}
```

✅ **Required Parameters**
```python
params={"id": service_id}  # GOOD
```

## 📝 Example Implementation

See backend/routers/service_requests.py for complete example of service notifications.

---

**Remember**: Notifications are not messages. They are action shortcuts for busy admins.
