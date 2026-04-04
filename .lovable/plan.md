

## Fix Language Display & Task ID Format

### Two Issues

**Issue 1: Arabic text showing in English mode**
Currently, the Task Detail always shows the secondary language subtitle (Arabic under English title, or vice versa). When UI is in English, only English title and description should display — no Arabic subtitle. Same in reverse.

**Issue 2: Task ID format**
Current format: `#8` (just the sequential number).
Required format: `{Tenant Name} - {Branch Name} - {Task Number} - {Year}` e.g. `Golf Saudi - HQ - 10 - 26`

---

### Changes

**1. `src/features/tasks/hooks/useTaskDetail.ts`**
- Expand the query to join through `employee → branch` and `tenant` to get branch name and tenant name:
  ```
  select('*, employee:employees!unified_tasks_employee_id_fkey(full_name, branch:branches!employees_branch_id_fkey(name)), tenant:tenants!unified_tasks_tenant_id_fkey(name)')
  ```

**2. `src/features/tasks/pages/TaskDetail.tsx`**
- **Remove the secondary title line entirely** — only show the active language's title (EN or AR based on `i18n.language`)
- **Description**: already language-aware, keep as-is
- **Task ID badge**: Build the composite reference string from tenant name, branch name, task number, and 2-digit year (from `created_at`):
  ```
  Golf Saudi - HQ - 10 - 26
  ```
- If tenant/branch data isn't available, fall back to just `#task_number`

**3. `src/components/workload/employee/UnifiedTaskList.tsx`**
- Show language-aware title (EN or AR based on `i18n.language`)
- Update task number display to include the composite format if branch/tenant data is available (requires expanding the query in `useUnifiedTasks.ts`)

**4. `src/features/workload/hooks/useUnifiedTasks.ts`**
- Expand the select query to join `employees → branches` and `tenants` to get names for the composite ID

### Files Modified
| File | Change |
|------|--------|
| `src/features/tasks/hooks/useTaskDetail.ts` | Add branch + tenant joins |
| `src/features/tasks/pages/TaskDetail.tsx` | Remove secondary title, build composite task ID, language-only display |
| `src/features/workload/hooks/useUnifiedTasks.ts` | Add branch + tenant joins |
| `src/components/workload/employee/UnifiedTaskList.tsx` | Language-aware title, composite task ID |

