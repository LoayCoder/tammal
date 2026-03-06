-- Auto-transition rejected tasks to in_progress when assignee edits core content
CREATE OR REPLACE FUNCTION public.auto_reopen_rejected_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only act on rejected tasks where status itself isn't changing
  IF OLD.status = 'rejected' AND NEW.status = 'rejected' THEN
    -- If assignee edits content fields, auto-move to in_progress
    IF (
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.progress IS DISTINCT FROM NEW.progress
    ) THEN
      NEW.status := 'in_progress';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS auto_reopen_rejected_task_trigger ON public.unified_tasks;
CREATE TRIGGER auto_reopen_rejected_task_trigger
BEFORE UPDATE ON public.unified_tasks
FOR EACH ROW
EXECUTE FUNCTION public.auto_reopen_rejected_task();