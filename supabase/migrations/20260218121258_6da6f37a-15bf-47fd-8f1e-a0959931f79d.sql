
-- Add mood_levels column to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS mood_levels jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.questions.mood_levels IS 
'Array of mood level tags: great, good, okay, struggling, need_help. When non-empty, question appears in Mood Pathway follow-up.';

-- Add GIN index for efficient containment queries
CREATE INDEX IF NOT EXISTS idx_questions_mood_levels 
ON public.questions USING gin(mood_levels);
