
-- AI Rate Limits table for per-user and per-tenant request throttling
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID,
  feature TEXT NOT NULL,
  window_key TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint for atomic UPSERT (tenant-level when user_id IS NULL)
CREATE UNIQUE INDEX ux_ai_rate_limits_tenant_user_feature_window
ON public.ai_rate_limits (tenant_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), feature, window_key);

-- Index for cleanup queries
CREATE INDEX ix_ai_rate_limits_window_key ON public.ai_rate_limits (window_key);

-- Enable RLS
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (read-only for tenant members)
CREATE POLICY "Tenant members can view own rate limits"
ON public.ai_rate_limits
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Service role handles inserts/updates from edge functions
