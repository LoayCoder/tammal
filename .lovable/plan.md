

# Fix Survey Monitor: Full Functionality, Real Data, No Gaps

## Issues Found

1. **Trend Chart Always Empty** -- The `ParticipationTrend` relies on `survey_monitor_snapshots` table which has zero rows. No mechanism exists to populate it. The chart should compute trend data live from `employee_responses` timestamps instead.

2. **Department Heatmap Shows Question Counts, Not Employee Counts** -- Currently displays "50/25 (50%)" which is confusing. It counts per-question completion, not per-employee. Should aggregate at the employee level: an employee is "completed" if ALL their questions are answered.

3. **No Employee-Level Detail** -- The dashboard lacks any visibility into which employees have completed, are in progress, or haven't started. Admin needs an employee breakdown table.

4. **No Branch/Division Filter** -- The dashboard only has the survey selector. Missing org-structure filters (Branch, Division, Department) to drill down into participation data.

5. **Stats Count Questions Not Employees** -- `totalTargeted: 50` is misleading when there are only 2 employees with 25 questions each. Should show both question-level and employee-level metrics.

6. **`survey_monitor_snapshots` Table Unused** -- Table exists but nothing writes to it. Either populate it or replace with live computation.

---

## Solution

### 1. Rewrite `useSurveyMonitor` Hook -- Employee-Centric Metrics

Refactor the hook to compute stats at **employee level** (primary) alongside question-level detail:

- **Employee Stats**: Total employees targeted, employees completed (all questions answered), employees in progress (some answered/draft), employees not started
- **Question Stats**: Keep existing question-level breakdown as secondary detail
- **Department Stats**: Compute per-department using employee-level completion (employee completed = all their questions answered)
- **Employee List**: Return full employee breakdown (name, department, status, question progress) for the detail table
- **Live Trend Data**: Instead of relying on empty `survey_monitor_snapshots`, compute trend from `employee_responses.created_at` -- group responses by date to show how completion grew over time

### 2. Add Org-Structure Filters to SurveyMonitor Page

Add filter bar with:
- **Branch** filter (from `branches` table)
- **Division** filter (from `divisions` table)  
- **Department** filter (from `departments` table, cascading based on selected division/branch)

Filters narrow down all stats, heatmap, employee list, and trend chart. Uses existing `useBranches`, `useDivisions`, `useDepartments` hooks.

### 3. New Component: `EmployeeStatusTable`

A new table component showing per-employee breakdown:
- Employee name (bilingual)
- Department name (bilingual)
- Status badge (Completed / In Progress / Not Started)
- Progress fraction (e.g., "15/25 questions")
- Last activity timestamp

Searchable by employee name. Sortable by status and progress.

### 4. Fix `ParticipationTrend` -- Live Computed Chart

Replace snapshot-based approach with live computation:
- Query `employee_responses` for the selected schedule, grouped by `DATE(created_at)`
- Build cumulative completion curve showing how many employees completed over time
- Show both "completed responses" and "completion %" lines

### 5. Fix `DepartmentHeatmap` -- Employee-Level Rates

Change display from question counts to employee counts:
- "2 employees: 1/2 completed (50%)" instead of "50/25 questions"
- Color coding remains the same (green >= 80%, yellow >= 50%, red < 50%)

### 6. Fix `ParticipationOverview` -- Dual Metrics

Show employee-level metrics as the primary row and question-level as secondary:
- Primary cards: Employees Targeted, Employees Completed, Employees In Progress, Employees Not Started
- Secondary row: Total Questions, Questions Answered, Completion %

---

## Technical Details

### Files Modified

**`src/hooks/analytics/useSurveyMonitor.ts`** -- Major rewrite:
- Add `EmployeeStatus` interface (employeeId, name, departmentId, departmentName, totalQuestions, answeredQuestions, status, lastActivity)
- Add org-filter parameters (branchId, divisionId, departmentId)
- Compute employee-level stats by grouping `scheduled_questions` by `employee_id`
- Compute live trend from `employee_responses.created_at` grouped by date
- Join `employees` table to get `full_name`, `department_id`, `branch_id`
- Join `departments` to get department name for display
- Filter employees by org-structure when filters are applied

**`src/pages/admin/SurveyMonitor.tsx`** -- Add filter bar and employee table:
- Import and use `useBranches`, `useDivisions`, `useDepartments` for filter dropdowns
- Add filter state (selectedBranch, selectedDivision, selectedDepartment)
- Pass filters to `useSurveyMonitor`
- Add `EmployeeStatusTable` below heatmap section
- Auto-select first survey if only one exists

**`src/components/survey-monitor/ParticipationOverview.tsx`** -- Dual metrics:
- Accept both employee-level and question-level stats
- Show employee metrics as primary cards
- Show question metrics as secondary smaller cards

**`src/components/survey-monitor/DepartmentHeatmap.tsx`** -- Employee-level display:
- Change interface to include `employeeCount` and `employeesCompleted`
- Display "X/Y employees (Z%)" instead of question counts

**`src/components/survey-monitor/ParticipationTrend.tsx`** -- Live trend:
- Accept `trendData` computed from responses instead of snapshots
- Show cumulative completion curve with dual lines (count + percentage)

**`src/components/survey-monitor/OrgFilterBar.tsx`** -- New component:
- Three cascading Select dropdowns: Branch, Division, Department
- "Clear Filters" button
- Compact responsive layout

**`src/components/survey-monitor/EmployeeStatusTable.tsx`** -- New component:
- Table with columns: Employee Name, Department, Status, Progress, Last Activity
- Search input for filtering by name
- Status badges with appropriate colors
- Sortable columns

### Files Created
- `src/components/survey-monitor/OrgFilterBar.tsx`
- `src/components/survey-monitor/EmployeeStatusTable.tsx`

### Localization
- Add all new keys to `src/locales/en.json` and `src/locales/ar.json` under `surveyMonitor` namespace

### No Database Changes Required
- All data is already available in existing tables
- The `survey_monitor_snapshots` table remains but is no longer the primary data source for the trend chart

