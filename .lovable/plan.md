

# PWA Compliance and Full Responsive Fix

## Issues Found

### PWA Issues
1. **Missing `navigateFallbackDenylist`** for `/~oauth` in the Vite PWA config -- this is required so the service worker never caches OAuth redirect routes
2. **`App.css` has harmful `#root` styles** -- `max-width: 1280px`, `padding: 2rem`, and `text-align: center` on `#root` constrain the layout, break full-width on larger screens, and interfere with the sidebar layout
3. **Viewport meta tag** missing `viewport-fit=cover` for notched devices (iPhone safe areas)
4. **Missing `apple-mobile-web-app-capable`** equivalent for modern Safari (`mobile-web-app-capable`)

### Responsive Issues
1. **`App.css` `#root` styles** cap the app at 1280px and add 2rem padding everywhere -- this fights the full-bleed sidebar layout on desktop and wastes space
2. **EmployeeHome stats grid** uses `grid-cols-3` with no mobile fallback -- on very small screens (320px), the 3-column grid gets cramped
3. **InlineDailyCheckin** card has fixed padding that could be tighter on mobile

---

## Plan

### 1. Fix `App.css` (critical)
Remove or neutralize the `#root` block that caps width and adds padding. The existing `MainLayout` already handles layout structure. The `App.css` is leftover Vite boilerplate and actively harms the app.

- Remove `max-width: 1280px` from `#root`
- Remove `padding: 2rem` from `#root`
- Remove `text-align: center` from `#root`
- Keep the file but only with non-harmful styles (or empty it)

### 2. Fix Vite PWA config (`vite.config.ts`)
Add `navigateFallbackDenylist: [/^\/~oauth/]` inside the `workbox` config to prevent service worker from caching OAuth routes.

### 3. Fix viewport meta (`index.html`)
Update the viewport tag to:
```
width=device-width, initial-scale=1.0, viewport-fit=cover
```
This enables proper rendering in notched/safe-area devices.

### 4. Add safe-area CSS (`index.css`)
Add `env(safe-area-inset-*)` padding to the body/root for PWA standalone mode on notched devices.

### 5. Fix EmployeeHome responsive grid
Change the stats grid from `grid-cols-3` to `grid-cols-1 sm:grid-cols-3` so cards stack on very small screens.

### 6. Tighten InlineDailyCheckin mobile padding
Adjust padding from fixed `p-5` to `p-4 sm:p-5` for slightly better mobile fit.

---

## Technical Details

### Files to modify:

| File | Change |
|---|---|
| `src/App.css` | Remove/neutralize `#root` constraint styles |
| `vite.config.ts` | Add `navigateFallbackDenylist` for `/~oauth` |
| `index.html` | Add `viewport-fit=cover` to viewport meta |
| `src/index.css` | Add safe-area-inset padding for standalone PWA |
| `src/pages/EmployeeHome.tsx` | Fix stats grid responsive breakpoint |
| `src/components/checkin/InlineDailyCheckin.tsx` | Responsive padding tweak |

No database changes required.
