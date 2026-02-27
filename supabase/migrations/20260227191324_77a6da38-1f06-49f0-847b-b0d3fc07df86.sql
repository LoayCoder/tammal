-- Prevent duplicate daily check-ins (idempotency guard)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mood_entries_employee_date
  ON public.mood_entries (employee_id, entry_date);

-- Immutable helper to extract date from timestamptz in UTC
CREATE OR REPLACE FUNCTION public.date_trunc_utc(ts timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
SET search_path = 'public'
AS $$ SELECT (ts AT TIME ZONE 'UTC')::date $$;

-- Prevent duplicate daily_checkin points for same day  
CREATE UNIQUE INDEX IF NOT EXISTS idx_points_tx_checkin_unique
  ON public.points_transactions (user_id, source_type, date_trunc_utc(created_at))
  WHERE source_type = 'daily_checkin' AND deleted_at IS NULL;