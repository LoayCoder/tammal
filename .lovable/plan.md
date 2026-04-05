

## Plan: Add Wellness Copilot to OrgDashboard + Fix 401 Error

### Two changes

**1. Fix `team-pulse-engine` 401 error (Risk — blocks feature)**

The previous fix replaced `getUser()` with `getClaims(token)`, but `getClaims` does not exist on `@supabase/supabase-js@2.89.0`. The working `wellness-copilot` function uses `getUser()` successfully. Fix: revert `team-pulse-engine` auth back to the proven `getUser()` pattern.

**File**: `supabase/functions/team-pulse-engine/index.ts` (lines 38-49)
- Replace `getClaims` logic with `anonClient.auth.getUser()` — identical to how `wellness-copilot` authenticates

**2. Add WellnessCopilotCard to OrgDashboard**

**File**: `src/components/dashboard/OrgDashboard.tsx`
- Import `WellnessCopilotCard` from `@/features/wellness-copilot`
- Add it after the `TeamPulseCard` block, wrapped in `ErrorBoundary`, gated on `employee?.id`

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/team-pulse-engine/index.ts` | Revert auth to `getUser()` pattern |
| `src/components/dashboard/OrgDashboard.tsx` | Add `WellnessCopilotCard` import + render |

