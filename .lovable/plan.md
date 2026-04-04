

## Bug: Spiritual Tabs Missing from Sidebar

### Root Cause

The **Wellness** group in `menuItems` (line 193-197) has an empty `items: []` array. The `filteredGroups` pipeline ends with `.filter(group => group.items.length > 0)` (line 333), which removes any group with zero items. Since the Spiritual section only renders inside the Wellness group iteration (`isWellnessGroup && spiritualEnabled`), it never appears.

### Fix

**File:** `src/components/layout/AppSidebar.tsx`

**Change:** Modify the final filter on line 333 to keep the Wellness group even when its items array is empty, as long as spiritual features are enabled:

```typescript
.filter(group => group.items.length > 0 || (group.label === t('nav.wellness') && spiritualEnabled));
```

This single-line change ensures the Wellness group stays in `filteredGroups`, allowing the Spiritual collapsible section to render beneath it. No other files need changes.

