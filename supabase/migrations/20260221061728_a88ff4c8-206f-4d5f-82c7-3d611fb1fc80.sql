-- Add name column to question_generation_batches for wellness batches
ALTER TABLE public.question_generation_batches 
ADD COLUMN name text;

-- Backfill existing batches with a default name from target_month
UPDATE public.question_generation_batches 
SET name = 'Wellness – ' || to_char(target_month, 'YYYY-MM-DD')
WHERE name IS NULL;