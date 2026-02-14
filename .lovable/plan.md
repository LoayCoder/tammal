

# Organization Structure - Full Implementation

## Overview

Build a complete Organization Structure module with three hierarchical levels: **Departments** (with parent-child nesting), **Branches** (physical locations), and **Sites** (sub-locations within branches). Each level supports full CRUD, tree visualization, and integration with the existing employee directory.

---

## Database Design

### 1. `departments` Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid NOT NULL | FK to tenants |
| parent_id | uuid NULL | Self-reference for hierarchy |
| name | text NOT NULL | English name |
| name_ar | text NULL | Arabic name |
| description | text NULL | |
| description_ar | text NULL | |
| head_employee_id | uuid NULL | FK to employees (department head) |
| color | text | Default '#3B82F6' |
| sort_order | integer | Default 0 |
| is_active | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| deleted_at | timestamptz NULL | Soft delete |

### 2. `branches` Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid NOT NULL | |
| name | text NOT NULL | |
| name_ar | text NULL | |
| address | text NULL | |
| address_ar | text NULL | |
| phone | text NULL | |
| email | text NULL | |
| is_active | boolean | Default true |
| created_at / updated_at / deleted_at | timestamptz | |

### 3. `sites` Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid NOT NULL | |
| branch_id | uuid NOT NULL | FK to branches |
| name | text NOT NULL | |
| name_ar | text NULL | |
| address | text NULL | |
| address_ar | text NULL | |
| is_active | boolean | Default true |
| created_at / updated_at / deleted_at | timestamptz | |

### RLS Policies (All Three Tables)

- Super admins: ALL access
- Tenant admins: ALL access for their tenant
- Users: SELECT where tenant matches and deleted_at IS NULL

### Employee Integration

Add two nullable columns to the `employees` table:
- `department_id` (uuid, FK to departments) -- structured reference alongside existing text `department`
- `branch_id` (uuid, FK to branches)

This is additive (non-destructive). The existing `department` text field remains for backward compatibility.

---

## UI Components

### Page Structure (Tabbed Layout)

The OrgStructure page uses three tabs:

```text
+----------------------------------------------------+
| Organization Structure                              |
| [Departments] [Branches] [Sites]                    |
+----------------------------------------------------+
| Tab Content Area                                    |
|                                                     |
| - Tree/Table view of items                          |
| - Add/Edit/Delete actions                           |
| - Employee count badges                             |
| - Search and filter                                 |
+----------------------------------------------------+
```

### Departments Tab

- **Tree View**: Collapsible tree using the Collapsible component showing parent-child hierarchy
- Each node shows: name, employee count badge, department head, color indicator
- Actions: Add child department, Edit, Deactivate (soft delete)
- Add/Edit via Sheet dialog with fields: name, name_ar, description, parent department (select), head employee (select from employees), color

### Branches Tab

- **Table View**: Standard data table with columns: Name, Address, Phone, Email, Sites Count, Status
- Add/Edit via Sheet dialog
- Delete with confirmation (soft delete)

### Sites Tab

- **Table View**: Columns: Name, Branch (parent), Address, Status
- Filtered by branch (optional)
- Add/Edit via Sheet dialog with branch selector

---

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useDepartments.ts` | CRUD hook for departments table |
| `src/hooks/useBranches.ts` | CRUD hook for branches table |
| `src/hooks/useSites.ts` | CRUD hook for sites table |
| `src/components/org/DepartmentTree.tsx` | Recursive tree view of departments |
| `src/components/org/DepartmentSheet.tsx` | Add/Edit department form |
| `src/components/org/BranchTable.tsx` | Branches data table |
| `src/components/org/BranchSheet.tsx` | Add/Edit branch form |
| `src/components/org/SiteTable.tsx` | Sites data table |
| `src/components/org/SiteSheet.tsx` | Add/Edit site form |

## Files to Edit

| File | Change |
|------|--------|
| `src/pages/admin/OrgStructure.tsx` | Full rewrite with tabs and integration |
| `src/locales/en.json` | Expand organization, branches, sites keys |
| `src/locales/ar.json` | Corresponding Arabic translations |
| Database migration | Create 3 tables, add columns to employees, RLS policies |

---

## Technical Notes

- All components use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`) for RTL support
- Directional icons (chevrons in tree) use `rtl:-scale-x-100` for proper RTL flipping
- Department tree uses recursive rendering with `Collapsible` from Radix
- Employee counts are computed client-side by counting employees matching each `department_id`
- Soft deletes throughout (deleted_at timestamp, filtered in queries)
- Audit logging for create/update/delete operations via the existing audit hook

