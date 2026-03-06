-- Fix #3: Allow in_progress → pending_approval when reviewer_id IS NULL (reviewer skip)
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
    WHEN 'in_progress'       THEN
      -- If no reviewer assigned, allow skipping directly to pending_approval
      CASE WHEN NEW.reviewer_id IS NULL
        THEN ARRAY['under_review', 'pending_approval', 'completed', 'archived']
        ELSE ARRAY['under_review', 'completed', 'archived']
      END
    WHEN 'under_review'      THEN ARRAY['pending_approval', 'in_progress', 'rejected']
    WHEN 'pending_approval'  THEN ARRAY['completed', 'rejected']
    WHEN 'completed'         THEN ARRAY['archived']
    WHEN 'rejected'          THEN ARRAY['in_progress', 'draft', 'archived']
    WHEN 'archived'          THEN ARRAY['draft']
    -- Legacy statuses
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