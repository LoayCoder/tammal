
-- BUG-2: Alter question_schedules.start_date and end_date from date to timestamptz
ALTER TABLE public.question_schedules
  ALTER COLUMN start_date TYPE timestamp with time zone USING start_date::timestamp with time zone,
  ALTER COLUMN end_date TYPE timestamp with time zone USING end_date::timestamp with time zone;

-- BUG-1: Add UPDATE and DELETE RLS policies for employees on employee_responses
CREATE POLICY "Employees can update their own responses"
ON public.employee_responses
FOR UPDATE
USING (employee_id IN (
  SELECT id FROM public.employees WHERE user_id = auth.uid()
));

CREATE POLICY "Employees can delete their own draft responses"
ON public.employee_responses
FOR DELETE
USING (employee_id IN (
  SELECT id FROM public.employees WHERE user_id = auth.uid()
) AND is_draft = true);

-- BUG-3: Drop the partial unique index and create a full one for upsert support
DROP INDEX IF EXISTS idx_employee_responses_unique_final;

CREATE UNIQUE INDEX idx_employee_responses_unique_active
ON public.employee_responses (scheduled_question_id, employee_id)
WHERE scheduled_question_id IS NOT NULL;
