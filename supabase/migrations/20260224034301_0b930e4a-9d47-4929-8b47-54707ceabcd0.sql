DROP INDEX IF EXISTS idx_employee_responses_unique_active;
CREATE UNIQUE INDEX idx_employee_responses_unique_active 
  ON public.employee_responses (scheduled_question_id, employee_id) 
  WHERE (scheduled_question_id IS NOT NULL AND deleted_at IS NULL);