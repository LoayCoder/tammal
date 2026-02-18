
# Mobile Sidebar Navigation — Root Cause & Fix Plan

## Problem Diagnosis

The screenshot shows the mobile sidebar is open (rendered as a Radix UI `Sheet` on screens narrower than 768px). The user taps a menu item, but the page does not navigate — the sidebar either stays open or the app "hangs".

### Root Cause: Missing `setOpenMobile(false)` on Navigation

On mobile, the `Sidebar` component renders as a `Sheet` (a slide-over drawer) controlled by `openMobile` state in `SidebarContext`. When a user taps a `NavLink` inside the sidebar:

1. React Router navigates to the new route — **this works correctly**.
2. The `Sheet` does **not close** because nothing calls `setOpenMobile(false)` after navigation.
3. The Sheet **re-renders over the new page content** while still visible, blocking all interaction with the page behind it.
4. The user sees the sidebar frozen in place, making it appear the navigation "hangs."

This is a known behavior with Shadcn's sidebar Sheet on mobile: clicking a link inside a Sheet that wraps `NavLink` items does not automatically close the drawer because the Sheet's open state is controlled externally.

### Secondary Issues Found

1. **`SheetContent` renders a close `X` button**, but the sidebar CSS hides it via `[&>button]:hidden`. This means users have no visible way to dismiss the sidebar after tapping a link that doesn't close it.

2. **The `side` prop on the `Sidebar` is `"left"`**, but on RTL (Arabic), the Sheet slides in from the right correctly (the `sheetVariants` handles RTL). However, the Sheet itself is missing a `dir` attribute forwarded from the document, which can cause subtle alignment issues with the close button position on RTL.

---

## Fix Plan

### Fix 1 — Close sidebar on mobile after link tap (CRITICAL)

**File:** `src/components/layout/AppSidebar.tsx`

Add `useSidebar()` context to access `isMobile` and `setOpenMobile`. Wrap the `NavLink` `onClick` to call `setOpenMobile(false)` when on mobile. This ensures the Sheet closes immediately after a link is tapped.

```tsx
// Inside AppSidebar, destructure from useSidebar:
const { state, isMobile, setOpenMobile } = useSidebar();

// On each NavLink, add onClick handler:
<NavLink
  to={item.url}
  end={item.url === '/'}
  className="flex items-center gap-2"
  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
  onClick={() => {
    if (isMobile) setOpenMobile(false);
  }}
>
```

This is the minimal, surgical fix. No layout changes, no component rewrites.

### Fix 2 — Fix RTL `side` prop for mobile Sheet (MODERATE)

**File:** `src/components/layout/AppSidebar.tsx`

On RTL (Arabic), the sidebar should slide in from the right side. The current `<Sidebar side="left">` works on desktop (the fixed sidebar is on the left), but on mobile the Sheet uses the same `side` prop. For Arabic users, the sidebar should appear from the right.

Add RTL awareness using `document.documentElement.dir`:

```tsx
// In AppSidebar component body:
const isRTL = document.documentElement.dir === 'rtl';

// In JSX:
<Sidebar variant="sidebar" collapsible="icon" side={isRTL ? "right" : "left"}>
```

This ensures the mobile Sheet slides in from the linguistically correct side (right for Arabic, left for English).

### Fix 3 — Add `dir` attribute to mobile Sheet (MINOR)

**File:** `src/components/ui/sidebar.tsx` — mobile branch (lines 163–181)

The `SheetContent` inside the mobile sidebar branch should inherit the document direction. Currently it renders without a `dir` attribute, so Radix portals it into `document.body` without direction context.

Add `dir={document.documentElement.dir}` to the `SheetContent`:

```tsx
if (isMobile) {
  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
      <SheetContent
        data-sidebar="sidebar"
        data-mobile="true"
        dir={document.documentElement.dir} // ADD THIS
        className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
        style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
        side={side}
      >
        <div className="flex h-full w-full flex-col">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Files to Change

| File | Change | Severity |
|------|--------|---------|
| `src/components/layout/AppSidebar.tsx` | Add `isMobile` + `setOpenMobile` from `useSidebar`; add `onClick` to close Sheet on mobile tap | Critical |
| `src/components/layout/AppSidebar.tsx` | Use `isRTL` to set `side` prop dynamically for mobile Sheet direction | Moderate |
| `src/components/ui/sidebar.tsx` | Add `dir={document.documentElement.dir}` to mobile `SheetContent` | Minor |

---

## What Does NOT Change

- All routing logic — React Router navigation is working correctly
- Desktop sidebar behavior — unaffected
- All access control / filtering logic in `AppSidebar`
- Any other component
