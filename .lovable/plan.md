

# Merge 4 Pages into Unified "My Workload" Hub

## What Changes

Consolidate **My Tasks** (`/my-tasks`), **My Workload** (`/my-workload`), **Approval Queue** (`/approval-queue`), and **Task Calendar** (`/tasks/calendar`) into a single page at `/my-workload`.

## Layout Design

```text
┌─────────────────────────────────────────────────────┐
│  Header: "My Workload" title + Create Task button   │
├─────────────────────────────────────────────────────┤
│  Stats Row: Active | Completed | Overdue | Approvals│
│             Streak | Capacity Gauge (collapsible)   │
├─────────────────────────────────────────────────────┤
│  View Switcher (icon toggle):                       │
│  [📋 Tasks] [📅 Calendar] [✅ Approvals]            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  TASKS VIEW (default):                              │
│    Search + Status/Priority filters                 │
│    Tabs: My Day | Active | Overdue | Completed      │
│    → UnifiedTaskList                                │
│                                                     │
│  CALENDAR VIEW:                                     │
│    Month/Week toggle + nav controls                 │
│    → Full calendar grid (existing TaskCalendar)     │
│                                                     │
│  APPROVALS VIEW:                                    │
│    Pending count badge                              │
│    → Approval cards with approve/reject actions     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Create unified page component
- New file: `src/pages/employee/PersonalCommandCenter.tsx` (rewrite existing)
- Top-level state: `activeView` = `'tasks' | 'calendar' | 'approvals'`
- Shared data: single `useUnifiedTasks` + `useApprovalQueue` + `useGamification` calls
- Stats bar merges both task stats and approval pending count

### 2. Extract view sections into sub-components
- `src/features/workload/components/WorkloadTasksView.tsx` — search, filters, tabbed task list (merges MyTasks + PersonalCommandCenter task logic)
- `src/features/workload/components/WorkloadCalendarView.tsx` — extracted from TaskCalendar (calendar grid + controls, no page header)
- `src/features/workload/components/WorkloadApprovalsView.tsx` — extracted from ApprovalQueue (cards list, no page header)

### 3. View switcher UI
- Three icon buttons (ToggleGroup) below stats: Tasks (ListChecks), Calendar (CalendarDays), Approvals (CheckSquare)
- Approval button shows a count badge when pending > 0
- Persists selection in local state (no URL change needed)

### 4. Update routing
- Remove `/my-tasks`, `/tasks/calendar`, `/approval-queue` routes from `App.tsx`
- Keep `/my-workload` pointing to the rewritten `PersonalCommandCenter`
- Add redirects from old paths to `/my-workload` for bookmarks

### 5. Update sidebar navigation
- Remove "My Tasks", "Task Calendar", "Approval Queue" items from AppSidebar
- Keep single "My Workload" entry

### 6. Localization
- Add new keys: `workload.views.tasks`, `workload.views.calendar`, `workload.views.approvals`
- Update in both `en.json` and `ar.json`

## Technical Notes
- All views share the same `useUnifiedTasks` query — no duplicate fetches
- Approval queue uses its own `useApprovalQueue` hook (different query — reviewer/approver tasks)
- Calendar view is self-contained with its own date state
- RTL: uses ToggleGroup + logical properties, no direction ternaries
- Capacity gauge stays as a collapsible card above the view switcher

