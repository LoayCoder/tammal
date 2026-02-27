-- Drop the non-unique index and replace with a proper UNIQUE index
-- Enforces one mood entry per employee per day at DB level
DROP INDEX IF EXISTS idx_mood_entries_employee_date;

CREATE UNIQUE INDEX idx_mood_entries_employee_date_unique
  ON public.mood_entries (employee_id, entry_date);