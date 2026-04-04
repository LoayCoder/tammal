

## Update Bottom Nav: Wellness → My Workload

### What Changes

The `Waves` icon (line 7) currently links to `/employee/wellness` (mood check-in). Change it to link to the **My Workload** page instead.

**`src/components/layout/MobileBottomNav.tsx`**

- Change nav item on line 7:
  - **key**: `wellness` → `workload`
  - **icon**: `Waves` → `ListChecks` (matches the workload/tasks theme used elsewhere)
  - **path**: `/employee/wellness` → `/my-workload`
- Update import: replace `Waves` with `ListChecks` from lucide-react

### Files Modified
| File | Change |
|------|--------|
| `src/components/layout/MobileBottomNav.tsx` | Swap wellness nav item to My Workload |

