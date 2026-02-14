

# Add Target Audience Configuration to Schedule Dialog

## Overview

Add a Target Audience section to the create/edit schedule dialog, allowing users to choose between "All Employees", "By Department", or "Specific Employees". The database column (`target_audience` JSONB) and backend engine logic already exist -- this is purely a UI addition.

---

## What Changes

### 1. Update Schedule Dialog UI (`ScheduleManagement.tsx`)

Add a new "Target Audience" section in the dialog with three radio-style options:

- **All Employees** (default) -- sets `{ all: true }`
- **By Department** -- shows a multi-select checklist of departments fetched from the `employees` table. Sets `{ all: false, departments: ["HR", "IT", ...] }`
- **Specific Employees** -- shows a searchable multi-select checklist of employees. Sets `{ all: false, specific_employees: ["uuid1", "uuid2", ...] }`

#### New State Variables
- `audienceType: 'all' | 'departments' | 'specific'`
- `selectedDepartments: string[]`
- `selectedEmployees: string[]`

#### Form Integration
- Build the `target_audience` object from these states in `handleSubmit`
- Populate them from schedule data in `openEditDialog`
- Reset them in `resetForm`

### 2. Fetch Available Options

Add two simple queries inside the component (or inline with `useQuery`):
- **Departments**: `SELECT DISTINCT department FROM employees WHERE tenant_id = ? AND deleted_at IS NULL AND department IS NOT NULL`
- **Employees**: `SELECT id, full_name, email, department FROM employees WHERE tenant_id = ? AND deleted_at IS NULL AND status = 'active'`

These will be fetched when the dialog opens and the relevant audience type is selected.

### 3. Update Table Display

The existing table column already shows "All Employees" or "Filtered". Enhance it to show:
- "All Employees" when `target_audience.all === true`
- "X departments" when departments are selected
- "X employees" when specific employees are selected

### 4. Localization

| Key | English | Arabic |
|-----|---------|--------|
| schedules.audienceType | Target Audience | الجمهور المستهدف |
| schedules.allEmployees | All Employees | جميع الموظفين |
| schedules.byDepartment | By Department | حسب القسم |
| schedules.specificEmployees | Specific Employees | موظفين محددين |
| schedules.selectDepartments | Select departments | اختر الأقسام |
| schedules.selectEmployees | Select employees | اختر الموظفين |
| schedules.departmentsSelected | {{count}} departments | {{count}} أقسام |
| schedules.employeesSelected | {{count}} employees | {{count}} موظفين |
| schedules.noEmployeesYet | No employees added yet | لم تتم إضافة موظفين بعد |
| schedules.noDepartmentsYet | No departments found | لم يتم العثور على أقسام |

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/pages/admin/ScheduleManagement.tsx` | Add audience radio group, department/employee multi-selects |
| Edit | `src/locales/en.json` | Add audience i18n keys |
| Edit | `src/locales/ar.json` | Add audience Arabic i18n keys |

No database migration needed -- `target_audience` JSONB column already exists. No backend changes needed -- the schedule engine already processes `departments` and `specific_employees` from `target_audience`.
