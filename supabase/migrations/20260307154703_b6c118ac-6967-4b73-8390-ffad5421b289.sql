
-- Fix existing nominations that were created before the manager approval feature.
-- Set manager_approval_status to 'pending' for nominations in cycles with allowAppeals enabled.
UPDATE public.nominations n
SET manager_approval_status = 'pending'
FROM public.award_cycles c
WHERE n.cycle_id = c.id
  AND n.deleted_at IS NULL
  AND n.manager_approval_status = 'not_required'
  AND c.fairness_config::jsonb -> 'auditSettings' ->> 'allowAppeals' = 'true';
