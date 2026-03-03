
-- Create spiritual_sunnah_logs table
CREATE TABLE public.spiritual_sunnah_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  practice_type text NOT NULL,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date, practice_type)
);

-- Enable RLS
ALTER TABLE public.spiritual_sunnah_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own sunnah logs"
ON public.spiritual_sunnah_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sunnah logs"
ON public.spiritual_sunnah_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sunnah logs"
ON public.spiritual_sunnah_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sunnah logs"
ON public.spiritual_sunnah_logs FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_spiritual_sunnah_logs_user_date
ON public.spiritual_sunnah_logs (user_id, log_date DESC);
