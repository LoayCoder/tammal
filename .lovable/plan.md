

## Add TeamPulseCard to the Organization Wellness Dashboard

### Current State
- `TeamPulseCard` exists on the **Dashboard Overview tab** and the **Employee Home** page
- It is **not present** on the `OrgDashboard` (Wellness tab) where admins do org-level analysis
- The card already supports mode switching (personal → team → organization) via `usePulseModes`, so admins will automatically see the "organization" toggle

### What to Do

**File: `src/components/dashboard/OrgDashboard.tsx`**

1. Import `TeamPulseCard` from `@/features/team-pulse` and `useCurrentEmployee` from `@/hooks/auth/useCurrentEmployee`
2. Add the card between `OrgWorkloadIndicator` and the `Tabs` section, wrapped in an `ErrorBoundary`
3. Only render when `employee?.id` is available

The result is a single, small edit — roughly 6 lines added. The card's built-in mode switcher will let admins toggle to "Organization" scope and see org-level engagement intelligence directly within the Wellness dashboard.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/OrgDashboard.tsx` | Add `TeamPulseCard` + `ErrorBoundary` |

