

# Collapsible Menu Groups with Clean Sub-item Style

## Problem
Currently, menu groups (SaaS Management, Survey System, etc.) render as static section labels with flat item lists below. The user wants each group to behave like the "My Task" reference — a collapsible trigger row with icon + label + chevron, and sub-items that expand underneath **without** the vertical line/dot connector.

## Reference Style
From the attached image:
- Group trigger: icon + label + dot indicator + up/down chevron
- Sub-items: indented, with small circle bullets (gray = inactive, blue filled = active)
- No vertical connecting line between sub-items
- Clean, minimal spacing

## Changes

### `src/components/layout/AppSidebar.tsx`

**Convert each menu group to a `Collapsible` component:**

Currently:
```
[Section Label: "SaaS Management"]    ← static text header
  [Item] Tenant Management
  [Item] Plan Management
  [Item] Subscription Management
```

After:
```
[▼ 🏢 SaaS Management]               ← collapsible trigger (icon + label + chevron)
    · Tenant Management               ← sub-item with small dot, no line
    · Plan Management
    · Subscription Management
```

**Implementation details:**
1. Replace the static `<div className="px-3 pt-4 pb-1">` section label with a `Collapsible` + `CollapsibleTrigger` that includes the group icon, label, optional activity dot, and a rotating chevron
2. Wrap the `SidebarMenu` items inside `CollapsibleContent`
3. Sub-items: Remove `border-s border-sidebar-border` line styling from the mental toolkit sections too — use simple indentation with small dot bullets instead
4. Active dot: filled blue circle; inactive: gray outline circle
5. Track open/closed state per group using a `Set<string>` state, auto-opening groups that contain the active route
6. Single-item groups (like Dashboard/Overview) remain as direct nav links without collapsible wrapper

**Sub-item style (no line, with dots):**
```tsx
<div className="ms-7 mt-0.5 flex flex-col gap-0.5">
  {items.map(item => (
    <NavLink className="flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm">
      <span className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
        isActive ? "bg-sidebar-primary" : "bg-muted-foreground/40"
      )} />
      <span>{item.title}</span>
    </NavLink>
  ))}
</div>
```

**Collapsed mode**: No changes needed — already shows group icon with hover popup.

### Files Modified
| File | Change |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Convert groups to collapsible triggers; update sub-item style to dots without lines; manage open state per group |

