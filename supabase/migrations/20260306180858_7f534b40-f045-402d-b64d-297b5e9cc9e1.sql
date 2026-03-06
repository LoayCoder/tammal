-- Fix #2: Auto-log approval workflow events to task_activity_logs
CREATE OR REPLACE FUNCTION public.log_approval_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_action text;
  v_performer uuid;
  v_details jsonb;
BEGIN
  -- Only fire on status changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Resolve performer (current user's employee_id)
  SELECT id INTO v_performer
  FROM employees
  WHERE user_id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;

  -- If no employee found, use the task's employee_id as fallback
  IF v_performer IS NULL THEN
    v_performer := NEW.employee_id;
  END IF;

  v_details := jsonb_build_object(
    'old_status', OLD.status,
    'new_status', NEW.status
  );

  -- Determine action label
  v_action := CASE
    WHEN NEW.status = 'under_review'      THEN 'submitted_for_review'
    WHEN NEW.status = 'pending_approval'   THEN 'review_approved'
    WHEN NEW.status = 'completed' AND OLD.status = 'pending_approval' THEN 'approval_granted'
    WHEN NEW.status = 'completed' AND OLD.status = 'in_progress'      THEN 'marked_completed'
    WHEN NEW.status = 'rejected'           THEN 'rejected'
    WHEN NEW.status = 'in_progress' AND OLD.status = 'rejected'       THEN 'reopened_after_rejection'
    WHEN NEW.status = 'in_progress' AND OLD.status = 'under_review'   THEN 'returned_by_reviewer'
    WHEN NEW.status = 'archived'           THEN 'archived'
    WHEN NEW.status = 'draft' AND OLD.status = 'archived'             THEN 'unarchived'
    ELSE 'status_changed'
  END;

  INSERT INTO task_activity_logs (task_id, action, performed_by, details, tenant_id)
  VALUES (NEW.id, v_action, v_performer, v_details, NEW.tenant_id);

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS log_approval_activity_trigger ON public.unified_tasks;
CREATE TRIGGER log_approval_activity_trigger
AFTER UPDATE ON public.unified_tasks
FOR EACH ROW
EXECUTE FUNCTION public.log_approval_activity();