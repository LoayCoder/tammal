

# Remove Duplicate "Daily Check-in" Sidebar Group

## Problem

The sidebar has a **Wellness** group (lines 190–197 in `AppSidebar.tsx`) containing a single "Daily Check-in" item that points to `/` (the Dashboard). The Dashboard page already has a **Wellness** tab. This creates a redundant navigation entry.

## Change

**Edit** `src/components/layout/AppSidebar.tsx` — Remove the entire Wellness sidebar group (lines 190–197):

```tsx
// REMOVE this block:
{
  label: t('nav.wellness'),
  access: 'all',
  icon: Heart,
  items: [
    { title: t('nav.dailyCheckin'), url: "/", icon: Heart, access: 'employee' },
  ]
},
```

The Daily Check-in page (`/employee/wellness`) remains accessible via the employee flow. The Dashboard Wellness tab remains unchanged. No routes, pages, or components are removed — only the duplicate sidebar entry.

## Files

| Action | File |
|--------|------|
| Edit | `src/components/layout/AppSidebar.tsx` |

## Impact

- Zero product behavior change
- Zero route changes
- Cleaner sidebar navigation

