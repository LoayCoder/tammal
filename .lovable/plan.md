

# Merge Team Task Overview + Team Workload into "Team Command Center"

## Current State
Two separate pages serve overlapping purposes:
- `/tasks/team` (ManagerTaskOverview) -- member cards with task summaries, risk badges, progress bars
- `/admin/workload/team` (TeamWorkload) -- KPIs, charts, flat task table, quadrants, risk alerts

## Proposed Unified Page: Team Command Center

**Route**: Keep `/admin/workload/team` as the canonical route. Redirect `/tasks/team` to it.

**Layout** (top to bottom):

1. **Header** -- "Team Command Center" title + Quick Assign / Create Task buttons
2. **KPI Row** -- Merge stats from both pages (team size, active, completed, overdue, at-risk)
3. **Workload Distribution chart + Execution Metrics** -- Keep from TeamWorkload
4. **Risk Alerts banner** -- Keep from TeamWorkload (conditional)
5. **Team Members Accordion** -- The core change:
   - Each employee is a collapsible `Accordion` item
   - **Trigger row**: Employee name, role, risk badge, mini-stats (active/completed/overdue/progress bar)
   - **Expanded content**: Filtered task table for that employee (status, priority, due date, actions)
   - Search + sort controls above the accordion (filter by name, sort by overdue/active/progress)
6. **Objective Alignment** -- Keep at bottom

## Technical Implementation

### Files Modified
- **`src/pages/admin/TeamWorkload.tsx`** -- Rewrite to merge both pages. Replace the flat `DataTable` with an `Accordion` that groups tasks by `employee_id`. Each accordion item shows the member summary (from ManagerTaskOverview's card design) as the trigger, and their tasks as collapsible content.
- **`src/features/tasks/pages/ManagerTaskOverview.tsx`** -- Keep file but make it redirect to `/admin/workload/team`
- **`src/App.tsx`** -- Update `/tasks/team` route to redirect to `/admin/workload/team`
- **`src/components/layout/AppSidebar.tsx`** -- Remove duplicate nav entry for Manager Task Overview, keep single "Team Command Center" entry

### Data Strategy
- Use both `useManagerTaskOverview()` (for direct reports + their tasks) and existing `useDepartmentTasks()` hooks
- Group `filteredTasks` by `employee_id` into a `Map<string, Task[]>`
- Each accordion item renders per-employee task rows with lock/unlock/delete actions
- Filters (status, priority, source, search) apply globally, then tasks are distributed into per-employee groups

### Removed Sections
- Quadrants grid (redundant with per-employee risk badges in accordion)
- Initiative Risk Indicators (low value, clutters page)

### Kept Sections
- KPI cards, Workload Distribution chart, Execution Metrics, Risk Alerts, Objective Alignment
- All task actions (lock, unlock, delete)
- Quick Assign + Create Task dialogs

