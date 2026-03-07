
-- Fix existing nominations that were manager-approved but stuck at 'submitted'
UPDATE public.nominations
SET status = 'endorsed'
WHERE manager_approval_status = 'approved'
  AND status = 'submitted'
  AND deleted_at IS NULL;
