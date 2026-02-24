

# Check-in & Mood Monitoring Dashboard

## Overview

Create a new admin page at `/admin/checkin-monitor` that provides the same level of operational monitoring for the Daily Check-in workflow as the Survey Monitor provides for surveys. This gives admins real-time visibility into employee check-in participation, mood trends, department breakdowns, and individual employee engagement -- all driven by live data from the `mood_entries` table.

---

## What the Admin Will See

### Header Section
- Page title with icon
- Date range selector (Today, Last 7 Days, Last 30 Days, Custom)
- Active daily_checkin schedule indicator (pulled from `question_schedules` where `schedule_type = 'daily_checkin'`)

### Participation Overview Cards (6 cards)
- **Total Employees** -- All active employees in the tenant (or filtered org unit)
- **Checked In Today** -- Employees with a `mood_entries` row for today
- **Not Checked In** -- Active employees without today's entry
- **Participation Rate** -- Today's check-in percentage
- **Avg Mood Score** -- Today's average mood_score (with trend arrow vs yesterday)
- **Avg Streak** -- Average streak_count across today's entries

### Mood Distribution Bar
- Horizontal stacked bar showing today's mood breakdown by mood_level (e.g., great/good/okay/struggling/need_help), color-coded using mood_definitions

### Department Heatmap
- Reuses the same visual pattern as the survey monitor's DepartmentHeatmap
- Shows per-department: "X/Y employees checked in (Z%)"
- Color-coded by participation rate (green >= 80%, yellow >= 50%, red < 50%)

### Organization Filter Bar
- Branch / Division / Department cascading filters (reuse existing `OrgFilterBar` component)
- All stats, heatmap, employee table, and charts filter accordingly

### Employee Check-in Table
- Columns: Employee Name, Department, Today's Status (Checked In / Not Yet), Mood (emoji + level), Streak, Last Check-in Date
- Searchable by name, sortable by status/streak/mood
- Follows the same pattern as the survey monitor's `EmployeeStatusTable`

### Mood Trend Chart
- Line/area chart showing daily average mood score over the selected date range
- Secondary line showing daily participation count
- Uses `recharts` AreaChart, consistent with existing dashboard charts

### Risk & Engagement Panel
- Employees with 3+ consecutive low moods (score <= 2) -- flagged as "At Risk"
- Employees who haven't checked in for 3+ consecutive days -- flagged as "Disengaged"
- Departments with participation below 50% -- flagged as "Low Engagement"
- All data computed live from `mood_entries`, no new tables needed

---

## Technical Details

### No Database Changes Required
All data needed is already available:
- `mood_entries` -- Check-in records with mood_level, mood_score, entry_date, employee_id, streak_count, support_actions
- `employees` -- Employee names, department_id, branch_id, status
- `departments` -- Department names (bilingual), division_id, branch_id
- `question_schedules` -- To show active daily_checkin schedule status
- `mood_definitions` -- For mood emoji/color mapping

### New Hook: `src/hooks/analytics/useCheckinMonitor.ts`

Parameters: `tenantId`, `dateRange` (today/7d/30d/custom), `orgFilters` (branch/division/department)

Returns:
- `participationStats` -- Today's check-in counts and rates
- `moodBreakdown` -- Today's mood distribution by level
- `departmentStats` -- Per-department participation and avg mood
- `employeeList` -- Full employee list with check-in status, mood, streak
- `trendData` -- Daily avg mood and participation count over the date range
- `riskAlerts` -- Employees with consecutive low moods or missed check-ins

Logic:
1. Fetch all active employees (filtered by org if needed)
2. Fetch `mood_entries` for the selected date range
3. Cross-reference to compute who checked in today vs who didn't
4. Group by department for heatmap
5. Compute daily averages for trend chart
6. Detect risk patterns (3+ low scores, 3+ missed days)

### New Page: `src/pages/admin/CheckinMonitor.tsx`

Layout mirrors the Survey Monitor structure:
1. Header with date range selector
2. OrgFilterBar (reused from survey-monitor)
3. ParticipationOverview cards (new checkin-specific component)
4. Mood distribution bar (new component)
5. Two-column: Department Heatmap + Risk Panel
6. Employee Check-in Table
7. Mood Trend Chart

### New Components (in `src/components/checkin-monitor/`)

| Component | Purpose |
|---|---|
| `CheckinOverview.tsx` | 6 stat cards (employees, checked in, not yet, rate, avg mood, avg streak) |
| `MoodDistributionBar.tsx` | Horizontal stacked bar for today's mood levels |
| `CheckinDepartmentHeatmap.tsx` | Department participation heatmap (reuses visual pattern) |
| `CheckinEmployeeTable.tsx` | Employee table with mood emoji, streak, status |
| `CheckinTrendChart.tsx` | Dual-axis area chart (avg mood + participation count) |
| `CheckinRiskPanel.tsx` | At-risk employees and disengaged alerts |

### Route & Sidebar

- Route: `/admin/checkin-monitor` wrapped in `AdminRoute`
- Sidebar: Add under the "Wellness" group (after the existing wellness items for admin view), with an `Activity` icon and label `t('nav.checkinMonitor')`

### Localization

All new UI strings added to both `en.json` and `ar.json` under a `checkinMonitor` namespace:
- `title`, `subtitle`, `dateRange.*`, `stats.*`, `employeeTable.*`, `risk.*`, `moodLevels.*`

### RTL Compliance

- All components use logical properties (ms-, me-, ps-, pe-, text-start, text-end)
- No directional CSS (ml-, mr-, left-, right-)
- Charts use `hsl(var(...))` CSS variables for colors

### Implementation Order

1. Create `useCheckinMonitor` hook with all data fetching and computation
2. Create the 6 sub-components in `src/components/checkin-monitor/`
3. Create `CheckinMonitor.tsx` page assembling everything
4. Add route to `App.tsx` and sidebar link to `AppSidebar.tsx`
5. Add all localization keys to `en.json` and `ar.json`

### Reuse from Survey Monitor

- `OrgFilterBar` component -- reused directly (already generic)
- Visual patterns from `DepartmentHeatmap`, `EmployeeStatusTable`, `RiskPanel` -- adapted for check-in context
- Same card/chart styling and color conventions

