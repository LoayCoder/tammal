-- Fix #1: Authorization gate — only reviewer/approver can perform approval transitions
CREATE OR REPLACE FUNCTION public.enforce_approval_authorization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_user_id uuid;
  v_current_employee_id uuid;
  v_is_authorized boolean := false;
BEGIN
  -- Only enforce on status changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_current_user_id := auth.uid();

  -- Get the employee_id of the current user
  SELECT id INTO v_current_employee_id
  FROM employees
  WHERE user_id = v_current_user_id AND deleted_at IS NULL
  LIMIT 1;

  -- Gate 1: under_review → pending_approval or rejected (reviewer action)
  IF OLD.status = 'under_review' AND NEW.status IN ('pending_approval', 'rejected', 'in_progress') THEN
    -- Check direct reviewer_id
    IF NEW.reviewer_id IS NOT NULL AND v_current_employee_id = NEW.reviewer_id THEN
      v_is_authorized := true;
    END IF;
    -- Check task_members with reviewer role
    IF NOT v_is_authorized THEN
      SELECT EXISTS (
        SELECT 1 FROM task_members
        WHERE task_id = NEW.id AND user_id = v_current_employee_id
          AND role = 'reviewer' AND deleted_at IS NULL
      ) INTO v_is_authorized;
    END IF;
    -- Also allow super_admin
    IF NOT v_is_authorized THEN
      v_is_authorized := has_role(v_current_user_id, 'super_admin');
    END IF;
    IF NOT v_is_authorized THEN
      RAISE EXCEPTION 'Only the designated reviewer can perform this action.';
    END IF;
  END IF;

  -- Gate 2: pending_approval → completed or rejected (approver action)
  IF OLD.status = 'pending_approval' AND NEW.status IN ('completed', 'rejected') THEN
    -- Check direct approver_id
    IF NEW.approver_id IS NOT NULL AND v_current_employee_id = NEW.approver_id THEN
      v_is_authorized := true;
    END IF;
    -- Check task_members with approver role
    IF NOT v_is_authorized THEN
      SELECT EXISTS (
        SELECT 1 FROM task_members
        WHERE task_id = NEW.id AND user_id = v_current_employee_id
          AND role = 'approver' AND deleted_at IS NULL
      ) INTO v_is_authorized;
    END IF;
    -- Also allow super_admin
    IF NOT v_is_authorized THEN
      v_is_authorized := has_role(v_current_user_id, 'super_admin');
    END IF;
    IF NOT v_is_authorized THEN
      RAISE EXCEPTION 'Only the designated approver can perform this action.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_approval_authorization_trigger ON public.unified_tasks;
CREATE TRIGGER enforce_approval_authorization_trigger
BEFORE UPDATE ON public.unified_tasks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approval_authorization();