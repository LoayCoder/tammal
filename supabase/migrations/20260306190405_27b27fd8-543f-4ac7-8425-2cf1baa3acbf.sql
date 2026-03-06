
-- 1) Trigger: notify task owner when ALL checklist items are completed
CREATE OR REPLACE FUNCTION public.notify_on_checklist_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task RECORD;
  v_total int;
  v_completed int;
BEGIN
  -- Only fire when a checklist item status changes to 'completed'
  IF NEW.status <> 'completed' OR (TG_OP = 'UPDATE' AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Count total and completed items for this task
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed
  FROM task_checklists
  WHERE task_id = NEW.task_id AND deleted_at IS NULL;

  -- Only notify when ALL items are completed
  IF v_total > 0 AND v_total = v_completed THEN
    SELECT id, employee_id, tenant_id, title INTO v_task
    FROM unified_tasks WHERE id = NEW.task_id;

    IF v_task.employee_id IS NOT NULL THEN
      INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
      VALUES (
        v_task.tenant_id,
        v_task.employee_id,
        v_task.id,
        'checklist_completed',
        'Checklist completed: ' || v_task.title,
        'All checklist items have been completed for this task.'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_checklist_completion
  AFTER INSERT OR UPDATE ON public.task_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_checklist_completion();

-- 2) Function + trigger: notify when task deadline is approaching (24h before due_date)
-- This runs via the deadline-check edge function, but we also add a scheduled notification
-- approach via a DB function that the edge function can call.

CREATE OR REPLACE FUNCTION public.check_approaching_deadlines()
RETURNS TABLE(notifications_created int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count int := 0;
  v_task RECORD;
BEGIN
  -- Find tasks due within 24 hours that haven't been notified yet
  FOR v_task IN
    SELECT t.id, t.tenant_id, t.employee_id, t.title, t.due_date
    FROM unified_tasks t
    WHERE t.deleted_at IS NULL
      AND t.status NOT IN ('completed', 'archived', 'rejected')
      AND t.due_date IS NOT NULL
      AND t.due_date > now()
      AND t.due_date <= now() + interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM task_notifications n
        WHERE n.task_id = t.id
          AND n.type = 'deadline_approaching'
          AND n.deleted_at IS NULL
      )
  LOOP
    INSERT INTO task_notifications (tenant_id, recipient_id, task_id, type, title, body)
    VALUES (
      v_task.tenant_id,
      v_task.employee_id,
      v_task.id,
      'deadline_approaching',
      'Deadline approaching: ' || v_task.title,
      'This task is due within the next 24 hours.'
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_count;
END;
$$;
