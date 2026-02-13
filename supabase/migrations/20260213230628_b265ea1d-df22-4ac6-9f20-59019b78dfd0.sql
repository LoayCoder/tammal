
ALTER TABLE question_sets ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE question_sets ADD COLUMN IF NOT EXISTS question_count integer NOT NULL DEFAULT 0;
