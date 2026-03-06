

# Sidebar Redesign — Match Reference UI

## Summary

Redesign the sidebar to match the reference image: clean white card-like sidebar with two modes (expanded 260px, collapsed 72px), hover popups in collapsed mode, smooth transitions, notification badges, collapsible submenus, section labels, and a user profile footer.

## Current State

- Uses Shadcn sidebar primitives (`SidebarProvider`, `Sidebar`, etc.) from `src/components/ui/sidebar.tsx`
- Collapsible mode is `"icon"` with width `16rem` expanded / `3rem` collapsed
- Glass morphism styling (`glass-sidebar`, `glass-active`)
- No hover popup menus in collapsed mode (just basic tooltips)
- No user profile section at bottom
- Menu groups use `Collapsible` with chevron triggers

## Plan

### 1. Update Sidebar Dimensions & Variables

**File: `src/components/ui/sidebar.tsx`**
- Change `SIDEBAR_WIDTH` from `"16rem"` to `"260px"`
- Change `SIDEBAR_WIDTH_ICON` from `"3rem"` to `"72px"`
- Add `localStorage` persistence for sidebar state (replace cookie with `localStorage` key `sidebar_state`)

### 2. Create New Sidebar Components

**New directory: `src/components/layout/sidebar/`**

**`SidebarPopup.tsx`** — Hover popup for collapsed mode
- Renders when sidebar is collapsed and user hovers on a menu item that has children
- Positioned absolutely to the end of the sidebar (`start: 80px` in LTR)
- White card with `border-radius: 12px`, shadow `0 10px 30px rgba(0,0,0,0.08)`, padding `12px`, width `180px`
- Shows parent label as header + child links
- Uses `onMouseEnter`/`onMouseLeave` with a small delay for smooth UX
- RTL-aware positioning

**`UserProfileSection.tsx`** — Bottom user profile
- Shows avatar (36px, rounded-full), user name, chevron icon
- Positioned in `SidebarFooter`
- In collapsed mode: show avatar only
- Fetches from existing auth/profile hooks

### 3. Restyle Navigation Items

**File: `src/components/layout/AppSidebar.tsx`** (major rewrite)

- **Item height**: `h-12` (48px)
- **Active style**: `bg-[#E8F0FF] text-[#2E5BFF] rounded-xl` (use CSS variables for theme compliance — map to `--sidebar-primary` and a new `--sidebar-active-bg`)
- **Hover style**: `hover:bg-[#F5F7FB] rounded-[10px]` with `transition-all duration-200`
- **Section labels**: `text-[11px] text-[#9AA4B2] uppercase tracking-wider ms-4 mt-4 mb-2`, hidden when collapsed
- **Notification badge**: Blue pill badge (`bg-primary text-white text-[11px] px-1.5 rounded-lg ms-auto`)
- **Submenu arrow**: Chevron rotates 180° on open with `transition-transform duration-200`
- **Collapsed mode**: Hide all labels, show only centered icons; on hover, show `SidebarPopup` with children

### 4. Collapse/Expand Toggle Button

**File: `src/components/ui/sidebar.tsx`** or integrated into `AppSidebar`

- Position: top-end corner of sidebar header
- Icon: `ChevronLeft`/`ChevronRight` (or `<<`/`>>` via `ChevronsLeft`/`ChevronsRight`)
- Calls `toggleSidebar()`
- RTL: flip icon direction automatically

### 5. CSS Updates

**File: `src/index.css`**

- Add `--sidebar-active-bg` variable: light mode `#E8F0FF`, dark mode equivalent
- Update `.glass-sidebar` to use cleaner white background matching reference (or keep glass but tune opacity)
- Add sidebar transition: `transition: width 0.25s ease`

### 6. Hover Popup Logic (Collapsed Mode)

In `AppSidebar.tsx`, when `isCollapsed`:
- Each menu group item with children wraps in a container with `onMouseEnter`/`onMouseLeave`
- On hover, render `SidebarPopup` portal-style (or absolutely positioned) showing the group label + all child items
- Single items without children show a simpler tooltip (existing behavior)

### 7. Maintain Existing Functionality

- All role-based filtering (`isAdmin`, `isManager`, `hasEmployeeProfile`) preserved
- RTL support via logical properties (`ms-`, `me-`, `start-`, `end-`)
- Mobile sheet behavior unchanged
- Branding logo/icon in header preserved
- Mental toolkit nested sections preserved
- Spiritual wellbeing section preserved

## Files Changed

| File | Action |
|------|--------|
| `src/components/ui/sidebar.tsx` | Edit widths, localStorage persistence, toggle button |
| `src/components/layout/AppSidebar.tsx` | Major restyle — item heights, active/hover styles, section labels, collapsed popup logic, user profile footer |
| `src/components/layout/sidebar/SidebarPopup.tsx` | New — hover popup component for collapsed mode |
| `src/components/layout/sidebar/UserProfileSection.tsx` | New — bottom user profile section |
| `src/index.css` | Add sidebar active bg variable, transition tweaks |
| `src/components/layout/MainLayout.tsx` | No changes needed |

