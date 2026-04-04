

## Premium VIP Upgrade for /my-workload Page

### Current State
The page uses generic `Card className="border-0 bg-muted/30"` for all stat cards, capacity gauge, and task list — flat, muted style that doesn't match the Premium VIP design language used elsewhere in the app.

### Changes

**1. `src/pages/employee/PersonalCommandCenter.tsx` — Premium layout overhaul**

- **Header**: Use `PageHeader` system component (consistent with TeamWorkload) instead of raw `div` + `h1`
- **Stats Row**: Replace 5 separate `Card` components with a single premium panel using horizontal stat layout with subtle vertical dividers (matches Premium VIP pattern). Use `premium-card` class instead of `bg-muted/30`
- **Capacity Gauge**: Wrap in `premium-card` class, remove the `Collapsible` wrapper (keep it always visible — cleaner, less UI noise)
- **View Switcher**: Already using pill toggle — keep as-is, just ensure it sits cleanly
- **Spacing**: Use `space-y-5` for breathing room per VIP pattern

**2. `src/features/workload/components/WorkloadTasksView.tsx` — Cleaner task container**

- Remove the wrapping `Card` around the `Tabs` — let the tab content flow directly (reduce card-in-card nesting per VIP rules)
- Use `premium-card` for the outer container if border is needed
- Tabs pill-style already fine

**3. `src/components/workload/employee/UnifiedTaskList.tsx` — Refined task rows**

- Simplify badge density: reduce the 4+ inline badges per row to essential ones only (status + priority), move source to metadata row
- Increase row padding slightly (`py-4`) for breathing room
- Use cleaner separator (`divide-border/30` instead of `/50`)

**4. `src/components/workload/employee/CapacityGauge.tsx` — Visual refinement**

- Increase bar height from `h-2.5` to `h-3` with smoother gradient
- Use `font-bold` for percentage display

### Files Modified
| File | Change |
|------|--------|
| `src/pages/employee/PersonalCommandCenter.tsx` | PageHeader, premium-card stats panel, remove Collapsible, VIP spacing |
| `src/features/workload/components/WorkloadTasksView.tsx` | Remove Card wrapper, cleaner container |
| `src/components/workload/employee/UnifiedTaskList.tsx` | Reduce badge clutter, better spacing |
| `src/components/workload/employee/CapacityGauge.tsx` | Slightly taller bar, bolder text |

