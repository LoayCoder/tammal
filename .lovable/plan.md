

## Fix: Reduce Sidebar Group Gaps and Add Group Icons

### Problem
1. The spacing between each sidebar group section is too large -- caused by `p-2` on each `SidebarGroup` plus `gap-2` on `SidebarContent`, stacking up to excessive vertical gaps.
2. Group labels (Dashboard, SaaS Management, etc.) have no icons, making them harder to scan visually.

### Fix Plan

#### 1. Reduce gaps between groups

**File: `src/components/ui/sidebar.tsx`**
- Change `SidebarGroup` padding from `p-2` to `px-2 py-0.5` to tighten vertical spacing.
- Optionally reduce `SidebarContent` gap from `gap-2` to `gap-1`.

#### 2. Add icons to each group label

**File: `src/components/layout/AppSidebar.tsx`**

Add an `icon` property to the `MenuGroup` interface and assign an icon to each group:

| Group | Icon |
|-------|------|
| Dashboard | `LayoutDashboard` |
| SaaS Management | `Building2` |
| Survey System | `ClipboardList` |
| Wellness | `Heart` |
| Workload Intelligence | `Target` |
| Recognition & Awards | `Trophy` |
| Operations | `Network` |
| Settings | `Settings` |
| Help | `HelpCircle` |

Then render the icon inside the `CollapsibleTrigger` next to the group label text:

```text
[icon] GROUP LABEL                    [chevron]
```

The icon will be rendered as a small (h-3.5 w-3.5) element with `me-1.5` spacing, using logical properties for RTL support.

### Files to Modify
1. `src/components/ui/sidebar.tsx` -- reduce SidebarGroup padding and SidebarContent gap
2. `src/components/layout/AppSidebar.tsx` -- add `icon` to MenuGroup interface and each group definition, render icon in group label trigger
