
-- Table for AI-generated spiritual wellness reports
CREATE TABLE public.spiritual_insight_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  report_type text NOT NULL DEFAULT 'weekly', -- weekly / monthly
  period_start date NOT NULL,
  period_end date NOT NULL,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spiritual_insight_reports ENABLE ROW LEVEL SECURITY;

-- User-only access (strict privacy)
CREATE POLICY "Users can manage their own insight reports"
  ON public.spiritual_insight_reports
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add reminder_time column to spiritual_preferences for reminder scheduling
ALTER TABLE public.spiritual_preferences
  ADD COLUMN IF NOT EXISTS reminder_time text DEFAULT '15'; -- minutes before prayer
