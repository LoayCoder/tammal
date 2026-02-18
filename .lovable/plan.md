
# Critical Navigation Bug — Definitive Root Cause & Permanent Fix

## The Real Problem: A Three-Layer Race Condition

Every sidebar tap navigates correctly via React Router, but the page immediately redirects back to `/` (dashboard). This is a **deterministic race condition** — it happens every single time because of how `useAuth` initializes.

### Exact Failure Timeline

```text
1. User taps sidebar → React Router navigates to "/admin/tenants"
2. AdminRoute renders
3. useUserPermissions fires → useAuth().user is the dependency
4. useAuth starts with `loading = true`, user = null (initial useState)
5. BEFORE the async session resolves, useQuery sees user?.id = undefined
6. enabled: !!user?.id → FALSE → query does NOT fire
7. permissionsQuery.isLoading = FALSE (query never ran, it's idle)
8. isSuperAdmin = false (permissions = [])
9. isTenantAdmin = false (hasRole = false, default)
10. permLoading = FALSE, roleLoading = FALSE → skeleton is skipped
11. AdminRoute hits: if (!isSuperAdmin && !isTenantAdmin) → true
12. <Navigate to="/" replace /> fires → user is bounced to dashboard
13. 300ms later: auth resolves, user.id is set, queries finally run
```

### Why This Was Not Fixed Before

The previous fix added `isLoading` checks to `AdminRoute` and `Dashboard`, but there is a **critical gap in the loading chain**: 

- `useUserPermissions` returns `isLoading: permissionsQuery.isLoading`
- When `enabled: !!user?.id` is `false` (because auth hasn't resolved yet), TanStack Query sets the query state to **`idle`**, not `loading`
- `isLoading` is `false` when the query is `idle`
- So `permLoading = false` and `roleLoading = false` even before auth is resolved
- The skeleton guard `if (permLoading || roleLoading)` passes, and the redirect fires instantly

This is the standard TanStack Query `isLoading` vs `isPending` vs `isFetching` distinction that trips up many implementations.

---

## Root Cause Summary

| Layer | Problem |
|-------|---------|
| `useAuth.ts` | Initializes with `loading: true` but this loading flag is never passed through to permission hooks |
| `useUserPermissions.ts` | Uses `isLoading` which is `false` when `enabled=false` (idle state), not truly "waiting for auth" |
| `useHasRole()` | Same issue — returns `{ hasRole: false, isLoading: false }` before user is known |
| `AdminRoute.tsx` | Trusts `isLoading` which is already `false` in the idle state → redirects too early |

---

## The Permanent Fix

### Fix 1 — Thread `authLoading` through the permission hooks (CRITICAL)

**File: `src/hooks/useUserPermissions.ts`**

Both `useUserPermissions` and `useHasRole` must expose a combined loading state that is `true` whenever `useAuth().loading` is `true`, regardless of query state. This is the only way to guarantee the guard waits for authentication before making access decisions.

```ts
// In useUserPermissions():
const { user, loading: authLoading } = useAuth();

return {
  ...
  isLoading: authLoading || permissionsQuery.isLoading || permissionsQuery.isFetching,
};

// In useHasRole():
const { user, loading: authLoading } = useAuth();

return { 
  hasRole, 
  isLoading: authLoading || isLoading 
};
```

This ensures `isLoading` is `true` the entire time auth is initializing — before any query even starts.

### Fix 2 — Add `authLoading` guard to `AdminRoute` (CRITICAL)

**File: `src/components/auth/AdminRoute.tsx`**

Add an explicit `authLoading` guard using `useAuth` directly in the route guard. This creates a hard wall: no redirect decision is made while auth is resolving.

```tsx
import { useAuth } from '@/hooks/useAuth';

export function AdminRoute({ children }) {
  const { loading: authLoading } = useAuth();
  const { isSuperAdmin, isLoading: permLoading } = useUserPermissions();
  const { hasRole: isTenantAdmin, isLoading: roleLoading } = useHasRole('tenant_admin');

  // Block ALL decisions until auth AND permissions are fully resolved
  if (authLoading || permLoading || roleLoading) {
    return <SkeletonLoader />;
  }

  if (!isSuperAdmin && !isTenantAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

### Fix 3 — Add `authLoading` guard to `Dashboard` (CRITICAL)

**File: `src/pages/Dashboard.tsx`**

Same pattern — the dashboard role-switch between `AdminDashboard` and `EmployeeHome` must wait for auth before deciding which view to render.

```tsx
const { loading: authLoading } = useAuth();

if (authLoading || permLoading || roleLoading || empLoading) {
  return <SkeletonLoader />;
}
```

### Fix 4 — Use `isPending` instead of `isLoading` in useQuery (BEST PRACTICE)

**File: `src/hooks/useUserPermissions.ts`**

TanStack Query v5 (installed in this project as `^5.83.0`) changed semantics:
- `isLoading` = query is fetching AND has no cached data
- `isPending` = query has not yet successfully returned data (includes idle/disabled state)

Using `isPending` instead of `isLoading` in the query state directly captures the "query not yet resolved" state, which is exactly what is needed here.

```ts
// useUserPermissions:
isLoading: authLoading || permissionsQuery.isPending,

// useHasRole:
isLoading: authLoading || isPending,
```

---

## Files to Change

| File | Change | Priority |
|------|--------|---------|
| `src/hooks/useUserPermissions.ts` | Thread `authLoading` into both `useUserPermissions` and `useHasRole` return values; use `isPending` | Critical |
| `src/components/auth/AdminRoute.tsx` | Add `useAuth` loading guard before any redirect logic | Critical |
| `src/pages/Dashboard.tsx` | Add `authLoading` to the loading guard condition | Critical |

---

## What Does NOT Change

- All routing config in `App.tsx` — correct as-is
- All sidebar filtering logic in `AppSidebar.tsx` — correct
- Database, RLS, edge functions — unrelated
- The mobile sidebar close-on-tap fix — stays in place
- All page components — no changes needed

---

## Why This Is Permanent

The fix anchors all permission decisions to the auth lifecycle. Until `useAuth().loading` is `false`, no permission query result is trusted as final, and no routing decision is made. This eliminates the race condition structurally — it cannot recur because the guard is now tied to the authentication source of truth, not to a derived query state that can be `false` while auth is still initializing.
