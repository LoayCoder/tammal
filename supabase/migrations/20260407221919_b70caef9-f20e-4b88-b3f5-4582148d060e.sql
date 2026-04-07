
CREATE OR REPLACE FUNCTION public.enforce_evidence_before_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_approved_evidence boolean;
BEGIN
  -- Only check when status transitions TO completed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'completed' THEN
    SELECT EXISTS (
      SELECT 1 FROM task_evidence
      WHERE action_id = NEW.id
        AND status = 'approved'
        AND deleted_at IS NULL
    ) INTO v_has_approved_evidence;

    IF NOT v_has_approved_evidence THEN
      RAISE EXCEPTION 'Cannot complete task without at least one approved evidence item.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_enforce_evidence_before_completion
  BEFORE UPDATE ON unified_tasks
  FOR EACH ROW
  EXECUTE FUNCTION enforce_evidence_before_completion();
