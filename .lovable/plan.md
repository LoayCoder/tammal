

## Plan: Manager Team Task Management Page

### Current State
- `/admin/workload/team` is protected by `AdminRoute` (super_admin/tenant_admin only) — managers cannot access it.
- The page (`TeamWorkload.tsx`) shows analytics quadrants and objective alignment but has **no task list, no task creation, and no filters**.
- The sidebar item uses `access: 'admin'` which maps to `isManagerOrAdmin` for items, but the route guard blocks managers.
- `useUnifiedTasks` hook already supports CRUD with `source_type: 'manager_assigned'`.
- `useCurrentEmployee` provides the manager's `department_id`.

### Changes Required

**1. Route Guard — Allow Managers (`src/App.tsx`)**
- Change the `/admin/workload/team` route from `<AdminRoute>` to `<ManagerOrAdminRoute>` so managers with a team can access it.

**2. Expand TeamWorkload Page (`src/pages/admin/TeamWorkload.tsx`)**
Major rewrite to add:

- **Department Task List Section**: Query `unified_tasks` for all employees in the manager's department (fetch department employees via `employees` table using `department_id`).
- **"Add Task" Button + Dialog**: Reuse `TaskDialog` component, allowing the manager to pick a team member and assign a task with `source_type: 'manager_assigned'`.
- **Filter Bar**: Filters for:
  - Status (todo / in_progress / done / blocked)
  - Priority (P1–P5)
  - Employee (dropdown of department members)
  - Source type (manual / assigned / OKR / external)
  - Date range (due date)
- **Task Table/List**: Display all department tasks with columns: Employee Name, Title, Status, Priority, Due Date, Estimated Time, Source, Lock status. Reuse `UnifiedTaskList` style or build a `DataTable` variant.
- **Task Actions**: Edit, delete (soft), lock/unlock, comment — via existing mutations in `useUnifiedTasks`.

**3. New Hook: `useDepartmentTasks` (`src/hooks/workload/useDepartmentTasks.ts`)**
- Fetch all employees where `department_id` matches the manager's department.
- Fetch all `unified_tasks` for those employee IDs.
- Return tasks + department employee list for the assignment dropdown.

**4. New Component: `TeamTaskFilters` (`src/components/workload/team/TeamTaskFilters.tsx`)**
- Filter controls: status multi-select, priority, employee dropdown, source type, due date range.
- Controlled state passed to parent for client-side filtering.

**5. Translation Keys**
- Add keys under `teamWorkload.*` in both `en.json` and `ar.json` for: `addTask`, `assignTo`, `filterByStatus`, `filterByPriority`, `filterByEmployee`, `filterBySource`, `allTasks`, `departmentTasks`, `noTasksFound`, `assignTask`, `assignTaskDesc`.

### File Summary
| File | Action |
|---|---|
| `src/App.tsx` | Change route guard to `ManagerOrAdminRoute` |
| `src/pages/admin/TeamWorkload.tsx` | Add task list, filters, add-task dialog |
| `src/hooks/workload/useDepartmentTasks.ts` | New hook — fetch dept employees + tasks |
| `src/components/workload/team/TeamTaskFilters.tsx` | New filter bar component |
| `src/locales/en.json` | Add translation keys |
| `src/locales/ar.json` | Add translation keys |

