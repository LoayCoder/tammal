
-- 1. Remove duplicate rows, keeping only the earliest one per (schedule_id, employee_id, question_id)
DELETE FROM public.scheduled_questions
WHERE id NOT IN (
  SELECT DISTINCT ON (schedule_id, employee_id, question_id) id
  FROM public.scheduled_questions
  ORDER BY schedule_id, employee_id, question_id, created_at ASC
);

-- 2. Add unique index to enforce no duplicate question assignments per user per schedule
CREATE UNIQUE INDEX idx_scheduled_questions_no_duplicates
ON public.scheduled_questions (schedule_id, employee_id, question_id);
