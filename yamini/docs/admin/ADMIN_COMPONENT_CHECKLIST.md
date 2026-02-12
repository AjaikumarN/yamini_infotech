# Admin Portal Component Development Checklist

## 🎨 Design System Foundation

### Color Tokens
```javascript
// Primary
--admin-bg: #F6F7F9           // Soft neutral gray background
--admin-surface: #FFFFFF       // White cards
--admin-primary: #3B82F6       // Corporate Blue (sparingly)

// Status Colors (Muted)
--status-success: #059669      // Muted Green
--status-warning: #D97706      // Amber
--status-critical: #DC2626     // Muted Red
--status-info: #0284C7         // Information Blue

// Typography
--text-primary: #1F2937        // Dark gray for main text
--text-secondary: #6B7280      // Medium gray for labels
--text-tertiary: #9CA3AF       // Light gray for meta

// Elevation
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1)
```

### Motion Tokens
```javascript
// Allowed animations only
--transition-fade: opacity 200ms ease
--transition-elevate: transform 150ms ease, box-shadow 150ms ease
--transition-count: 1500ms ease-out // For number count-up

// Forbidden: slide, bounce, rotate, scale (except 1.0→1.02 on hover)
```

---

## 📊 Dashboard Components

### ☑️ Executive KPI Bar
**File**: `src/admin/components/ExecutiveKPI.jsx`

**Props**:
- `icon` - Icon component or emoji
- `value` - Number to display
- `label` - Context text
- `trend` - "up" | "down" | "neutral"
- `trendValue` - Percentage change

**Styling Requirements**:
- [ ] Large horizontal card (wraps on mobile)
- [ ] Icon on left (40px × 40px)
- [ ] Number: 32px font, bold, count-up animation
- [ ] Label: 14px, medium gray
- [ ] Trend indicator: Small arrow with percentage
- [ ] Hover: Subtle elevation only (no color change)
- [ ] Responsive: Stack vertically on <640px

**Example**:
```jsx
<ExecutiveKPI 
  icon="📊"
  value={42}
  label="Enquiries Today"
  trend="up"
  trendValue="12%"
/>
```

---

### ☑️ Attention Required Panel
**File**: `src/admin/components/AttentionCard.jsx`

**Props**:
- `severity` - "critical" | "warning" | "info"
- `count` - Number
- `title` - Short description
- `link` - Navigation path
- `linkText` - "View" or custom

**Styling Requirements**:
- [ ] Left border: 4px solid (color by severity)
- [ ] Background: White with subtle gray border
- [ ] Emoji/icon left aligned
- [ ] Count: Bold, large (24px)
- [ ] Title: 14px medium
- [ ] "View" link: Corporate blue, underlined on hover only
- [ ] No click animation - fade opacity only

**Example**:
```jsx
<AttentionCard 
  severity="critical"
  count={3}
  title="SLA breaches need attention"
  link="/admin/sla"
  linkText="View Breaches"
/>
```

---

### ☑️ Operational Intelligence Charts
**File**: `src/admin/components/ChartCard.jsx`

**Requirements**:
- [ ] Use Chart.js or Recharts (not flashy libs)
- [ ] Muted color palette only
- [ ] No gradients, no 3D effects
- [ ] Grid lines: Light gray, subtle
- [ ] Tooltips: White card with shadow
- [ ] Animation: Fade-in only, no morphing

**Chart Types Needed**:
- [ ] Bar chart (sales trend)
- [ ] Donut chart (SLA compliance)
- [ ] Line chart (attendance punctuality)

---

### ☑️ Recent Activity Table
**File**: `src/admin/components/RecentActivityTable.jsx`

**Requirements**:
- [ ] Compact rows (40px height)
- [ ] Alternating row background: transparent / #F9FAFB
- [ ] No borders except header bottom
- [ ] Hover: Light gray background only
- [ ] Columns: Timestamp | Type | Description | User
- [ ] Max 10 rows, "View All" link at bottom

---

## 👥 Employee Management

### ☑️ Employee Card (Hybrid)
**File**: `src/admin/components/EmployeeCard.jsx`

