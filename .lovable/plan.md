

## Redirect Unauthenticated Users to Login + PWA Install Prompt

### Problem
1. **No auth guard**: Users can visit `/` and all protected routes without being logged in. There is no redirect to `/auth`.
2. **PWA install prompt is passive**: The install prompt only appears on the `/install` page. Users never see a proactive "Install App" banner or popup.

### Plan

#### 1. Create a `ProtectedRoute` wrapper component

**New file: `src/components/auth/ProtectedRoute.tsx`**

- Uses `useAuth()` to check for a logged-in user
- While `loading` is true, shows a loading skeleton
- If no `user`, redirects to `/auth` using `<Navigate to="/auth" replace />`
- If authenticated, renders `<Outlet />`

#### 2. Wrap all authenticated routes with `ProtectedRoute`

**File: `src/App.tsx`**

Nest the `<MainLayout />` route inside `<ProtectedRoute />`:

```text
<Route element={<ProtectedRoute />}>        <-- NEW guard
  <Route element={<MainLayout />}>
    <Route path="/" element={<Dashboard />} />
    ... all other protected routes ...
  </Route>
</Route>
```

This ensures every route inside MainLayout requires authentication. The `/auth`, `/auth/accept-invite`, and `/install` routes remain public.

#### 3. Add a PWA Install Banner component

**New file: `src/components/pwa/PWAInstallBanner.tsx`**

A small, dismissible banner that appears at the top or bottom of the screen when:
- The browser fires `beforeinstallprompt` (i.e., `canInstall` is true from `usePWAInstall`)
- The app is not already installed
- The user hasn't dismissed it in this session (tracked via `sessionStorage`)

For iOS users (where `beforeinstallprompt` doesn't fire), show a brief instruction: "Tap Share then Add to Home Screen".

The banner includes:
- App icon + "Install Tammal for a better experience"
- An "Install" button (triggers `installApp()`)
- A dismiss "X" button

#### 4. Mount the PWA Install Banner

**File: `src/components/layout/MainLayout.tsx`**

Add `<PWAInstallBanner />` inside the layout, above the `<Header />`, so it's visible on every authenticated page.

Also add it to the **Auth page** (`src/pages/Auth.tsx`) so first-time visitors on mobile see the install prompt even before logging in.

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/auth/ProtectedRoute.tsx` | **Create** -- auth guard wrapper |
| `src/components/pwa/PWAInstallBanner.tsx` | **Create** -- dismissible install prompt |
| `src/App.tsx` | **Modify** -- wrap MainLayout routes in ProtectedRoute |
| `src/components/layout/MainLayout.tsx` | **Modify** -- add PWAInstallBanner |
| `src/pages/Auth.tsx` | **Modify** -- add PWAInstallBanner |

### Technical Notes
- Uses logical properties (`ms-`, `me-`, `text-start`) for RTL support
- `sessionStorage` key `pwa-banner-dismissed` prevents repeated prompts in the same session
- The ProtectedRoute pattern keeps auth logic centralized and avoids repeating checks in each page
- No database changes required

