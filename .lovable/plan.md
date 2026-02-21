

# Organizational Filters and Custom Date Range for Wellness Dashboard

## Overview

Enhance the Organization Wellness Dashboard with two major capabilities:
1. **Organizational structure filters** -- filter all analytics by Branch, Division, Department, and Section
2. **Custom date range** -- add a date picker option alongside the existing 7/30/90-day presets

All KPIs and charts will respect both the selected org filter and date range simultaneously.

---

## How It Works

### Filtering Strategy

Both `mood_entries` and `employee_responses` link to `employees` via `employee_id`. The `employees` table carries `branch_id`, `department_id`, and `section_id`. Division is resolved through `departments.division_id`.

When an org filter is active:
1. First, fetch matching employee IDs from the `employees` table based on the selected filter
2. Then, apply `.in('employee_id', matchedIds)` to all `mood_entries` and `employee_responses` queries
3. Active employee count is also scoped to the filtered set

This keeps all data aggregated (no individual data exposed) while slicing by organizational unit.

### Custom Date Range

The `TimeRange` type expands from `7 | 30 | 90` to also accept `'custom'`. When custom is selected, a date picker appears allowing the user to choose a start and end date. The hook receives explicit `startDate` and `endDate` strings instead of computing from a preset number.

---

## Technical Changes

### File: `src/hooks/useOrgAnalytics.ts`

**Changes:**
- Expand `TimeRange` type to `7 | 30 | 90 | 'custom'`
- Add new interface `OrgFilter` with optional fields: `branchId`, `divisionId`, `departmentId`, `sectionId`
- Change hook signature to: `useOrgAnalytics(timeRange, customStart?, customEnd?, orgFilter?)`
- Add query key dependencies for all filter params
- When `orgFilter` has any value set:
  - Query `employees` table filtered by the selected org unit to get a set of employee IDs
  - If `divisionId` is set (but no department), first resolve department IDs from `departments` where `division_id` matches, then get employees in those departments
  - Apply `.in('employee_id', filteredIds)` to all `mood_entries`, `employee_responses`, and `scheduled_questions` queries
  - Scope `activeEmployees` count to the filtered set
- When `timeRange === 'custom'`, use the provided `customStart`/`customEnd` dates instead of computing from `subDays`

### File: `src/components/dashboard/TimeRangeSelector.tsx`

**Changes:**
- Add a "Custom" toggle option alongside 7d/30d/90d
- When "Custom" is selected, render two date inputs (start date, end date) using the existing Calendar/Popover components
- New props: `customStart`, `customEnd`, `onCustomChange`
- Validate that end date is after start date

### File: `src/components/dashboard/OrgFilterBar.tsx` (NEW)

A new filter bar component that renders:
- **Branch** dropdown (from `useBranches` hook)
- **Division** dropdown (from `useDivisions` hook)
- **Department** dropdown (from `useDepartments` hook, filtered by selected division if any)
- **Section** dropdown (from `useSites` hook -- which stores Sections per the project architecture, filtered by selected department if any)
- A "Clear Filters" button
- Cascading logic: selecting a Division filters Department options; selecting a Department filters Section options
- All dropdowns use the existing Shadcn Select component

### File: `src/components/dashboard/OrgDashboard.tsx`

**Changes:**
- Add state for `orgFilter` (branchId, divisionId, departmentId, sectionId)
- Add state for `customStart` and `customEnd` dates
- Render the new `OrgFilterBar` component below the header/time range row
- Pass all filter state to `useOrgAnalytics`
- Show a small indicator/badge when filters are active so the user knows data is scoped

### File: `src/locales/en.json` and `src/locales/ar.json`

New keys under `orgDashboard`:
- `filterByBranch`, `filterByDivision`, `filterByDepartment`, `filterBySection`
- `clearFilters`, `filtersActive`, `customRange`, `startDate`, `endDate`
- `allBranches`, `allDivisions`, `allDepartments`, `allSections`

---

## Files Summary

| Action | File |
|---|---|
| Modify | `src/hooks/useOrgAnalytics.ts` (add org filter + custom date logic) |
| Modify | `src/components/dashboard/TimeRangeSelector.tsx` (add custom option + date pickers) |
| New | `src/components/dashboard/OrgFilterBar.tsx` (org structure dropdowns) |
| Modify | `src/components/dashboard/OrgDashboard.tsx` (wire filter state) |
| Modify | `src/locales/en.json` (new translation keys) |
| Modify | `src/locales/ar.json` (new translation keys) |

---

## Edge Cases Handled

- **No employees match filter**: All KPIs show 0 / "--", charts show "No Data" message
- **Division filter without department**: Resolves departments under that division first, then gets employees
- **Custom date range validation**: End date must be after start date; defaults to last 30 days if invalid
- **Large employee sets**: The `.in()` filter has a Supabase limit; if the filtered employee set exceeds 1000, the queries will be batched
- **Cascading resets**: Changing Branch clears Division/Department/Section; changing Division clears Department/Section; changing Department clears Section

