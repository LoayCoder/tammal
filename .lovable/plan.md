
# Organization Structure Expansion: 5-Level Hierarchy

## New Hierarchy

```text
Branch (physical office/location) -- independent
Division (organizational grouping) -- independent
Department (linked to Division)
Section (linked to Department) -- current "sites" table
Site (physical work location, assignable to Section OR Department)
```

## Database Changes

### 1. New `divisions` table
A new table since `branches` is being restored to its original "Branch" meaning. Columns:
- `id` (uuid, PK)
- `tenant_id` (uuid, NOT NULL)
- `name` (text, NOT NULL)
- `name_ar` (text)
- `description` (text)
- `description_ar` (text)
- `is_active` (boolean, default true)
- `created_at`, `updated_at`, `deleted_at` (timestamps)

RLS policies: same pattern as branches (super_admin ALL, tenant_admin ALL, users SELECT within tenant).

### 2. Add `division_id` column to `departments`
- New nullable `division_id` uuid column on `departments`
- Keeps existing `branch_id` for backward compatibility but UI will use `division_id` going forward

### 3. Add `section_id` column to `employees`
- New nullable `section_id` uuid column to support Section assignment on employees

### 4. Repurpose `sites` table
The `sites` table currently represents "Sections." We need to decide: either repurpose `sites` as the new "Site" concept and create a new `sections` table, or keep `sites` as Sections and create a new table for Sites.

**Chosen approach**: Keep `sites` table as **Sections** (no disruption to existing data). Create a new `work_sites` table for **Site** (physical locations):
- `id`, `tenant_id`, `name`, `name_ar`, `address`, `address_ar`
- `department_id` (nullable) -- assign to department
- `section_id` (nullable) -- assign to section (references `sites` table)
- `is_active`, `created_at`, `updated_at`, `deleted_at`
- RLS policies matching the same tenant isolation pattern

## UI Changes

### OrgStructure Page (5 tabs)
Replace the current 3-tab layout with 5 tabs:
1. **Branches** -- restore original Branch management (physical locations with address/phone/email)
2. **Divisions** -- new tab for organizational divisions
3. **Departments** -- linked to Division (dropdown selector)
4. **Sections** -- linked to Department (current `sites` management)
5. **Sites** -- new tab for physical work locations, assignable to Department or Section

### New Components
| File | Purpose |
|------|---------|
| `src/hooks/useDivisions.ts` | CRUD hook for the new `divisions` table |
| `src/hooks/useWorkSites.ts` | CRUD hook for the new `work_sites` table |
| `src/components/org/DivisionTable.tsx` | Table listing divisions |
| `src/components/org/DivisionSheet.tsx` | Create/edit division form |
| `src/components/org/WorkSiteTable.tsx` | Table listing sites with dept/section assignment |
| `src/components/org/WorkSiteSheet.tsx` | Create/edit site form with dept/section dropdowns |

### Modified Components
| File | Change |
|------|--------|
| `src/pages/admin/OrgStructure.tsx` | 5 tabs, import new hooks and components |
| `src/components/org/BranchTable.tsx` | Restore "Branch" labels (remove Division terminology) |
| `src/components/org/BranchSheet.tsx` | Restore "Branch" labels |
| `src/components/org/DepartmentTable.tsx` | Show "Division" column (from `division_id`) instead of branch |
| `src/components/org/DepartmentSheet.tsx` | Division dropdown uses `division_id`, not `branch_id` |
| `src/components/org/SiteTable.tsx` | Keep as Section table, labels remain "Section" |
| `src/components/org/SiteSheet.tsx` | Keep as Section form, labels remain "Section" |
| `src/components/employees/EmployeeSheet.tsx` | Add Branch, Division, Department, Section dropdowns (4 levels). Division and Branch are independent selects. Department filters by Division. Section filters by Department. |
| `src/components/schedules/SchedulePreviewDialog.tsx` | Add Division filter/chart alongside Branch |
| `src/hooks/useBranches.ts` | Restore Branch toast keys |
| `src/hooks/useSites.ts` | Keep Section toast keys |
| `src/locales/en.json` | Add `branches.*` keys (restored), `sites.*` keys (new for work sites), keep `divisions.*` and `sections.*` |
| `src/locales/ar.json` | Same translations in Arabic |

### Translation Key Structure
- `branches.*` -- Branch (physical office): "Branch" / "فرع"
- `divisions.*` -- Division (org grouping): "Division" / "القسم الرئيسي"
- `organization.*` -- Department: stays as-is
- `sections.*` -- Section: stays as-is
- `sites.*` -- NEW Site keys: "Site" / "موقع العمل"

### Employee Sheet Flow
Four independent/linked dropdowns:
- **Branch** (independent select from `branches`)
- **Division** (independent select from `divisions`)
- **Department** (filtered by selected Division)
- **Section** (filtered by selected Department, from `sites` table)

### Analytics (SchedulePreviewDialog)
- Add Division filter and "Division -- Status Distribution" chart
- Keep Branch chart and Department chart
- Section chart optional (can be added later)

## Sequencing
1. Database migration: create `divisions` table, `work_sites` table, add `division_id` to departments, add `section_id` to employees
2. Translation files: add/restore all keys for branches, divisions, sections, sites
3. Create new hooks: `useDivisions.ts`, `useWorkSites.ts`
4. Create new components: DivisionTable, DivisionSheet, WorkSiteTable, WorkSiteSheet
5. Update OrgStructure page to 5 tabs
6. Update DepartmentTable/Sheet to use `division_id`
7. Restore BranchTable/Sheet to Branch labels
8. Update EmployeeSheet with 4-level dropdowns
9. Update SchedulePreviewDialog analytics
