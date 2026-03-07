
-- Add manager approval columns to nominations
ALTER TABLE public.nominations ADD COLUMN manager_approval_status TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE public.nominations ADD COLUMN manager_approved_by UUID;
ALTER TABLE public.nominations ADD COLUMN manager_approval_at TIMESTAMPTZ;
ALTER TABLE public.nominations ADD COLUMN manager_rejection_reason TEXT;

-- Validation trigger for manager_approval_status
CREATE OR REPLACE FUNCTION public.validate_manager_approval_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.manager_approval_status NOT IN ('not_required', 'pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid manager_approval_status: %', NEW.manager_approval_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_manager_approval_status
BEFORE INSERT OR UPDATE ON public.nominations
FOR EACH ROW EXECUTE FUNCTION public.validate_manager_approval_status();
