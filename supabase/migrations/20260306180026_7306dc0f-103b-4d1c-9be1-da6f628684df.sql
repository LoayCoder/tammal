-- 1) Restrict writable unified task statuses to enterprise lifecycle only
CREATE OR REPLACE FUNCTION public.validate_unified_task_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN (
    'draft',
    'open',
    'in_progress',
    'under_review',
    'pending_approval',
    'completed',
    'rejected',
    'archived'
  ) THEN
    RAISE EXCEPTION 'Invalid unified_tasks status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Keep transition matrix strict while still allowing legacy rows to migrate forward
CREATE OR REPLACE FUNCTION public.enforce_task_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_allowed text[];
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_allowed := CASE OLD.status
    WHEN 'draft'             THEN ARRAY['open', 'archived']
    WHEN 'open'              THEN ARRAY['in_progress', 'archived']
    WHEN 'in_progress'       THEN ARRAY['under_review', 'completed', 'archived']
    WHEN 'under_review'      THEN ARRAY['pending_approval', 'in_progress', 'rejected']
    WHEN 'pending_approval'  THEN ARRAY['completed', 'rejected']
    WHEN 'completed'         THEN ARRAY['archived']
    WHEN 'rejected'          THEN ARRAY['in_progress', 'draft', 'archived']
    WHEN 'archived'          THEN ARRAY['draft']
    -- Legacy source statuses: allow one-way migration into enterprise lifecycle
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

-- 3) Enforce lock behavior at database layer for unified tasks
CREATE OR REPLACE FUNCTION public.enforce_unified_task_lock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.is_locked = true THEN
    -- Allow explicit unlock only when reopening to active workflow states
    IF NEW.is_locked = false THEN
      IF NEW.status NOT IN ('draft', 'in_progress') THEN
        RAISE EXCEPTION 'Locked task can only be unlocked when reopening to draft or in_progress.';
      END IF;
      RETURN NEW;
    END IF;

    -- Block edits to frozen/core fields while locked
    IF (
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.title_ar IS DISTINCT FROM NEW.title_ar OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.employee_id IS DISTINCT FROM NEW.employee_id OR
      OLD.assignee_id IS DISTINCT FROM NEW.assignee_id OR
      OLD.department_id IS DISTINCT FROM NEW.department_id OR
      OLD.priority IS DISTINCT FROM NEW.priority OR
      OLD.estimated_minutes IS DISTINCT FROM NEW.estimated_minutes OR
      OLD.scheduled_start IS DISTINCT FROM NEW.scheduled_start OR
      OLD.scheduled_end IS DISTINCT FROM NEW.scheduled_end OR
      OLD.due_date IS DISTINCT FROM NEW.due_date OR
      OLD.reviewer_id IS DISTINCT FROM NEW.reviewer_id OR
      OLD.approver_id IS DISTINCT FROM NEW.approver_id OR
      OLD.visibility IS DISTINCT FROM NEW.visibility
    ) THEN
      RAISE EXCEPTION 'Task is locked. Core fields cannot be modified until reopened.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_unified_task_lock_trigger ON public.unified_tasks;
CREATE TRIGGER enforce_unified_task_lock_trigger
BEFORE UPDATE ON public.unified_tasks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_unified_task_lock();