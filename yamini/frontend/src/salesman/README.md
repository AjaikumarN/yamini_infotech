# Salesman Portal - Clean Rebuild

## Overview

Complete rebuild of the Salesman Portal with professional UI, clean architecture, and mobile-first design. Built from scratch using Receptionist Dashboard as design reference.

## Key Features

### 1. **No Forced Attendance Blocking**
- Attendance marking is **completely optional**
- Soft yellow reminder banners instead of blocking gates
- All pages accessible regardless of attendance status
- Professional approach: encourage rather than enforce

### 2. **Professional Design System**
- **Colors:**
 - Primary Blue: `#2563EB`
 - Hover Background: `#F1F5F9`
 - Active Background: `#EFF6FF`
 - Text: `#334155`
 - Muted Text: `#64748B`

- **Sidebar:**
 - Width: 260px (expanded), 72px (collapsed)
 - Clean white background
 - Smooth collapse/expand animation
 - Active item highlighting with blue accent

- **Components:**
 - Card-based layout throughout
 - 12px border radius for all cards
 - Subtle shadows and hover effects
 - Consistent spacing (16px, 24px, 32px)

### 3. **Mobile-First Responsive Design**
- Hamburger menu for mobile navigation
- Slide-in drawer sidebar
- Touch-friendly targets (48px minimum on mobile)
- Single-column card layout on small screens
- Full-width buttons for easy tapping

### 4. **Voice-to-Text Input**
- Microphone button on Calls page
- Browser-based speech recognition
- Hands-free call note entry
- Fallback message for unsupported browsers

### 5. **Complete Feature Set**
- Dashboard with stats overview
- Optional attendance marking (photo + GPS)
- Enquiries & leads management
- Call logging with voice input
- Follow-up tracking
- Orders view (read-only)
- Daily report submission
- Discipline & compliance guidelines

## Architecture

```
frontend/src/salesman/
 layout/
 SalesmanLayout.jsx # Main layout with sidebar + topbar
 pages/
 Dashboard.jsx # Overview with stats
 Attendance.jsx # Optional attendance marking
 Enquiries.jsx # Leads management
 Calls.jsx # Call logging + voice input
 FollowUps.jsx # Follow-up tracking
 Orders.jsx # Orders view
 DailyReport.jsx # EOD report submission
 Compliance.jsx # Compliance rules
 components/
 StatCard.jsx # Reusable stat card
 EmptyState.jsx # Empty state UI
 AttendanceCard.jsx # Attendance reminder banner
 hooks/
 useSalesmanApi.js # Centralized API functions
 styles/
 salesman.css # Complete styling (460+ lines)
 index.js # Module exports
```

## Getting Started

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Login credentials: `salesman` / `password`

### Starting the Frontend
```bash
cd frontend
npm install
npm run dev
```

### Running Cypress Tests
```bash
# Open Cypress UI
npm run cypress:open

# Run tests headless
npm run cypress:run
```

## Mobile Testing

Test on actual mobile viewport:
```javascript
cy.viewport('iphone-x')
cy.viewport(375, 667) // iPhone SE
cy.viewport(414, 896) // iPhone 11 Pro Max
```

## Design Specifications

### Sidebar
- **Expanded:** 260px width
- **Collapsed:** 72px width
- **Item Height:** 44px
- **Padding:** 12px 16px
- **Icon Size:** 20px
- **Gap:** 12px
- **Border Radius:** 8px

### Stat Cards
- **Border Radius:** 12px
- **Padding:** 24px
- **Icon Background:** Colored circle (56px)
- **Shadow:** `0 2px 8px rgba(0,0,0,0.04)`
- **Hover:** Lift effect with increased shadow

