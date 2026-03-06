

# Add Task Overview Widget to Employee Dashboard

## What Changes

Add a compact **"My Workload at a Glance"** card to `EmployeeHome.tsx` that gives employees a quick summary of their task status without leaving the dashboard. Positioned after the gamification badges and before the check-in section.

## Widget Design

```text
┌─────────────────────────────────────────────────┐
│  📋 My Workload                    View All →   │
├─────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │  5   │ │  2   │ │  1   │ │  3   │           │
│  │Active│ │ Done │ │Overdue│ │Pending│          │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                 │
│  Progress: ████████░░░░░░░░░░  40%              │
│                                                 │
│  ┌─ Upcoming ──────────────────────────────┐    │
│  │ 🔴 Finalize report         Due: Mar 7   │    │
│  │ 🟡 Review proposal         Due: Mar 8   │    │
│  │ 🟢 Team standup notes      Due: Mar 10  │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Create `DashboardWorkloadWidget` component
- New file: `src/components/dashboard/DashboardWorkloadWidget.tsx`
- Takes `employeeId` prop
- Calls `useUnifiedTasks(employeeId)` and `useApprovalQueue()`
- Computes stats: active, completed, overdue, pending approvals
- Computes overall completion rate as a progress bar
- Shows up to 3 upcoming tasks (nearest due dates, non-completed) with priority color dots
- "View All" link navigates to `/my-workload`

### 2. Integrate into EmployeeHome
- Import and render `<DashboardWorkloadWidget>` after gamification badges, before the check-in card
- Pass `employee.id`

### 3. Localization
- Add keys: `dashboard.workloadWidget.title`, `dashboard.workloadWidget.viewAll`, `dashboard.workloadWidget.upcoming`, `dashboard.workloadWidget.completionRate`, `dashboard.workloadWidget.pendingApprovals`
- Both `en.json` and `ar.json`

## Technical Notes
- Reuses existing `useUnifiedTasks` hook — no new queries
- Uses `Progress` component for completion bar
- Priority colors: critical=destructive, high=chart-4, medium=chart-2, low=chart-1
- RTL-safe: logical properties only, `rtl:rotate-180` on chevron
- Compact card style matching existing `glass-card` pattern

