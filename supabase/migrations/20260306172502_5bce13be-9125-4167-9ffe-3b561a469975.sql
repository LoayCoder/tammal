-- =============================================
-- 1. Transition enforcement trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.enforce_task_status_transition()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
DECLARE
  v_allowed text[];
BEGIN
  -- Only enforce on status changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Define valid transitions
  v_allowed := CASE OLD.status
    WHEN 'draft'             THEN ARRAY['open', 'archived']
    WHEN 'open'              THEN ARRAY['in_progress', 'archived']
    WHEN 'in_progress'       THEN ARRAY['under_review', 'completed', 'archived']
    WHEN 'under_review'      THEN ARRAY['pending_approval', 'in_progress', 'rejected']
    WHEN 'pending_approval'  THEN ARRAY['completed', 'rejected']
    WHEN 'completed'         THEN ARRAY['archived']
    WHEN 'rejected'          THEN ARRAY['in_progress', 'draft', 'archived']
    WHEN 'archived'          THEN ARRAY['draft']
    -- Legacy statuses: allow moving to enterprise lifecycle
    WHEN 'todo'              THEN ARRAY['open', 'in_progress', 'archived']
    WHEN 'planned'           THEN ARRAY['open', 'in_progress', 'archived']
    ELSE ARRAY[]::text[]
  END;

  IF NOT (NEW.status = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid status transition: % → %. Allowed: %', OLD.status, NEW.status, v_allowed;
  END IF;

  RETURN NEW;
END;
$function$;

-- Attach BEFORE UPDATE (fires before the enum validator)
CREATE TRIGGER enforce_task_status_transition_trigger
  BEFORE UPDATE ON public.unified_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_task_status_transition();

-- =============================================
-- 2. Auto-lock on completion, auto-unlock on reopen
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_lock_completed_task()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Auto-lock when completing
    IF NEW.status = 'completed' THEN
      NEW.is_locked := true;
      NEW.locked_at := now();
      NEW.locked_by := NEW.employee_id;
    END IF;

    -- Auto-unlock when reopening from archived or rejected
    IF OLD.status IN ('completed', 'archived') AND NEW.status IN ('draft', 'in_progress') THEN
      NEW.is_locked := false;
      NEW.locked_by := NULL;
      NEW.locked_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER auto_lock_completed_task_trigger
  BEFORE UPDATE ON public.unified_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_lock_completed_task();