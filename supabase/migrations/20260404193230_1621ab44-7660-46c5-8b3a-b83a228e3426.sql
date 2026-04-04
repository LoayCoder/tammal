
-- Step 1: Disable ALL user triggers
ALTER TABLE unified_tasks DISABLE TRIGGER validate_unified_task_status_trigger;
ALTER TABLE unified_tasks DISABLE TRIGGER enforce_task_status_transition_trigger;
ALTER TABLE unified_tasks DISABLE TRIGGER enforce_unified_task_lock_trigger;
ALTER TABLE unified_tasks DISABLE TRIGGER auto_lock_completed_task_trigger;
ALTER TABLE unified_tasks DISABLE TRIGGER auto_reopen_rejected_task_trigger;
ALTER TABLE unified_tasks DISABLE TRIGGER log_approval_activity_trigger;
ALTER TABLE unified_tasks DISABLE TRIGGER trg_notify_on_task_change;
ALTER TABLE unified_tasks DISABLE TRIGGER enforce_approval_authorization_trigger;
ALTER TABLE unified_tasks DISABLE TRIGGER validate_task_visibility_trigger;
ALTER TABLE unified_tasks DISABLE TRIGGER update_unified_tasks_updated_at;

-- Step 2: Add column
ALTER TABLE unified_tasks ADD COLUMN task_number INTEGER;

-- Step 3: Auto-increment function
CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.task_number := COALESCE(
    (SELECT MAX(task_number) FROM unified_tasks WHERE tenant_id = NEW.tenant_id), 0
  ) + 1;
  RETURN NEW;
END;
$$;

-- Step 4: Trigger (won't fire during backfill since we're doing UPDATE not INSERT)
CREATE TRIGGER trg_task_number
  BEFORE INSERT ON unified_tasks
  FOR EACH ROW EXECUTE FUNCTION generate_task_number();

-- Step 5: Backfill
UPDATE unified_tasks SET task_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at)::integer AS rn
  FROM unified_tasks
) sub WHERE unified_tasks.id = sub.id;

-- Step 6: Re-enable ALL triggers
ALTER TABLE unified_tasks ENABLE TRIGGER validate_unified_task_status_trigger;
ALTER TABLE unified_tasks ENABLE TRIGGER enforce_task_status_transition_trigger;
ALTER TABLE unified_tasks ENABLE TRIGGER enforce_unified_task_lock_trigger;
ALTER TABLE unified_tasks ENABLE TRIGGER auto_lock_completed_task_trigger;
ALTER TABLE unified_tasks ENABLE TRIGGER auto_reopen_rejected_task_trigger;
ALTER TABLE unified_tasks ENABLE TRIGGER log_approval_activity_trigger;
ALTER TABLE unified_tasks ENABLE TRIGGER trg_notify_on_task_change;
ALTER TABLE unified_tasks ENABLE TRIGGER enforce_approval_authorization_trigger;
ALTER TABLE unified_tasks ENABLE TRIGGER validate_task_visibility_trigger;
ALTER TABLE unified_tasks ENABLE TRIGGER update_unified_tasks_updated_at;

-- Step 7: Index
CREATE INDEX idx_unified_tasks_task_number ON unified_tasks (tenant_id, task_number);
