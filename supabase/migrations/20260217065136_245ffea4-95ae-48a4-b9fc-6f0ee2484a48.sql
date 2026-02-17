
-- Add schedule_type, start_date, end_date to question_schedules
ALTER TABLE public.question_schedules
  ADD COLUMN schedule_type text NOT NULL DEFAULT 'daily_checkin',
  ADD COLUMN start_date date,
  ADD COLUMN end_date date;
