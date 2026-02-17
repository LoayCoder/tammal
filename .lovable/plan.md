

# Fix Access Control: Sidebar Filtering + Dashboard Flicker

## Problem Summary

Two critical issues for users with the "User" role (e.g., `test@example.com`):

1. **Sidebar shows all admin sections** -- SaaS Management, Survey System, Operations, Settings sections are visible to everyone because `AppSidebar` has no role/permission checks at all
2. **Dashboard flickers** -- The page renders `AdminDashboard` first while permissions load, then switches to `EmployeeHome`, causing a visible flash

## Root Cause

- `AppSidebar.tsx` renders a hardcoded list of menu items with zero permission filtering
- `Dashboard.tsx` shows `AdminDashboard` as the default fallback while `permLoading` is finishing, causing the flicker

---

## Solution

### 1. Role-Aware Sidebar (AppSidebar.tsx)

Add `useUserPermissions` hook to the sidebar. Filter menu groups by role:

| Sidebar Section | Visible To |
|---|---|
| Dashboard > Overview | Everyone |
| SaaS Management | Super Admin only |
| Survey System (admin items) | Super Admin + Tenant Admin |
| Survey System (employee items) | Everyone with employee profile |
| Wellness | Everyone with employee profile |
| Operations | Super Admin + Tenant Admin |
| Settings > Profile | Everyone |
| Settings > Usage & Billing | Super Admin + Tenant Admin |
| Settings > Brand, Docs, Audit | Super Admin + Tenant Admin |
| Help | Everyone |

The sidebar will consume `useUserPermissions` to get `isSuperAdmin` and also use `useHasRole` for `tenant_admin` checks. Menu items will be filtered before rendering, and empty groups will be hidden.

### 2. Fix Dashboard Flicker (Dashboard.tsx)

Change the render logic so that while permissions are loading, it shows only the loading skeleton -- never the AdminDashboard. Currently:

```text
if (!loading && !superAdmin && hasEmployee) -> EmployeeHome
if (loading) -> Skeleton
else -> AdminDashboard  <-- shown briefly before data loads
```

The fix reverses the check order: show skeleton FIRST while loading, then decide which dashboard to render. This eliminates the flicker completely.

### 3. Route Protection (App.tsx)

Wrap admin routes with role checks so that even if a "User" role user navigates directly to `/admin/tenants`, they get redirected. A lightweight `AdminRoute` wrapper component will check for admin-level roles and redirect non-admins to `/`.

---

## Technical Details

### Files to modify:

| File | Change |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Add `useUserPermissions` + `useHasRole` hooks, filter menu items by role |
| `src/pages/Dashboard.tsx` | Move loading check to top of render, prevent AdminDashboard flash |
| `src/App.tsx` | Add `AdminRoute` wrapper for `/admin/*` routes |
| `src/components/auth/AdminRoute.tsx` (new) | Route guard component that redirects non-admin users |

### AppSidebar changes:

- Import `useUserPermissions` and `useHasRole('tenant_admin')`
- Tag each menu group with a `requiredRole` property (e.g., `'admin'`, `'tenant_admin'`, `'all'`)
- Filter groups before rendering: hide groups the user has no access to
- Hide empty groups entirely

### Dashboard changes:

```typescript
// Current (causes flicker):
if (!permLoading && !empLoading && !isSuperAdmin && hasEmployeeProfile) {
  return <EmployeeHome />;
}
if (permLoading || empLoading) {
  return <Skeleton />;
}
return <AdminDashboard />;

// Fixed (skeleton first):
if (permLoading || empLoading) {
  return <Skeleton />;
}
if (!isSuperAdmin && !isTenantAdmin && hasEmployeeProfile) {
  return <EmployeeHome />;
}
if (!isSuperAdmin && !isTenantAdmin) {
  return <EmployeeHome />; // Non-admin without profile still sees employee view
}
return <AdminDashboard />;
```

### AdminRoute component:

```typescript
function AdminRoute({ children }) {
  const { isSuperAdmin, isLoading } = useUserPermissions();
  const isTenantAdmin = useHasRole('tenant_admin');

  if (isLoading) return <Skeleton />;
  if (!isSuperAdmin && !isTenantAdmin) return <Navigate to="/" replace />;
  return children;
}
```

No database changes required.
