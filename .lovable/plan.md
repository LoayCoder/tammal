

# Add Workload Indicator to Organization Wellness Page

## What Changes

Add a **Workload Health** section to the Organization Wellness dashboard (`OrgDashboard`) that surfaces team workload metrics alongside the existing wellness/mood analytics. This creates a unified view connecting employee wellbeing with work capacity.

## Where It Goes

Insert a new `OrgWorkloadIndicator` card **between the StatCards and the Tabs** in `OrgDashboard.tsx`. This positions workload context right after the top-level stats and before the deep-dive tabs.

```text
┌──────────────────────────────────────────────┐
│  Dashboard Header + Time Range               │
│  Org Filter Bar                              │
│  Stat Cards (6 existing)                     │
├──────────────────────────────────────────────┤
│  ┌── NEW: Workload Health Indicator ───────┐ │
│  │  4-col summary:                         │ │
│  │  Avg Load | At Risk | Off-Hours | Total │ │
│  │                                         │ │
│  │  Department bar chart (avg hours/day)   │ │
│  │  Top 5 overloaded employees list        │ │
│  └─────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  Tabs: Overview | Deep Analysis | Alerts...  │
└──────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Create `OrgWorkloadIndicator` component
- New file: `src/features/org-dashboard/components/OrgWorkloadIndicator.tsx`
- Uses existing `useWorkloadAnalytics()` hook — already provides `teamLoad`, `avgLoadMinutes`, `atRiskCount`, `offHoursWorkers`, `totalEmployees`
- **Top row**: 4 mini KPI cards with semantic colors:
  - Avg Daily Load (blue) — `avgLoadMinutes` converted to hours
  - At-Risk Employees (red) — `atRiskCount`
  - Off-Hours Workers (amber) — `offHoursWorkers`
  - Total Workforce (green) — `totalEmployees`
- **Department breakdown**: Horizontal bar chart showing average estimated hours per department (aggregate `teamLoad` by department)
- **Overloaded list**: Top 5 employees with highest `estimatedMinutes`, showing name + department + a mini progress bar (capacity vs 480min)
- Glass-card styling consistent with existing dashboard cards

### 2. Integrate into `OrgDashboard.tsx`
- Import `OrgWorkloadIndicator`
- Render it between `<StatCards />` and the `<Tabs>` block
- Wrap in `<ErrorBoundary>`

### 3. Localization
- Add keys to `en.json` and `ar.json`:
  - `orgDashboard.workloadHealth` (section title)
  - `orgDashboard.avgDailyLoad`
  - `orgDashboard.atRiskEmployees`
  - `orgDashboard.offHoursWorkers`
  - `orgDashboard.overloadedEmployees`
  - `orgDashboard.hoursPerDay`

## Technical Notes
- Reuses `useWorkloadAnalytics` — no new queries or DB changes
- Department aggregation done client-side from `teamLoad` array
- RTL-safe: logical properties only, bar chart uses Recharts (direction-agnostic)
- No new dependencies

