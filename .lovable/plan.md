

## Make the App Fully Mobile-Responsive as a PWA

### Overview
The app has good PWA infrastructure (service worker, manifest, install banner, caching) but several UI areas are not optimized for mobile touch interaction. This plan addresses the key gaps to make the app feel native on phones.

### 1. Mobile Bottom Navigation Bar

Create a persistent bottom navigation bar for mobile users (visible below `md` breakpoint) with quick-access icons for the most-used sections: Dashboard, Wellness, Support, Profile, and More (opens sidebar).

**New file: `src/components/layout/MobileBottomNav.tsx`**

- Fixed to the bottom of the viewport with `safe-area-inset-bottom` padding
- Glass styling consistent with the header
- Active state indicator matching `glass-active`
- Hidden on desktop (`md:hidden`)
- Uses logical properties for RTL

**Mount in `MainLayout.tsx`** after the `</main>` tag.

### 2. Mobile Card View for Data Tables

The `UserTable` (and similar admin tables) renders a full `<table>` which is unusable on small screens. Create a responsive wrapper pattern.

**New file: `src/components/ui/responsive-table.tsx`**

A wrapper component that:
- On desktop (`md+`): renders children (the table) as-is
- On mobile (`<md`): renders each row as a stacked card with key-value pairs

**Update `src/components/users/UserTable.tsx`**:
- On mobile: render user cards (avatar, name, email, status badge, role badges, action menu) in a vertical stack
- On desktop: keep the existing table layout
- Use `useIsMobile()` hook to switch between views

### 3. Touch-Friendly Sizing & Spacing

**Update `src/index.css`** with mobile-specific utilities:

- Add a `.touch-target` utility class ensuring minimum 44x44px tap targets (Apple HIG)
- Increase padding on interactive elements at small breakpoints
- Add `overscroll-behavior: contain` on the main scroll area to prevent pull-to-refresh interference in standalone PWA mode

### 4. PWA Standalone Mode Enhancements

**Update `src/index.css`**:
- Add `@media (display-mode: standalone)` styles to hide browser-specific UI hints
- Ensure the bottom nav accounts for the home indicator on notched devices
- Add smooth momentum scrolling (`-webkit-overflow-scrolling: touch`)

**Update `src/components/layout/MainLayout.tsx`**:
- Add `pb-16 md:pb-0` to the main content area to prevent the bottom nav from covering content on mobile
- Add `overscroll-behavior-y: contain` on the root layout div

### 5. Header Adjustments for Mobile

**Update `src/components/layout/Header.tsx`**:
- On mobile, hide the breadcrumb (already done with `hidden md:flex`)
- Ensure all header action buttons meet 44px touch targets
- Add the page title as a simple text element on mobile (replacing the breadcrumb)

### 6. Auth Page Mobile Polish

**Update `src/pages/Auth.tsx`**:
- Add safe-area padding for standalone PWA mode
- Ensure the form fills the viewport nicely on small screens
- Make the card full-width on mobile with minimal horizontal padding

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/layout/MobileBottomNav.tsx` | **Create** -- bottom navigation bar |
| `src/components/ui/responsive-table.tsx` | **Create** -- mobile card / desktop table wrapper |
| `src/components/users/UserTable.tsx` | **Modify** -- add mobile card view |
| `src/components/layout/MainLayout.tsx` | **Modify** -- mount bottom nav, add bottom padding |
| `src/components/layout/Header.tsx` | **Modify** -- mobile page title, touch targets |
| `src/index.css` | **Modify** -- PWA standalone styles, touch utilities |
| `src/pages/Auth.tsx` | **Modify** -- mobile safe-area polish |

### Technical Notes

- All components use logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) -- no `ml-`/`mr-`
- `useIsMobile()` hook (already exists at 768px breakpoint) is used for conditional rendering
- The bottom nav uses `env(safe-area-inset-bottom)` for notched devices in standalone PWA mode
- No database changes required
- The responsive table pattern can be reused across all admin tables in future iterations

