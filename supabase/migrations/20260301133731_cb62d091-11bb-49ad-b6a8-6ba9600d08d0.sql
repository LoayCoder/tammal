
-- 1) Ensure warning_threshold_percent exists on ai_tenant_limits (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_tenant_limits'
      AND column_name = 'warning_threshold_percent'
  ) THEN
    ALTER TABLE public.ai_tenant_limits
      ADD COLUMN warning_threshold_percent INT NOT NULL DEFAULT 80;
  END IF;
END$$;

-- 2) Create ai_usage_alerts table
CREATE TABLE IF NOT EXISTS public.ai_usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  feature TEXT NOT NULL,
  limit_type TEXT NOT NULL,
  month_key TEXT NOT NULL,
  threshold_percent INT NOT NULL,
  current_percent NUMERIC(6,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged BOOLEAN NOT NULL DEFAULT false
);

-- 3) Unique constraint for spam prevention
CREATE UNIQUE INDEX IF NOT EXISTS ux_ai_usage_alerts_tenant_month_feature_type
  ON public.ai_usage_alerts(tenant_id, month_key, feature, limit_type);

-- 4) Enable RLS
ALTER TABLE public.ai_usage_alerts ENABLE ROW LEVEL SECURITY;

-- 5) Tenant-isolated read policy (for future admin dashboard)
CREATE POLICY "Tenant admins can view their usage alerts"
  ON public.ai_usage_alerts
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 6) No direct client inserts — edge function uses service role
-- Explicitly deny client inserts for safety
CREATE POLICY "No client inserts on usage alerts"
  ON public.ai_usage_alerts
  FOR INSERT
  WITH CHECK (false);
