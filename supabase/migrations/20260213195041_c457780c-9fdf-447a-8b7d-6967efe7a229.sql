-- Make question_set_id nullable to allow validation logging before save
ALTER TABLE public.validation_logs ALTER COLUMN question_set_id DROP NOT NULL;