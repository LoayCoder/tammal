-- Add draft support columns to employee_responses
ALTER TABLE public.employee_responses ADD COLUMN is_draft boolean NOT NULL DEFAULT false;
ALTER TABLE public.employee_responses ADD COLUMN survey_session_id uuid;

-- Prevent duplicate final submissions per scheduled question per employee
CREATE UNIQUE INDEX idx_employee_responses_unique_final 
ON public.employee_responses (scheduled_question_id, employee_id) 
WHERE is_draft = false;