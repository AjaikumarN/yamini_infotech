# Frontend Architecture - Header System

## ✅ CORRECT STRUCTURE (Current)

```
App.jsx (NO headers rendered here)
├── PublicLayout (renders Header.jsx)
│   ├── / → Home
│   ├── /products → ProductListing
│   ├── /services → ServicePage
│   └── /login → Login
│
└── DashboardLayout (renders AdminTopBar.jsx)
    ├── /admin/* → Admin pages
    ├── /reception/* → Reception pages
    ├── /salesman/* → Salesman pages
    └── /service-engineer/* → Engineer pages
```

## 🚨 CRITICAL RULES

### 1. Header Components
- **Header.jsx** = PUBLIC ONLY (website pages)
- **AdminTopBar.jsx** = ADMIN DASHBOARD ONLY
- **NEVER** import both in the same route

### 2. Layout Components
- **PublicLayout.jsx** = Contains Header.jsx + Outlet + Footer
- **DashboardLayout.jsx** = Contains AdminTopBar + Sidebar + Outlet
- **NO NESTING** of layouts

### 3. Page Components
- Admin pages (Dashboard.jsx, etc) should **NEVER** import Header.jsx or AdminTopBar.jsx
- They only render content via `<Outlet />` from parent layout
- Use `DashboardLayout` from `components/shared/dashboard` for page structure only (NOT headers)

## ❌ WHAT NOT TO DO

```jsx
// ❌ WRONG - Don't render Header in App.jsx top level
function App() {
  return (
    <>
      <Header />  {/* ❌ NO! */}
      <Routes>...</Routes>
    </>
  );
}

// ❌ WRONG - Don't import AdminTopBar into pages
import AdminTopBar from './AdminTopBar';
function Dashboard() {
  return (
    <>
      <AdminTopBar />  {/* ❌ NO! Layout handles this */}
      <div>Content...</div>
    </>
  );
}

// ❌ WRONG - Don't use conditional rendering in App.jsx
{!isDashboard && <Header />}  {/* ❌ NO! Use layout routes */}
```

## ✅ HOW TO ADD NEW PAGES

### Public Page
```jsx
// In App.jsx
<Route element={<PublicLayout />}>
  <Route path="/new-page" element={<NewPage />} />
</Route>
```

### Admin Page
```jsx
// In App.jsx
<Route element={<DashboardLayout role="ADMIN" />}>
  <Route path="/admin/new-page" element={<NewAdminPage />} />
</Route>
```

## 🔍 DEBUGGING DOUBLE HEADERS

If you see two headers:

1. **Check React DevTools** - Count how many `Header` / `AdminTopBar` components are mounted
2. **Check Network Tab** - Ensure page fully reloaded (no cached JS)
3. **Search codebase**:
   ```bash
   grep -r "<Header" src/admin  # Should find ZERO in admin
   grep -r "AdminTopBar" src/components  # Should find ZERO in public
   ```
4. **Verify routes** - Public routes must use `PublicLayout`, admin must use `DashboardLayout`

## 📁 File Locations

- `/src/App.jsx` - Main routing (NO headers)
- `/src/layouts/PublicLayout.jsx` - Public wrapper (Header + Footer)
- `/src/layouts/DashboardLayout.jsx` - Dashboard wrapper (AdminTopBar + Sidebar)
- `/src/components/Header.jsx` - Public website header
- `/src/admin/components/AdminTopBar.jsx` - Admin dashboard header
- `/src/components/shared/dashboard/DashboardLayout.jsx` - Page content wrapper (NOT a route layout)

---

**Last Updated:** January 3, 2026  
**Status:** ✅ Clean architecture implemented
