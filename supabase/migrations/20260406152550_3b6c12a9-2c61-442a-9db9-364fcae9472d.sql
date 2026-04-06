
-- Personal insight history table for tracking copilot insights over time
CREATE TABLE public.copilot_insight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  mode TEXT NOT NULL DEFAULT 'personal',
  urgency_level TEXT NOT NULL DEFAULT 'neutral',
  primary_insight TEXT NOT NULL,
  secondary_insight TEXT,
  recommended_action TEXT,
  reasoning TEXT,
  basis_statement TEXT,
  action_cta TEXT,
  recommendations JSONB,
  insight_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Index for efficient querying
CREATE INDEX idx_copilot_insight_history_user_date ON public.copilot_insight_history(user_id, insight_date DESC);
CREATE INDEX idx_copilot_insight_history_tenant ON public.copilot_insight_history(tenant_id);

-- Enable RLS
ALTER TABLE public.copilot_insight_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own insights
CREATE POLICY "Users can view own insight history"
  ON public.copilot_insight_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Only system (edge functions via service role) can insert
CREATE POLICY "Service role can insert insights"
  ON public.copilot_insight_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
