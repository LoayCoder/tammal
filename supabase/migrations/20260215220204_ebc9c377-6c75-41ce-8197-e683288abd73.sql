-- Drop the FK constraint that only allows questions from the 'questions' table
ALTER TABLE public.scheduled_questions 
  DROP CONSTRAINT IF EXISTS scheduled_questions_question_id_fkey;

-- Add a column to track which table the question came from
ALTER TABLE public.scheduled_questions 
  ADD COLUMN IF NOT EXISTS question_source text NOT NULL DEFAULT 'questions';

COMMENT ON COLUMN public.scheduled_questions.question_source IS 'Source table: questions, wellness_questions, or generated_questions';