
-- Add soft-delete column to spiritual_insight_reports
ALTER TABLE public.spiritual_insight_reports
ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Create partial index for active reports
CREATE INDEX idx_spiritual_insight_reports_active
ON public.spiritual_insight_reports (user_id, period_end DESC)
WHERE deleted_at IS NULL;