**Props**:
- `employee` - Employee object
- `roleType` - "salesman" | "engineer" | "reception"
- `onViewDashboard` - Click handler

**Styling Requirements**:
- [ ] Desktop: Table row style (60px height)
- [ ] Mobile: Card style (rounded, padding)
- [ ] Avatar: 48px circle, initials fallback
- [ ] Name: 16px bold
- [ ] Role badge: Subtle background, 12px text
- [ ] Status pill: Small, colored dot + text
- [ ] Mini KPIs: 3 small metrics (icon + number)
- [ ] "View Dashboard" button: Primary style
- [ ] Hover: Elevation + border highlight (#E5E7EB → #3B82F6)

**Role-Specific Accents**:
- [ ] Salesmen: Blue accent (#3B82F6)
- [ ] Engineers: Green accent (#059669)
- [ ] Reception: Purple accent (#7C3AED)

---

### ☑️ Role Summary Bar
**File**: `src/admin/components/RoleSummaryBar.jsx`

**Requirements**:
- [ ] Horizontal strip above employee list
- [ ] 3-4 role-specific KPIs
- [ ] Icons match role theme
- [ ] Subtle background (role accent at 5% opacity)

---

### ☑️ Admin View Banner
**File**: `src/admin/components/AdminViewBanner.jsx` ✅ (Already implemented)

**Requirements**:
- [x] Non-dismissible
- [x] Gradient background (calm purple)
- [x] Eye emoji (👁️)
- [x] Clear context text
- [x] "Back to List" button (white on gradient)
- [x] Sticky position (top of viewport)
- [x] Responsive: Stack on mobile

---

## 📦 Product Management

### ☑️ Product Table
**File**: `src/admin/pages/Products.jsx`

**Requirements**:
- [ ] Clean table layout
- [ ] Thumbnail: 60px × 60px, rounded
- [ ] Columns: Image | Name + Model | Category | Price | Status | Actions
- [ ] Status pill: "Active" (green) / "Inactive" (gray)
- [ ] Actions: Icon-only (Edit ✏️, Toggle ⚡)
- [ ] Row hover: Background change only
- [ ] No zebra striping (clean white rows)

### ☑️ Add/Edit Product Modal
**File**: `src/admin/components/ProductModal.jsx`

**Requirements**:
- [ ] Two-column form (desktop)
- [ ] Single column (mobile)
- [ ] Image upload preview (large, centered)
- [ ] Required field indicators (*)
- [ ] Price input: ₹ prefix, formatted
- [ ] Category: Dropdown with search
- [ ] Save button: Primary (disabled until valid)
- [ ] Warning text: "This will update inventory"

---

## 📊 Stock Management

### ☑️ Stock Ledger Table
**File**: `src/admin/pages/StockManagement.jsx` ✅ (Already implemented)

**Requirements**:
- [x] Ledger-style rows (no visual noise)
- [x] Date column: DD/MM/YYYY format
- [x] Movement type badge: IN (green) / OUT (red)
- [x] Reason column: Wrapped text, gray
- [x] Changed by: Small text with user icon
- [ ] Sticky header on scroll
- [x] Responsive: Card view on mobile

### ☑️ Stock Action Modal
**File**: `src/admin/components/StockActionModal.jsx`

**Requirements**:
- [ ] Title: "Stock IN" or "Stock OUT" (bold, large)
- [ ] Product selector with search
- [ ] Quantity input: Large, centered
- [ ] Reason textarea: Mandatory
- [ ] Warning banner: "This action will be logged and cannot be undone"
- [ ] Confirm button: Disabled until reason provided
- [ ] No close on backdrop click

---

## 📋 Enquiries

### ☑️ Enquiry Card (Vertical List)
**File**: `src/admin/components/EnquiryCard.jsx`

**Requirements**:
- [ ] One enquiry per row (never grid)
- [ ] Left section: Customer name + product
- [ ] Center: Priority badge + status
- [ ] Right: Assigned salesman + timeline
- [ ] Timeline indicator: Progress bar or days count
- [ ] Actions: Dropdown menu (Assign, Change Priority)
- [ ] Hover: Slight elevation only

### ☑️ Enquiry Assignment Modal
**File**: `src/admin/components/AssignEnquiryModal.jsx`

**Requirements**:
- [ ] Salesman selector: Avatar + name list
- [ ] Current assignment highlighted
- [ ] Priority selector: Radio buttons (High, Medium, Low)
- [ ] Optional notes field
- [ ] Confirm button: "Assign Enquiry"

---

## 🛒 Orders

### ☑️ Order Table
**File**: `src/components/Orders.jsx` ✅ (Already responsive)

**Additional Requirements**:
- [ ] Order ID: Monospace font, clickable
- [ ] Amount: Bold, large
- [ ] Status pill: Color-coded, with icon
- [ ] Actions: Inline buttons (not dropdown)
  - [ ] Approve (green)
  - [ ] Reject (red)
  - [ ] Update (blue)
- [x] Mobile: Card view with full-width buttons

### ☑️ Order Action Modal
**File**: `src/admin/components/OrderActionModal.jsx`

**Requirements**:
- [ ] Modal title: "Approve Order #1234" (dynamic)
- [ ] Order summary section: Read-only card
  - [ ] Customer, product, amount, date
- [ ] Reason input: Textarea (optional for approve, required for reject)
- [ ] Warning text: "This action is logged and visible to the salesman"
- [ ] Confirm button: Changes text based on action
- [ ] Loading state: Spinner + disabled button

---

## 💰 Billing & Invoices

### ☑️ Invoice Table
**File**: `src/components/Invoices.jsx` ✅ (Already responsive)

**Additional Requirements**:
- [ ] Invoice number: Monospace, bold
- [ ] Paid/Balance columns: Color-coded
  - [ ] Fully paid: Green text
  - [ ] Partial: Amber text
  - [ ] Unpaid: Red text
- [ ] Actions: Icon buttons only
  - [ ] View (👁️)
  - [ ] Edit (✏️ - only if status = DRAFT)
  - [ ] Export (📄)

### ☑️ Invoice Detail View
**File**: `src/admin/components/InvoiceDetailView.jsx`

**Requirements**:
- [ ] Full-screen modal or dedicated page
- [ ] PDF-like layout (white background, black text)
- [ ] Header: Company logo + invoice details
- [ ] Line items: Clean table
- [ ] Subtotal, tax, total: Right-aligned, bold
- [ ] Print button: Opens browser print dialog
- [ ] Export PDF button: Downloads file

---

## 💳 Outstanding Collections

### ☑️ Outstanding Summary Cards
**File**: `src/admin/components/OutstandingSummary.jsx`

**Requirements**:
- [ ] 3 cards: Total | 30-60 days | 60+ days
- [ ] Large numbers with ₹ symbol
- [ ] Color escalation: Gray → Amber → Red
- [ ] Trend indicator below (optional)

### ☑️ Outstanding Table
**File**: `src/admin/pages/Outstanding.jsx`

**Requirements**:
- [ ] Customer column: Clickable to customer profile
- [ ] Invoice column: Links to invoice detail
- [ ] Balance: Bold, large, right-aligned
- [ ] Due days: Color-coded badge
  - [ ] 0-30 days: Gray
  - [ ] 31-60 days: Amber
  - [ ] 61+ days: Red
- [ ] Row color: Subtle background tint matches due days
- [ ] Sort by: Due days (descending) default

---

## 🛠 Service Requests

### ☑️ Service Request Table
**File**: `src/admin/pages/ServiceRequests.jsx`

**Requirements**:
- [ ] Ticket ID: Monospace, clickable
- [ ] Customer + Machine: Two-line cell
- [ ] Engineer: Avatar + name
- [ ] Status: Pill badge
- [ ] SLA Timer: Live countdown (updates every minute)
  - [ ] Green: >4 hours remaining
  - [ ] Amber: 1-4 hours
  - [ ] Red: <1 hour or breached
- [ ] Actions: "Assign Engineer" dropdown only

### ☑️ Assign Engineer Modal
**File**: `src/admin/components/AssignEngineerModal.jsx`

**Requirements**:
- [ ] Engineer list: Avatar + name + current load
- [ ] Load indicator: "3 active requests" (gray text)
- [ ] Availability badge: "Available" (green) / "Busy" (amber)
- [ ] Confirm button: "Assign to [Engineer Name]"

---

## ⏱ SLA Monitoring

### ☑️ SLA Dashboard
**File**: `src/admin/pages/service/SLAMonitoring.jsx` ✅ (Already responsive)

**Additional Requirements**:
- [ ] Compliance percentage: Large donut chart
- [ ] Breach count: Big red number
- [ ] Trend chart: Last 7 days compliance
- [ ] Breach list: Sorted by overdue duration (descending)
- [ ] High-risk visual indicator: Red left border on breached items

### ☑️ SLA Breach Card
**File**: `src/admin/components/SLABreachCard.jsx`

**Requirements**:
- [ ] Ticket number: Large, bold
- [ ] Overdue duration: Red text, count-up animation
- [ ] Customer name + machine model
- [ ] Engineer: Avatar + name with "Escalate" button
- [ ] Severity: Critical icon (🔴) always visible

---

## 📋 Machine Installation Forms (MIF)

### ☑️ MIF Table
**File**: `src/admin/pages/service/MIF.jsx` ✅ (Already responsive)

**Additional Requirements**:
- [ ] Document-style rows (formal feel)
- [ ] Serial number: Monospace font
- [ ] Warranty status: Badge with expiry date
- [ ] Actions: "View PDF" (primary) + "Edit" (if status = DRAFT)

### ☑️ MIF Form Modal
**File**: Already implemented in MIF.jsx ✅

**Additional Requirements**:
- [ ] Bottom sheet on mobile ✅
- [ ] Mandatory field warnings
- [ ] Date picker: Calendar UI
- [ ] Signature pad: Canvas for digital signature
- [ ] Save as draft / Finalize buttons (separate)

---

## 🕐 Attendance Management

### ☑️ Attendance Table
**File**: `src/admin/pages/Attendance.jsx` ✅ (Already responsive)

**Additional Requirements**:
- [ ] Summary cards: Present | Late | Absent
- [ ] Check-in time: Bold if late (>9:30 AM)
- [ ] Photo thumbnail: Clickable to fullscreen
- [ ] Status pill: Color-coded dot
- [ ] Actions: "Correct" / "Approve Late" / "Mark Leave"

### ☑️ Attendance Correction Modal
**File**: `src/admin/components/AttendanceCorrectModal.jsx`

**Requirements**:
- [ ] Employee name + photo at top
- [ ] Original status: Shown with strikethrough
- [ ] New status: Radio buttons
- [ ] Reason: Mandatory textarea
- [ ] Warning: "This correction will be visible in audit logs"
- [ ] Confirm button: "Submit Correction"

---

## 📈 Reports & Analytics

### ☑️ Report Selector
**File**: `src/admin/pages/Reports.jsx`

**Requirements**:
- [ ] Tab navigation: Sales | Service | Attendance | Inventory
- [ ] Date range picker: Preset options (Today, Week, Month, Custom)
- [ ] Export button: Top-right, always visible
- [ ] One major chart per tab (full width)
- [ ] Supporting data table below

### ☑️ Report Chart
**File**: `src/admin/components/ReportChart.jsx`

**Requirements**:
- [ ] Large canvas (min 400px height)
- [ ] Legend: Bottom or right side
- [ ] No animation on load (instant draw)
- [ ] Tooltip: White card with shadow
- [ ] Zoom/pan disabled (static view)

---

## 🧾 Audit Logs

### ☑️ Audit Timeline
**File**: `src/admin/pages/AuditLogs.jsx`

**Requirements**:
- [ ] Timeline-style vertical list
- [ ] Each entry: Card with left border (color by action type)
- [ ] Who: Avatar + name (bold)
- [ ] What: Action description (16px)
- [ ] When: Relative time + exact timestamp tooltip
- [ ] Why: Reason text (if provided, italic)
- [ ] No actions, no buttons - read-only
- [ ] Search: Filter by user, action type, date range
- [ ] Infinite scroll or pagination (load more)

---

## ⚙️ Settings

### ☑️ Settings Card Section
**File**: `src/admin/pages/Settings.jsx`

**Requirements**:
- [ ] Each section: White card with border
- [ ] Section title: Bold, 18px
- [ ] Form fields: Grouped logically
- [ ] Independent save button per section
- [ ] Success message: Green toast notification
- [ ] Confirmation modal for critical settings
  - [ ] Company name change
  - [ ] Threshold adjustments
  - [ ] Notification preferences

### ☑️ Settings Categories
- [ ] Company Details
- [ ] Role Permissions
- [ ] SLA Thresholds
- [ ] Notification Settings
- [ ] Attendance Rules
- [ ] Invoice Configuration

---

## 📱 Responsive Components

### ☑️ Mobile Sidebar
**File**: `src/admin/layout/AdminSidebar.jsx` ✅

**Requirements**:
- [x] Desktop: Fixed 280px sidebar
- [x] Tablet: Collapsible (icon button)
- [x] Mobile: Drawer overlay
- [x] Backdrop: Blur effect
- [x] Close on link click (mobile)

### ☑️ Mobile Table Cards
**Pattern**: Applied to all tables ✅

**Requirements**:
- [x] Breakpoint: <640px switches to cards
- [x] Card layout: Key info prominent
- [x] Action buttons: Full-width, stacked
- [x] Touch targets: Minimum 44px height

### ☑️ Bottom Sheet Modal
**File**: `src/admin/components/BottomSheet.jsx`

**Requirements**:
- [ ] Mobile: Slides from bottom
- [ ] Desktop: Centered modal
- [ ] Drag handle: Visible on mobile only
- [ ] Snap points: Half-screen / Full-screen
- [ ] Backdrop: Closes on tap

---

## 🎯 Animation Components

### ☑️ Count-Up Number
**File**: `src/admin/components/CountUp.jsx`

**Requirements**:
- [ ] Animates from 0 to target value
- [ ] Duration: 1500ms ease-out
- [ ] Decimal support: Optional
- [ ] Prefix/suffix: ₹, %, etc.
- [ ] Used in: KPI cards, dashboard stats

### ☑️ Fade-In Container
**File**: `src/admin/components/FadeIn.jsx`

**Requirements**:
- [ ] Opacity: 0 → 1
- [ ] Duration: 200ms
- [ ] Delay: Optional (stagger effect)
- [ ] Used for: Page loads, modal opens

### ☑️ Hover Elevation
**CSS Class**: `.hover-elevate`

**Requirements**:
```css
.hover-elevate {
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.hover-elevate:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

---

## 🚫 Forbidden UI Patterns

### ❌ DO NOT USE:
- [ ] ~~Skeleton loaders~~ → Use spinner or static placeholder
- [ ] ~~Confetti animations~~ → Not professional
- [ ] ~~Slide-in sidebars~~ → Use fade/overlay only
- [ ] ~~Bouncing buttons~~ → Static or subtle elevation only
- [ ] ~~Progress bars for actions~~ → Use spinners
- [ ] ~~Gradient backgrounds~~ → Solid colors only (except admin banner)
- [ ] ~~Icon-only buttons without tooltips~~ → Always label actions
- [ ] ~~Auto-dismissing messages~~ → User must click "Got it"

---

## ✅ Developer Acceptance Criteria

### Visual QA Checklist
- [ ] No visual noise (clean, minimal)
- [ ] Consistent spacing (8px grid system)
- [ ] Status colors muted (not bright/saturated)
- [ ] Typography hierarchy clear (3 sizes max per page)
- [ ] White space used generously
- [ ] Icons used sparingly (only when meaningful)

### Interaction QA Checklist
- [ ] All actions have confirmation (modals/toasts)
- [ ] Loading states for every async action
- [ ] Error messages are helpful, not technical
- [ ] Success feedback is subtle (not flashy)
- [ ] Keyboard navigation works (tab, enter, esc)
- [ ] No accidental clicks (proper button spacing)

### Responsive QA Checklist
- [ ] Mobile: No horizontal scroll
- [ ] Mobile: Touch targets ≥44px
- [ ] Tablet: Layouts adapt (not shrunk desktop)
- [ ] Desktop: No wasted space (proper max-width)
- [ ] All breakpoints tested: 320px, 768px, 1024px, 1920px

### Performance QA Checklist
- [ ] Tables: Virtualized if >100 rows
- [ ] Charts: Render time <500ms
- [ ] Images: Lazy loaded
- [ ] Animations: 60fps (no jank)
- [ ] Page load: <2s on 3G

---

## 📦 Component Library Structure

```
src/admin/
├── components/
│   ├── ExecutiveKPI.jsx
│   ├── AttentionCard.jsx
│   ├── ChartCard.jsx
│   ├── RecentActivityTable.jsx
│   ├── EmployeeCard.jsx
│   ├── RoleSummaryBar.jsx
│   ├── AdminViewBanner.jsx ✅
│   ├── ProductModal.jsx
│   ├── StockActionModal.jsx
│   ├── EnquiryCard.jsx
│   ├── AssignEnquiryModal.jsx
│   ├── OrderActionModal.jsx
│   ├── InvoiceDetailView.jsx
│   ├── OutstandingSummary.jsx
│   ├── AssignEngineerModal.jsx
│   ├── SLABreachCard.jsx
│   ├── AttendanceCorrectModal.jsx
│   ├── ReportChart.jsx
│   ├── BottomSheet.jsx
│   ├── CountUp.jsx
│   └── FadeIn.jsx
│
├── layout/
│   ├── AdminLayout.jsx ✅
│   └── AdminSidebar.jsx ✅
│
├── pages/
│   ├── Dashboard.jsx ✅
│   ├── EmployeeList.jsx ✅
│   ├── Products.jsx
│   ├── StockManagement.jsx ✅
│   ├── Enquiries.jsx
│   ├── Orders.jsx ✅
│   ├── Invoices.jsx ✅
│   ├── Outstanding.jsx
│   ├── ServiceRequests.jsx
│   ├── Reports.jsx
│   ├── Attendance.jsx ✅
│   ├── AuditLogs.jsx
│   ├── Settings.jsx
│   └── service/
│       ├── SLAMonitoring.jsx ✅
│       └── MIF.jsx ✅
│
└── styles/
    ├── admin-tokens.css
    ├── admin-animations.css
    └── admin-components.css
```

---

## 🏁 Implementation Priority

### Phase 1: Core Experience (Week 1)
- [x] Design tokens setup
- [x] Layout components (sidebar, topbar)
- [x] Dashboard with KPIs
- [x] Employee management (list, view)

### Phase 2: Operations (Week 2)
- [x] Orders & Invoices ✅
- [x] Stock Management ✅
- [x] Attendance ✅
- [ ] Enquiries
- [ ] Outstanding collections

### Phase 3: Service (Week 3)
- [x] SLA Monitoring ✅
- [x] MIF Forms ✅
- [ ] Service Requests
- [ ] Engineer assignment

### Phase 4: Analytics & Control (Week 4)
- [ ] Reports & charts
- [ ] Audit logs
- [ ] Settings & configuration
- [ ] Final polish & testing

---

## 📝 Final Notes for Developers

### Design Philosophy
> "Every pixel should communicate confidence, every interaction should feel deliberate, and every action should be accountable."

### Code Review Focus
1. **Does it feel calm?** No flashy animations or playful elements
2. **Is it accountable?** Every action logged and confirmable
3. **Is it responsive?** Works on all devices without compromise
4. **Is it accessible?** Keyboard nav, screen readers, proper contrast

### When in Doubt
- Less animation is better
- White space is good
- Confirmation modals are required
- User feedback is mandatory (loading, success, error)

---

**Status**: Component specification complete
**Last Updated**: December 27, 2025
**Maintained By**: Admin Portal Team
