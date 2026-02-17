

# Display Brand Icon/Logo in Sidebar Header

## Problem
The `AppSidebar` component calls `useBranding()` without a `tenantId`, so it always receives default branding (null icons/logos). The actual tenant branding is loaded in `MainLayout` but never passed down to the sidebar.

## Solution
Pass the tenant's branding data from `MainLayout` to `AppSidebar` via props, so the sidebar header displays the correct brand icon (when collapsed) and logo (when expanded).

## UI Best Practices Applied
- **Collapsed sidebar**: Show a compact brand icon (square, centered) using `ThemeIcon`
- **Expanded sidebar**: Show the full brand logo using `ThemeLogo`
- **Fallback**: If no brand assets are uploaded, show a default building icon + "SaaS Admin" text (current behavior, retained)
- **Theme-aware**: Light/dark logo variants automatically selected based on active theme

## Technical Details

### 1. Update `AppSidebar` to accept branding props
**File**: `src/components/layout/AppSidebar.tsx`
- Add a `branding` prop of type `BrandingConfig`
- Remove the internal `useBranding()` call (no longer needed)
- Continue using `ThemeLogo` and `ThemeIcon` with the passed branding data

### 2. Pass branding from `MainLayout` to `AppSidebar`
**File**: `src/components/layout/MainLayout.tsx`
- Pass the already-fetched `branding` object as a prop: `<AppSidebar branding={branding} />`

### 3. No database or translation changes needed
The sidebar header already has the correct `ThemeLogo` / `ThemeIcon` rendering logic -- it just needs the real data.

## Summary of Changes
| File | Change |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Accept `branding` prop, remove `useBranding()` import/call |
| `src/components/layout/MainLayout.tsx` | Pass `branding` to `<AppSidebar branding={branding} />` |

