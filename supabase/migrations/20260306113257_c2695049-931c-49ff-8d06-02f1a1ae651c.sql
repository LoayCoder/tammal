
CREATE OR REPLACE FUNCTION public.sync_action_to_queue()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_queue_status text;
BEGIN
  -- Map action status to valid queue status
  v_queue_status := CASE NEW.status
    WHEN 'planned' THEN 'pending'
    WHEN 'scheduled' THEN 'pending'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'completed' THEN 'completed'
    WHEN 'blocked' THEN 'blocked'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_queue_items (tenant_id, action_id, employee_id, title, status, priority, due_date)
    VALUES (NEW.tenant_id, NEW.id, NEW.assignee_id, NEW.title, v_queue_status, NEW.priority, NEW.planned_end);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE task_queue_items SET deleted_at = now(), updated_at = now()
      WHERE action_id = NEW.id AND deleted_at IS NULL;
      RETURN NEW;
    END IF;

    UPDATE task_queue_items SET
      employee_id = NEW.assignee_id,
      title = NEW.title,
      status = v_queue_status,
      priority = NEW.priority,
      due_date = NEW.planned_end,
      updated_at = now()
    WHERE action_id = NEW.id AND deleted_at IS NULL;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;
