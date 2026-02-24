
-- Fix 4: Update the missing question's validation_status to 'passed'
UPDATE public.generated_questions
SET validation_status = 'passed'
WHERE id = '69624610-b7a6-4fa6-bd0b-94a42e76f0d2';

-- Fix 2: Insert the missing question into scheduled_questions for all employees in schedule 6dca6b30
-- Only insert if not already present (idempotent)
INSERT INTO public.scheduled_questions (schedule_id, employee_id, question_id, tenant_id, scheduled_delivery, status, delivery_channel, question_source)
SELECT
  sq.schedule_id,
  sq.employee_id,
  '69624610-b7a6-4fa6-bd0b-94a42e76f0d2',
  sq.tenant_id,
  sq.scheduled_delivery,
  'pending',
  'app',
  'generated_questions'
FROM (
  SELECT DISTINCT schedule_id, employee_id, tenant_id, MIN(scheduled_delivery) as scheduled_delivery
  FROM public.scheduled_questions
  WHERE schedule_id = '6dca6b30-8b4a-4b0e-9c1d-2e3f4a5b6c7d'
  GROUP BY schedule_id, employee_id, tenant_id
) sq
WHERE NOT EXISTS (
  SELECT 1 FROM public.scheduled_questions existing
  WHERE existing.schedule_id = sq.schedule_id
    AND existing.employee_id = sq.employee_id
    AND existing.question_id = '69624610-b7a6-4fa6-bd0b-94a42e76f0d2'
);
