-- Add generation_period_id to question_sets
ALTER TABLE question_sets ADD COLUMN generation_period_id uuid REFERENCES generation_periods(id);

-- Add generation_period_id to question_generation_batches
ALTER TABLE question_generation_batches ADD COLUMN generation_period_id uuid REFERENCES generation_periods(id);

-- Add generation_period_id to question_schedules
ALTER TABLE question_schedules ADD COLUMN generation_period_id uuid REFERENCES generation_periods(id);