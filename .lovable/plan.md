

## Task Reference ID — Analysis & Plan

### Current State
- Each task has only a UUID (`bdcea4ee-72dd-4dae-9343-a62e20f2ae9f`) — not displayed anywhere in the UI.
- There is **no** short/human-readable reference ID (like `TASK-001`) on the `unified_tasks` table or in the UI.

### What Needs to Happen

**1. Database: Add `task_number` column + auto-increment trigger**
- Add a `task_number INTEGER` column to `unified_tasks`
- Create a trigger that auto-generates a sequential number per tenant on insert
- This gives each task a short reference like `#142` scoped to the tenant

**2. UI: Display the reference ID**
- Show the reference in the Task Detail header (e.g., `#142` as a muted badge next to the title)
- Show it in task list rows for quick identification
- Make it copyable on click

### Files to Change
| File | Change |
|------|--------|
| **Migration (new)** | Add `task_number` column, create auto-increment trigger per tenant, backfill existing tasks |
| `src/features/tasks/pages/TaskDetail.tsx` | Display `#task_number` in header |
| `src/features/tasks/components/` (task list items) | Show reference in list rows |

### Migration SQL (Core Logic)
```sql
ALTER TABLE unified_tasks ADD COLUMN task_number INTEGER;

-- Auto-increment per tenant
CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.task_number := COALESCE(
    (SELECT MAX(task_number) FROM unified_tasks WHERE tenant_id = NEW.tenant_id), 0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_number
  BEFORE INSERT ON unified_tasks
  FOR EACH ROW EXECUTE FUNCTION generate_task_number();

-- Backfill existing tasks
UPDATE unified_tasks SET task_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) AS rn
  FROM unified_tasks
) sub WHERE unified_tasks.id = sub.id;
```

