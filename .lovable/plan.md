

# Phase 2 Polish Plan

## Issues Found

1. **TaskDetail: Comment author shows raw UUID** (`c.user_id.slice(0, 8)`) instead of employee name. Need to join with employees table or fetch employee names.

2. **TaskDetail: No employee name resolution for activity logs** — `performed_by` also shows raw ID.

3. **TaskDetail: Comments use `user_id` (employee_id) but should resolve to `full_name`** — The `useTaskComments` hook fetches `*` from `task_comments` which only has `user_id`. Should join with `employees` to get names.

4. **MyTasks: `verified` status referenced but not in validation trigger** — The `validate_unified_task_status` trigger only allows: draft, open, in_progress, under_review, pending_approval, completed, rejected, archived. The "Verified" tab will always show 0 items. Should remove it or add `verified` to the trigger.

5. **ApprovalQueue: No employee name shown for task owner** — Tasks show title but not who created/owns the task.

6. **OverdueTasks: No employee name resolution** — Cannot see which employee owns the overdue task.

## Plan

### Fix 1: Resolve employee names in TaskDetail comments & activity
- Modify `useTaskComments` to select `*, employees!task_comments_user_id_fkey(full_name)` or do a separate employees lookup
- Since the `task_comments.user_id` stores an employee_id, we can join. However, the FK may not exist. Safer approach: fetch all unique user_ids from comments, then batch-query `employees` table to build a name map.
- Simpler approach: modify the query to select with a manual join using `.select('*, employee:employees!user_id(full_name)')` — but this requires a FK relationship.
- **Best approach**: In `TaskDetail.tsx`, fetch employee names for comment user_ids via a separate query, then display names inline. This avoids modifying the hook.

### Fix 2: Remove "Verified" tab from MyTasks
- The status `verified` is not in the DB validation trigger. Remove the Verified tab and stats card to avoid confusion. If needed later, add it via a migration.

### Fix 3: Show employee names on ApprovalQueue & OverdueTasks
- Join `employees` on `employee_id` in both queries to show task owner name.
- Modify queries: `.select('*, employee:employees!employee_id(full_name)')` — this requires FK. Check if FK exists on `unified_tasks.employee_id → employees.id`.

### Fix 4: Minor UX polish
- TaskDetail back button should use `rtl:-scale-x-100` pattern (currently uses `rtl:rotate-180` which is fine)
- Ensure all i18n keys exist for edge cases

### Files to modify
- `src/pages/tasks/TaskDetail.tsx` — resolve comment/activity author names, remove verified references
- `src/pages/tasks/MyTasks.tsx` — remove Verified tab/stats
- `src/pages/tasks/ApprovalQueue.tsx` — show task owner name
- `src/pages/tasks/OverdueTasks.tsx` — show task owner name
- `src/hooks/tasks/useTaskComments.ts` — optionally extend select to include employee name