### Buttons
- **Primary:** Blue (#2563EB)
- **Height:** 40px
- **Padding:** 10px 20px
- **Border Radius:** 8px
- **Font Weight:** 600

### Touch Targets (Mobile)
- **Minimum Height:** 48px
- **Full Width:** On mobile screens
- **Spacing:** Increased padding for easier tapping

## Testing

### Test Coverage
- Dashboard loads without blocking
- All sidebar navigation works
- Attendance is optional (not forced)
- Voice input button visible on Calls page
- Mobile hamburger menu functions
- Empty states display correctly
- All pages accessible without attendance
- Color scheme matches specifications
- Sidebar width correct (260px)
- Touch targets adequate on mobile

### Running Tests
```bash
# Open Cypress Test Runner
npx cypress open

# Run all tests headless
npx cypress run

# Run specific test file
npx cypress run --spec "cypress/e2e/salesman-portal.cy.js"
```

## API Endpoints Used

All API calls are centralized in `hooks/useSalesmanApi.js`:

| Function | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| `checkTodayAttendance()` | `/api/attendance/today` | GET | Check attendance status |
| `markAttendance(formData)` | `/api/attendance/check-in` | POST | Mark attendance with photo+GPS |
| `getMyEnquiries(filters)` | `/api/enquiries` | GET | Fetch enquiries |
| `updateEnquiry(id, data)` | `/api/enquiries/:id` | PUT | Update enquiry status |
| `getMyCalls(today)` | `/api/sales/my-calls` | GET | Fetch calls |
| `createCall(data)` | `/api/sales/calls` | POST | Log new call |
| `getMyOrders()` | `/api/orders` | GET | Fetch orders |
| `submitDailyReport(data)` | `/api/sales/daily-report` | POST | Submit EOD report |
| `getTodayReport()` | `/api/sales/daily-report/:date` | GET | Check today's report |
| `getDashboardStats()` | Multiple | GET | Aggregated dashboard stats |

## Design Philosophy

### 1. **Optional, Not Mandatory**
Attendance is encouraged but never enforced. Soft yellow banners remind users without blocking access.

### 2. **Mobile-First**
Every component designed for mobile first, then enhanced for desktop. Touch-friendly targets throughout.

### 3. **Professional & Clean**
Enterprise-grade design matching modern SaaS applications. Clean white cards, subtle shadows, blue accents.

### 4. **Consistent Architecture**
- Centralized API layer
- Reusable components
- Single source of truth for styling
- Clear separation of concerns

### 5. **Accessibility**
- Proper color contrast
- Touch target sizes
- Keyboard navigation support
- Screen reader friendly

## Menu Structure

1. **Dashboard** - Overview with stats
2. **Attendance** - Optional marking
3. **Enquiries & Leads** - Lead management
4. **Calls** - Call logging + voice input
5. **Follow-Ups** - Pending follow-ups
6. **Orders** - Order view (read-only)
7. **Daily Report** - EOD report
8. **Discipline & Compliance** - Rules & guidelines
9. **Logout** - Sign out

## Known Issues

None! This is a complete clean rebuild with no legacy code.

## Refresh Migration from Old UI

### What Changed
- Deleted entire `components/salesman/` directory
- Created new `src/salesman/` structure
- Removed forced attendance blocking (AttendanceGate)
- Added professional design system
- Added mobile responsiveness
- Added voice input
- Added Cypress tests

### Breaking Changes
- Old import paths no longer work
- `AttendanceGate` component removed
- `GatedSalesmanLayout` removed
- New routes: `/salesman/*` instead of `/employee/salesman`

## Code Style

### Component Template
```javascript
import React, { useState, useEffect } from 'react';
import '../styles/salesman.css';

export default function ComponentName() {
 return (
 <div className="component-class">
 {/* Content */}
</div>
 );
}
```

### CSS Naming Convention
- `.salesman-*` - Layout components
- `.sidebar-*` - Sidebar elements
- `.page-*` - Page-level elements
- `.card-*` - Card components
- `.btn-*` - Button variants
- `.form-*` - Form elements

## Learning Resources

- React Router v6 (nested routes with `<Outlet />`)
- CSS Grid for responsive card layouts
- Modern React patterns (hooks, context)
- Web Speech API for voice input
- Cypress for E2E testing

## Contributing

When adding new features:
1. Follow existing component structure
2. Use classes from `salesman.css`
3. Ensure mobile responsiveness
4. Add Cypress tests
5. Never block user access based on attendance

## License

Part of the Company Management System

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Check API endpoint responses
4. Review Cypress test results
5. Consult this README

---

**Version:** 3.0.0 (Complete Rebuild) 
**Last Updated:** January 2025 
**Status:** Production Ready
