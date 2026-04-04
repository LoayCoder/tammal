
Goal: fix the preview white screen so `/auth` and protected routes render reliably in the preview environment.

What I found
- The route setup itself is valid:
  - `/auth` is public
  - protected pages are behind `ProtectedRoute`
- The preview is loading the HTML shell and `src/main.tsx`, so this is not a missing-route problem.
- I did not find a captured React runtime error, which strongly suggests a startup/session state issue rather than a JSX crash.
- The current preview context is on `/auth`.
- Console context shows Vite HMR websocket failure in preview.
- Auth logs show repeated invalid JWT / missing `sub` claim requests.
- The auth logic is fragmented:
  - `useAuth()` creates its own local state every time it is called
  - `ProtectedRoute`, `Auth`, `MainLayout` dependencies, menus, and permission hooks can all read auth independently
  - this can cause inconsistent loading, redirect, and session timing during preview startup

Most likely problem
- The app is vulnerable to preview boot inconsistency because authentication state is not centralized.
- In preview, stale/invalid session state plus multiple independent auth subscriptions can leave the app in a blank or unresolved render state even without a visible runtime exception.
- The HMR websocket warning is noisy but likely secondary; the bigger issue is auth/session boot resilience.

Implementation plan
1. Centralize authentication state
- Introduce a single auth provider/context at the app root.
- Move the `onAuthStateChange` subscription and session/user/loading state into that provider.
- Make `useAuth()` consume the shared context instead of creating a new subscription per component.

2. Harden auth boot behavior
- Initialize from the current session once, then keep it updated from auth events.
- Treat invalid or missing sessions as a clean signed-out state.
- Ensure loading always resolves to `false`, even when preview auth is broken or expired.

3. Make route guards fail safe
- Keep `ProtectedRoute` simple:
  - loading → skeleton
  - no user → `/auth`
  - user → render outlet
- Avoid any route state that can stay unresolved indefinitely.

4. Stabilize pre-auth screens
- Keep `/auth` independent of tenant/profile-dependent queries while booting.
- Guard `usePlatformSettings()` so a failed pre-auth RPC does not blank the page; it should fall back to safe defaults.

5. Reduce preview-specific white-screen risk
- Keep the cache reset in `main.tsx`, but ensure it cannot contribute to repeated boot instability.
- Treat preview HMR websocket failure as non-blocking.
- Optionally add a minimal top-level startup fallback if auth/bootstrap throws unexpectedly.

6. Verify affected files
- Likely files to update:
  - `src/App.tsx`
  - `src/hooks/auth/useAuth.ts`
  - new auth context/provider file
  - `src/components/auth/ProtectedRoute.tsx`
  - `src/pages/Auth.tsx`
  - `src/hooks/org/usePlatformSettings.ts`

Expected result
- Preview no longer gets stuck on a white screen.
- `/auth` renders even when preview/session tokens are stale.
- Protected routes redirect cleanly to login instead of failing silently.
- Session state becomes consistent across the whole app.

Technical notes
- This is primarily a frontend bootstrap/auth-state architecture fix.
- No database/schema change is needed.
- The invalid JWT logs are consistent with stale or malformed preview session state, so the UI must handle that gracefully instead of depending on perfect auth startup.
