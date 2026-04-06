

# Fix: Landing Page Not Showing on tammal.ai

## Root Cause

The app uses VitePWA with `registerType: "autoUpdate"` and Workbox caching. The **previous build** had `/` mapped to the protected Dashboard, which redirected unauthenticated users to `/auth`. When you published the new version (with `/` → Landing Page), the old service worker continued serving the cached old JavaScript bundle — so visitors still see the login page.

## Solution (2 steps)

### 1. Force service worker cache invalidation on the published site
Update `src/main.tsx` to detect stale service workers on **all hosts** (not just preview domains) and force a cache reset. Currently `resetPreviewCaches` only runs on preview/lovableproject.com hosts — it needs to also run on production domains like tammal.ai.

**File:** `src/main.tsx`
- Change `isPreviewHost` check: remove the hostname restriction so the one-time cache reset also runs on tammal.ai and other custom domains
- Or better: add a cache-busting version key that changes with each deploy, so returning visitors get the fresh bundle

### 2. Re-publish the project
After the code change, publish an update so the new service worker replaces the old one.

## What This Fixes
- First-time visitors: Will see the landing page immediately
- Returning visitors (with stale SW): The cache reset logic clears the old service worker and reloads, then the new routing takes effect

## Files Modified
| File | Change |
|------|--------|
| `src/main.tsx` | Extend cache reset to run on production domains, not just preview hosts |

