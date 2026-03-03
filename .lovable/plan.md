

## Plan: Representative Role & Org-Wide Task Distribution

### Overview
Add a **Representative** role that allows designated users to create tasks that are automatically distributed (cloned) to all members of a selected Division, Department, or Section. Recipients can only change task **status** and add **notes/comments** — they cannot edit, delete, or change the due date. These tasks will use `source_type: 'representative_assigned'` and will be auto-locked (`is_locked: true`).

### Design Decisions
- **No schema changes to `app_role` enum**: The Representative is modeled as an **additional system role** (`base_role: 'manager'`) in the `roles` table, not a new enum value. This avoids a database enum migration and aligns with the existing pattern where custom roles map to base roles for RLS.
- **Task distribution via Edge Function**: A backend function receives the task template + scope (division/department/section), resolves all active employees in that scope, and bulk-inserts one `unified_tasks` row per employee — all locked, with `source_type: 'representative_assigned'`.
- **Existing `is_locked` mechanism** already restricts employees to status changes + comments only. No UI changes needed for the employee-side task list.
- **Assign luai@doodh.com** as Representative via a data insert after the role is created.

---

### Changes

#### 1. Database Migration
- Create a `representative_assignments` table to track which user is a representative for which org scope:

```text
representative_assignments
├── id (uuid PK)
├── tenant_id (uuid, NOT NULL, FK → tenants)
├── user_id (uuid, NOT NULL, FK → auth.users)
├── scope_type (text: 'division' | 'department' | 'section')
├── scope_id (uuid, NOT NULL)
├── created_at, updated_at, deleted_at
└── RLS: tenant isolation
```

- Add `'representative_assigned'` as a recognized source_type (no enum — it's a free-text column already).

#### 2. Edge Function: `distribute-representative-task`
- Accepts: `tenant_id`, `title`, `title_ar`, `description`, `due_date`, `priority`, `estimated_minutes`, `scope_type`, `scope_id`, `created_by`
- Resolves employees:
  - **Division**: all employees in departments under that division
  - **Department**: all employees with `department_id = scope_id`
  - **Section**: all employees with `section_id = scope_id`
- Bulk-inserts one locked `unified_tasks` row per employee with `source_type: 'representative_assigned'`, `is_locked: true`
- Returns count of distributed tasks

#### 3. New Hook: `src/hooks/workload/useRepresentativeTasks.ts`
- Fetches the current user's representative assignments from `representative_assignments`
- Calls the edge function to distribute tasks
- Queries tasks created by this representative (`created_by = user.id` AND `source_type = 'representative_assigned'`)

#### 4. New Page: `src/pages/admin/RepresentativeWorkload.tsx`
- Route: `/admin/workload/representative` (guarded by `ManagerOrAdminRoute`)
- UI: Scope selector (Division → Department → Section cascading), task creation form, table of distributed tasks with status overview
- Shows aggregated completion stats per distributed task batch

#### 5. Task Creation Dialog: `src/components/workload/representative/DistributeTaskDialog.tsx`
- Cascading org selectors: Division → Department → Section
- Task fields: title, title_ar, description, due_date, priority, estimated_minutes
- Preview: shows count of employees who will receive the task
- Submit calls edge function

#### 6. Update `UnifiedTaskList` source labels
- Add `representative_assigned` to `SOURCE_LABELS` map with a distinctive badge color

#### 7. Sidebar & Routing
- Add Representative Workload link under Workload Intelligence group in `AppSidebar.tsx`
- Register route in `App.tsx`

#### 8. i18n translations (en + ar)
- Add representative-related keys for page title, dialog labels, source badge, etc.

#### 9. Data: Assign luai@doodh.com as Representative
- Look up user by email, find their employee record
- Insert a `representative_assignments` row scoping them to their division
- Assign the `manager` base role in `user_roles` if not already present (since Representative uses `base_role: 'manager'` for route access)

---

### File Summary

| File | Action |
|---|---|
| **Migration SQL** | Create `representative_assignments` table with RLS |
| `supabase/functions/distribute-representative-task/index.ts` | New edge function for bulk task distribution |
| `src/hooks/workload/useRepresentativeTasks.ts` | New hook |
| `src/pages/admin/RepresentativeWorkload.tsx` | New page |
| `src/components/workload/representative/DistributeTaskDialog.tsx` | New dialog |
| `src/components/workload/employee/UnifiedTaskList.tsx` | Add `representative_assigned` source label |
| `src/components/layout/AppSidebar.tsx` | Add sidebar link |
| `src/App.tsx` | Register route |
| `src/locales/en.json`, `src/locales/ar.json` | Add i18n keys |
| **Data insert** | Assign luai@doodh.com as representative + manager role |

