

# Representative Strategic Hierarchy Management

## Current State

- Representatives can only **distribute tasks** and **lock/unlock** items in the strategic hierarchy
- The `ObjectivesManagement` and `ObjectiveDetail` pages restrict create/edit/delete to `canManage` (super_admin, tenant_admin, manager)
- The dialogs (`ObjectiveDialog`, `InitiativeDialog`, `ActionDialog`) exist but lack **owner/accountable user** and **department/division** assignment fields
- Database tables already have columns for `owner_user_id`, `accountable_user_id`, `department_id`, `division_id` — they're just not exposed in the UI
- The `sync_action_to_queue` trigger already auto-syncs actions to `task_queue_items`, and the `recalculate_initiative_progress` trigger handles progress rollup

## Plan

### 1. Grant Representatives Create/Edit Access in Existing Pages

**Files:** `ObjectivesManagement.tsx`, `ObjectiveDetail.tsx`

- Expand `canManage` to include `isRepresentative`:
  ```
  const canManage = isSuperAdmin || isTenantAdmin || isManager || isRepresentative;
  ```
- In `ObjectivesManagement.tsx`, add `useIsRepresentative` import and include representative in the permission check
- This immediately grants representatives full CRUD on objectives, initiatives, and actions through the existing UI

### 2. Add Owner/Accountable/Department Fields to Dialogs

**`ObjectiveDialog.tsx`** — Add:
- Owner (employee select) → `owner_user_id`
- Accountable (employee select) → `accountable_user_id`
- Uses a lightweight employee list from `useOrgTree` or a simple query

**`InitiativeDialog.tsx`** — Add:
- Owner → `owner_user_id`
- Accountable → `accountable_user_id`
- Division select → `division_id`
- Department select (cascaded from division) → `department_id`

**`ActionDialog.tsx`** — Add:
- Assignee (employee select) → `assignee_id`
- Accountable → `accountable_user_id`
- These fields use the cascading org tree pattern already in `DistributeTaskDialog`

### 3. Create Shared Employee Picker Component

**New file:** `src/components/workload/EmployeePicker.tsx`

A reusable select component that queries employees, used across all three dialogs. Props: `value`, `onChange`, `label`, optional `departmentId` filter.

### 4. Update Hooks to Pass New Fields

**`useObjectives.ts`** — Add `owner_user_id`, `accountable_user_id` to `ObjectiveInsert`/`ObjectiveUpdate` interfaces (already partially there)

**`useInitiatives.ts`** — Already has `department_id`, `division_id`, `owner_user_id` in interfaces — no change needed

**`useActions.ts`** — Already has `assignee_id` in interface — add `accountable_user_id`

### 5. Auto-Sync to Dashboards

Already handled by existing infrastructure:
- `sync_action_to_queue` trigger syncs actions → `task_queue_items` (used by employee dashboards)
- `recalculate_initiative_progress` trigger rolls up progress
- `unified_tasks` are populated via `task_queue_items` or direct inserts
- When `assignee_id` is set on an action, the trigger automatically creates a `task_queue_item` with the `employee_id`, making it visible on the assigned user's Personal Command Center

### 6. Add i18n Keys

Add keys for owner, accountable, assignTo labels in both `en.json` and `ar.json`.

### Files to Modify
- `src/pages/admin/ObjectivesManagement.tsx` — Add representative permission
- `src/pages/admin/ObjectiveDetail.tsx` — Add representative permission
- `src/components/workload/ObjectiveDialog.tsx` — Add owner/accountable fields
- `src/components/workload/InitiativeDialog.tsx` — Add owner/accountable/division/department fields
- `src/components/workload/ActionDialog.tsx` — Add assignee/accountable fields
- `src/components/workload/EmployeePicker.tsx` — New reusable component
- `src/hooks/workload/useActions.ts` — Add `accountable_user_id`
- `src/locales/en.json`, `src/locales/ar.json` — New labels

### No Database Changes Needed
All required columns (`owner_user_id`, `accountable_user_id`, `department_id`, `division_id`, `assignee_id`) already exist in the schema. The sync triggers are already in place.

