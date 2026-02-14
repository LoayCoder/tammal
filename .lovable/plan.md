

# Improve Target Audience Visibility in Schedules

## Overview

Add real-time audience resolution to the Schedule Management page so administrators can see exactly which employees are targeted, how many are included, and verify inclusion per-person. This involves two main additions: an audience summary in the schedule table/dialog and a detailed audience viewer with per-employee inclusion status.

---

## What Changes

### 1. Audience Summary in Schedule Table

Enhance the existing "Target Audience" column in the schedules table to show resolved counts:

- Instead of just "All Employees", show "All Employees (3/3)"
- Instead of "2 departments", show "2 departments (5/8 employees)"
- Instead of "3 employees", show "3 of 8 employees"

This requires computing the resolved employee count by cross-referencing the schedule's `target_audience` with the actual `availableEmployees` list.

### 2. Audience Summary Card in Create/Edit Dialog

Add a live summary panel inside the dialog (below the Target Audience radio group) that shows:

- Audience Type label (All / By Department / Specific)
- Resolved count: "X of Y employees included"
- A progress-style indicator (e.g., Badge with fraction)

This updates in real-time as the user changes audience settings.

### 3. Target Audience Detail Viewer (New Dialog)

Add a "View Audience" button (eye icon) next to each schedule in the table, opening a new dialog:

- **Header**: Schedule name, audience type, summary badge ("X of Y included")
- **Collapsible panel** using the existing Collapsible component
- **Searchable employee table** with columns: Name, Email, Department, Status (inclusion badge)
- Inclusion badges:
  - Green checkmark: "Included"
  - Red X: "Not Included"
- Search filters by name, email, department
- Real-time: fetches all active employees and computes inclusion against the schedule's `target_audience`

### 4. Audience Resolution Logic

Create a utility function `resolveAudience` that takes:
- `target_audience` object from the schedule
- Full list of active employees

Returns:
- `includedEmployees`: employees matching the criteria
- `excludedEmployees`: employees not matching
- `totalEligible`: total active employee count
- `includedCount`: number included

Logic:
- `all: true` --> everyone included
- `departments: [...]` --> match by `employee.department`
- `specific_employees: [...]` --> match by `employee.id`

### 5. Localization

| Key | EN | AR |
|-----|----|----|
| `schedules.audienceSummary` | Target Audience Summary | ملخص الجمهور المستهدف |
| `schedules.includedCount` | {{included}} of {{total}} included | {{included}} من {{total}} مشمول |
| `schedules.viewAudience` | View Audience | عرض الجمهور |
| `schedules.included` | Included | مشمول |
| `schedules.notIncluded` | Not Included | غير مشمول |
| `schedules.audienceDetails` | Audience Details | تفاصيل الجمهور |
| `schedules.searchAudience` | Search by name, email, or department | البحث بالاسم أو البريد أو القسم |
| `schedules.allIncluded` | All employees are included | جميع الموظفين مشمولون |

---

## Technical Details

### Files to Change

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/pages/admin/ScheduleManagement.tsx` | Add audience resolution logic, summary display in table and dialog, new audience detail viewer dialog |
| Edit | `src/locales/en.json` | Add audience visibility i18n keys |
| Edit | `src/locales/ar.json` | Add audience visibility Arabic i18n keys |

### Implementation Notes

- The `availableEmployees` query already exists in the component -- reuse it for resolution
- No new database queries needed; audience resolution is purely client-side computation against the already-fetched employee list
- The detail viewer dialog reuses existing `Table`, `Badge`, `ScrollArea`, `Collapsible`, `Input` components
- Dialog width set to `sm:max-w-[600px]` with `ScrollArea` for large employee lists
- Uses logical properties (`me-`, `ms-`, `ps-`, `text-start`) per RTL guidelines

