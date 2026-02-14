

# Restructure Organization Hierarchy: Branch -> Department -> Site

## What Changes

The current structure has Departments and Sites as separate entities both hanging off Branches independently. The correct hierarchy should be:

**Branch (top) -> Department (middle) -> Site (bottom)**

This means:
- A **Department** must belong to a **Branch**
- A **Site** must belong to a **Department** (not directly to a Branch)
- A **Department Manager** (head_employee_id) should only see data within their own department

---

## Database Changes

### 1. Add `branch_id` to `departments` table
- New nullable column `branch_id` (uuid) referencing `branches(id)`
- Every department must be assigned to a branch

### 2. Change `sites` foreign key from `branch_id` to `department_id`
- Add new column `department_id` (uuid) referencing `departments(id)` to `sites`
- Keep `branch_id` on sites for backward compatibility (can be auto-derived from department's branch)
- Sites are now created under a department, and the branch is inherited automatically

### 3. Data Isolation RLS
- Add a database function `get_user_department_id()` that returns the department_id of the current user's employee record
- Add restrictive RLS policies so that users with `manager` base_role can only see employees, sites, and data within their own department
- Super admins and tenant admins retain full access

---

## UI Changes

### DepartmentSheet - Add Branch Selector
- Add a required "Branch" dropdown to the department creation/edit form
- When creating a department, user must first select which branch it belongs to

### SiteSheet - Change to Department Selector
- Replace the "Branch" dropdown with a "Department" dropdown
- The branch is auto-derived from the selected department and shown as read-only info

### OrgStructure Page - Visual Hierarchy
- Branches tab shows branches with a count of departments (not sites)
- Departments tab shows departments grouped/filterable by branch, with site count
- Sites tab shows sites with their parent department and grandparent branch displayed

### DepartmentTree - Show Branch Context
- Each department node displays which branch it belongs to
- Department tree can be filtered by branch

---

## Files to Change

| Action | File | Purpose |
|--------|------|---------|
| Migration | Database | Add `branch_id` to departments, add `department_id` to sites, create `get_user_department_id()` function, add manager-scoped RLS policies |
| Edit | `src/hooks/useDepartments.ts` | Update DepartmentInput type to include `branch_id` |
| Edit | `src/hooks/useSites.ts` | Update SiteInput to include `department_id`, make `branch_id` optional (auto-derived) |
| Edit | `src/components/org/DepartmentSheet.tsx` | Add required Branch selector field |
| Edit | `src/components/org/DepartmentTree.tsx` | Show branch name on each node |
| Edit | `src/components/org/SiteSheet.tsx` | Replace Branch selector with Department selector, auto-fill branch |
| Edit | `src/components/org/SiteTable.tsx` | Add Department column, show both department and branch |
| Edit | `src/components/org/BranchTable.tsx` | Show department count instead of site count |
| Edit | `src/pages/admin/OrgStructure.tsx` | Pass departments to BranchTable, pass branches+departments to SiteSheet |
| Edit | `src/locales/en.json` | Add new keys (department.branch, sites.department, etc.) |
| Edit | `src/locales/ar.json` | Corresponding Arabic translations |

---

## Technical Details

### Database Migration SQL (Key Parts)

```sql
-- 1. Add branch_id to departments
ALTER TABLE public.departments 
  ADD COLUMN branch_id uuid REFERENCES public.branches(id);

-- 2. Add department_id to sites
ALTER TABLE public.sites 
  ADD COLUMN department_id uuid REFERENCES public.departments(id);

-- 3. Helper function to get user's department
CREATE OR REPLACE FUNCTION public.get_user_department_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT department_id FROM employees 
  WHERE user_id = _user_id AND deleted_at IS NULL 
  LIMIT 1
$$;

-- 4. Manager-scoped RLS: employees table
-- Managers can only see employees in their department
CREATE POLICY "Managers see own department employees"
  ON employees FOR SELECT
  USING (
    department_id = get_user_department_id(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND deleted_at IS NULL
  );
```

### Hierarchy Flow in UI

```text
Branch (Riyadh HQ)
  +-- Department (Engineering)
  |     +-- Site (Building A)
  |     +-- Site (Building B)
  +-- Department (HR)
        +-- Site (Floor 3)
```

### Data Isolation Logic

- **Super Admin**: Sees everything across all tenants
- **Tenant Admin**: Sees everything within their tenant
- **Manager**: Sees only their own department's employees, sites, and sub-departments
- **Regular User**: Sees only their own data

