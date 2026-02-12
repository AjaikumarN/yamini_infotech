# Able Pro ERP UI System - Complete Design Guide

## 📋 Table of Contents
1. [Design System Overview](#design-system-overview)
2. [Component Library](#component-library)
3. [Role-Specific Dashboards](#role-specific-dashboards)
4. [Implementation Guide](#implementation-guide)
5. [Figma Design Tokens](#figma-design-tokens)

---

## 🎨 Design System Overview

### Core Principles
- **Professional B2B Aesthetic**: Clean, modern, trustworthy
- **Data-Driven**: KPI-focused with clear metrics
- **Mobile-Responsive**: Graceful degradation on all devices
- **Consistent Spacing**: 8px base grid system
- **Subtle Interactions**: Smooth transitions, hover effects

### Color Palette

```javascript
const colors = {
  // Primary - Indigo/Blue (Trust, Professionalism)
  primary: {
    main: '#6366f1',    // Primary actions, links
    light: '#818cf8',   // Hover states
    dark: '#4f46e5',    // Active states
    bg: '#eef2ff'       // Backgrounds
  },
  
  // Success - Green (Positive metrics, confirmations)
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    bg: '#d1fae5'
  },
  
  // Warning - Amber (Alerts, pending items)
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    bg: '#fef3c7'
  },
  
  // Danger - Red (Errors, urgent items)
  danger: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    bg: '#fee2e2'
  },
  
  // Info - Blue (Informational)
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    bg: '#dbeafe'
  },
  
  // Neutrals
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  
  // Priority Badges
  hot: '#fee2e2',      // Red background
  warm: '#fef3c7',     // Amber background
  cold: '#dbeafe'      // Blue background
};
```

### Typography

```javascript
const typography = {
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", monospace'
  },
  
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px'
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
};
```

### Spacing System

```javascript
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px'
};
```

### Border & Shadows

```javascript
const visual = {
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px',
    full: '9999px'
  },
  
  boxShadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  
  transition: {
    fast: '0.15s ease',
    base: '0.3s ease',
    slow: '0.5s ease'
  }
};
```

---

## 🧩 Component Library

### 1. KpiCard Component

**Purpose**: Display key performance metrics with trend indicators

**Usage**:
```jsx
<KpiCard
  title="Total Enquiries"
  value={684}
  change={14.5}
  changeType="positive"  // or "negative"
  trend="(+32 Y)"
  icon="inbox"
  color="#6366f1"
  loading={false}
/>
```

**Visual Specs**:
- Card: White background, 12px border radius, 1px gray-200 border
- Icon: 44x44px rounded box with 15% opacity color background
- Title: 14px medium gray-600
- Value: 28px bold gray-900
- Change: Colored with trend arrow icon
- Hover: Lifts 2px with shadow

### 2. DataCard Component

**Purpose**: Container for tables, charts, and content sections

**Usage**:
```jsx
<DataCard
  title="Recent Enquiries"
  subtitle="Latest incoming leads"
  headerAction={<ActionButton>View All</ActionButton>}
  noPadding={true}  // For tables
>
  <SimpleTable ... />
</DataCard>
```

**Visual Specs**:
- Header: 20px padding, border-bottom
- Title: 16px semibold
- Subtitle: 13px gray-600
- Content: 20px padding (unless noPadding)

### 3. StatusBadge Component

**Purpose**: Color-coded status indicators

**Usage**:
```jsx
<StatusBadge 
  status="HOT" 
  variant="hot"  // hot, warm, cold, success, warning, danger, info
  size="sm"      // sm, md, lg
  dot={true}     // Show colored dot
/>
```

**Variants**:
- **hot**: Red background (#fee2e2), dark red text
- **warm**: Amber background (#fef3c7), dark amber text
- **cold**: Blue background (#dbeafe), dark blue text
- **success**: Green background, dark green text
- **warning**: Amber background, dark amber text
- **danger**: Red background, dark red text
- **info**: Blue background, dark blue text

### 4. SimpleTable Component

**Purpose**: Clean, sortable data tables

**Usage**:
```jsx
<SimpleTable
  columns={[
    { label: 'Name', key: 'name' },
    { label: 'Status', key: 'status', render: (row) => <StatusBadge .../> }
  ]}
  data={tableData}
  loading={false}
  emptyText="No data available"
  onRowClick={(row) => navigate(...)}
/>
```

**Visual Specs**:
- Header: 12px uppercase gray-600, 2px bottom border
- Rows: 14px gray-700, 1px border, hover gray-50 background
- Cell padding: 14px horizontal, 16px vertical

### 5. ActionButton Component

**Purpose**: Primary and secondary action buttons

**Usage**:
```jsx
<ActionButton
  variant="primary"  // primary, secondary, success, danger, ghost
  size="md"          // sm, md, lg
  icon="add"         // Material Icons name
  iconPosition="left"
  fullWidth={false}
  loading={false}
  onClick={handleClick}
>
  Add Employee
</ActionButton>
```

**Variants**:
- **primary**: Indigo background, white text
- **secondary**: White background, gray text, border
- **success**: Green background, white text
- **danger**: Red background, white text
- **ghost**: Transparent, colored text, hover background

### 6. DashboardLayout Component

**Purpose**: Consistent page structure

**Usage**:
```jsx
<DashboardLayout
  title="Welcome Back, Admin!"
  subtitle="Here's what's happening today"
  actions={<ActionButton .../>}
>
  <KpiGrid columns={5}>...</KpiGrid>
  <ContentGrid columns="2fr 1fr">...</ContentGrid>
</DashboardLayout>
```

**Layout Specs**:
- Container: 24px padding, 1600px max-width
- Header: 24px bottom margin
- Content: 24px gap between sections

---

## 👥 Role-Specific Dashboards

### 1. Admin Dashboard

**KPIs (5 cards)**:
- Total Enquiries (Indigo)
- Converted Sales (Green)
- Monthly Revenue (Amber)
- Pending Services (Red)
- Low Stock Alerts (Purple)

**Main Content**:
- **Left Column (2fr)**:
  - Recent Enquiries table
  - Service Escalations table
  
- **Right Column (1fr)**:
  - Quick Actions card
  - Activity Timeline card

**Features**:
- Full system visibility
- Financial data access
- MIF access button
- Approval workflows

### 2. Salesman Dashboard

**KPIs (5 cards)**:
- Assigned Leads
- Today's Follow-ups
- Pending Follow-ups
- Converted Deals
- Monthly Revenue

**Main Content**:
- **Left Column (3fr)**:
  - Today's Follow-ups (with action buttons)
  - All Assigned Enquiries table
  
- **Right Column (2fr)**:
  - Sales Funnel card
  - Quick Actions card
  - Attendance Status card

**Features**:
- Only assigned data visible
- No cost price access
- Daily report submission
- Attendance tracking

### 3. Service Engineer Dashboard

**KPIs (4 cards)**:
- Assigned Complaints
- SLA Due Today
- Completed Jobs
- Repeat Complaints

**Main Content**:
- **Left Column (2fr)**:
  - Today's Service Requests (with SLA countdown)
  - All Service Requests table
  
- **Right Column (1fr)**:
  - SLA Countdown widget
  - Today's Route map
  - Quick Actions card

**Features**:
- Only assigned services
- SLA timer visible
- Upload proof functionality
- Route optimization

### 4. Reception/Office Dashboard

**KPIs (5 cards)**:
- New Enquiries Today
- Pending Follow-ups
- Open Complaints
- Delivery Out/In
- Outstanding Amounts

**Main Content**:
- **Left Column (3fr)**:
  - HOT/WARM/COLD Enquiry Board
  - Complaint Notes table
  - Delivery register
  
- **Right Column (2fr)**:
  - Call Target (40 calls/day)
  - Visitor Register
  - Quick Actions card

**Features**:
- Digital notes replacement
- No financial margins
- Stock visibility
- Customer interaction focus

---

## 🛠️ Implementation Guide

### File Structure

```
frontend/src/
├── components/
│   └── shared/
│       └── dashboard/
│           ├── KpiCard.jsx
│           ├── DataCard.jsx
│           ├── StatusBadge.jsx
│           ├── SimpleTable.jsx
│           ├── ActionButton.jsx
│           └── DashboardLayout.jsx
│
├── admin/pages/
│   └── Dashboard.jsx
│
├── salesman/pages/
│   └── Dashboard.jsx
│
├── service-engineer/pages/
│   └── Dashboard.jsx
│
└── reception/pages/
    └── Dashboard.jsx
```

### Step-by-Step Implementation

#### 1. Install Material Icons (if not already)

```html
<!-- In index.html -->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

#### 2. Import Components

```jsx
import DashboardLayout, { KpiGrid, ContentGrid } from '../../components/shared/dashboard/DashboardLayout';
import KpiCard from '../../components/shared/dashboard/KpiCard';
import DataCard from '../../components/shared/dashboard/DataCard';
import SimpleTable from '../../components/shared/dashboard/SimpleTable';
import StatusBadge from '../../components/shared/dashboard/StatusBadge';
import ActionButton from '../../components/shared/dashboard/ActionButton';
```

#### 3. Build Dashboard Structure

```jsx
export default function MyDashboard() {
  return (
    <DashboardLayout title="Dashboard" subtitle="Overview">
      {/* KPI Cards */}
      <KpiGrid columns={4}>
        <KpiCard ... />
        <KpiCard ... />
        <KpiCard ... />
        <KpiCard ... />
      </KpiGrid>

      {/* Main Content */}
      <ContentGrid columns="2fr 1fr">
        {/* Left column */}
        <div>
          <DataCard ...>
            <SimpleTable ... />
          </DataCard>
        </div>

        {/* Right column */}
        <div>
          <DataCard ...>
            Content
          </DataCard>
        </div>
      </ContentGrid>
    </DashboardLayout>
  );
}
```

---

## 🎨 Figma Design Tokens

### For Designers

Create these as Figma variables/styles:

**Color Styles**:
- `Primary/Main` → #6366f1
- `Primary/Light` → #818cf8
- `Primary/Dark` → #4f46e5
- `Success/Main` → #10b981
- `Warning/Main` → #f59e0b
- `Danger/Main` → #ef4444
- `Gray/50` through `Gray/900`

**Text Styles**:
- `Heading/H1` → 24px, Bold, Gray-900
- `Heading/H2` → 20px, Semibold, Gray-900
- `Heading/H3` → 16px, Semibold, Gray-900
- `Body/Base` → 14px, Normal, Gray-700
- `Body/Small` → 12px, Normal, Gray-600
- `Caption` → 11px, Normal, Gray-500

**Effect Styles**:
- `Shadow/SM` → 0px 1px 3px rgba(0,0,0,0.05)
- `Shadow/MD` → 0px 4px 12px rgba(0,0,0,0.08)
- `Shadow/LG` → 0px 8px 24px rgba(0,0,0,0.12)

**Component Styles**:
- `Card` → White bg, 12px radius, 1px border Gray-200, Shadow-SM
- `Button/Primary` → Indigo bg, White text, 8px radius, 10-16px padding
- `Badge/Hot` → Red-100 bg, Red-800 text, 6px radius, 4-10px padding

---

## 📱 Responsive Breakpoints

```javascript
const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1280px',
  wide: '1536px'
};

// Usage in components
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

---

## ✅ Component Checklist

### Admin Dashboard
- [x] KpiCard components (5)
- [x] Recent Enquiries table
- [x] Service Escalations table
- [x] Quick Actions card
- [x] Activity Timeline

### Salesman Dashboard
- [x] KpiCard components (5)
- [x] Today's Follow-ups table
- [x] All Enquiries table
- [x] Sales Funnel card
- [x] Attendance Status card

### Service Engineer Dashboard
- [ ] KpiCard components (4)
- [ ] Service Requests table
- [ ] SLA Countdown widget
- [ ] Route map integration

### Reception Dashboard
- [ ] KpiCard components (5)
- [ ] HOT/WARM/COLD board
- [ ] Complaint Notes table
- [ ] Call Target widget
- [ ] Visitor Register

---

## 🎯 Next Steps

1. **Component Testing**: Test all components with real data
2. **Mobile Optimization**: Ensure responsive behavior on all devices
3. **API Integration**: Connect to actual backend endpoints
4. **Chart Integration**: Add line charts (Chart.js or Recharts)
5. **Export Feature**: Add PDF/Excel export for reports
6. **Filter System**: Implement date range and search filters
7. **Dark Mode**: Optional dark theme support

---

## 📚 References

- **Able Pro Demo**: https://ableproadmin.com/react/dashboard
- **Material Icons**: https://fonts.google.com/icons
- **Tailwind Colors**: https://tailwindcss.com/docs/customizing-colors
- **React Router**: https://reactrouter.com/

---

**Document Version**: 1.0
**Last Updated**: January 1, 2026
**Maintained By**: Frontend Team
