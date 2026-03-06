CREATE OR REPLACE FUNCTION public.validate_unified_task_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('draft', 'todo', 'planned', 'open', 'in_progress', 'under_review', 'pending_approval', 'completed', 'rejected', 'archived') THEN
    RAISE EXCEPTION 'Invalid unified_tasks status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;