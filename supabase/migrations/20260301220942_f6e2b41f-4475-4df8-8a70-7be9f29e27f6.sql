
-- ============================================================
-- PR-AI-INT-01C: Hybrid Provider Routing — DB Schema
-- ============================================================

-- 1) Aggregated provider metrics (global + tenant scoped)
CREATE TABLE public.ai_provider_metrics_agg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global', 'tenant')),
  tenant_id uuid NULL REFERENCES public.tenants(id),
  feature text NOT NULL,
  purpose text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic')),
  model text NOT NULL,
  ewma_latency_ms numeric NOT NULL DEFAULT 0,
  ewma_quality numeric NOT NULL DEFAULT 0,
  ewma_cost_per_1k numeric NOT NULL DEFAULT 0,
  ewma_success_rate numeric NOT NULL DEFAULT 1,
  sample_count int NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, tenant_id, feature, purpose, provider, model)
);

CREATE INDEX idx_ai_provider_metrics_lookup 
  ON public.ai_provider_metrics_agg (feature, purpose, scope, tenant_id);

-- 2) Raw provider events (for future 30-day TTL cron)
CREATE TABLE public.ai_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL REFERENCES public.tenants(id),
  feature text NOT NULL,
  purpose text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  latency_ms numeric NOT NULL,
  tokens_used int NULL,
  estimated_cost numeric NULL,
  quality_avg numeric NULL,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_provider_events_lookup 
  ON public.ai_provider_events (feature, purpose, provider, created_at DESC);

-- 3) RLS for ai_provider_metrics_agg
ALTER TABLE public.ai_provider_metrics_agg ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (edge functions use service role)
-- No default access for normal users
-- Tenant admins can read their own tenant rows
CREATE POLICY "tenant_admin_read_own_metrics"
  ON public.ai_provider_metrics_agg
  FOR SELECT
  USING (
    scope = 'tenant' 
    AND tenant_id = (SELECT get_user_tenant_id(auth.uid()))
    AND (
      has_role(auth.uid(), 'super_admin') 
      OR has_role(auth.uid(), 'tenant_admin')
    )
  );

-- 4) RLS for ai_provider_events — service role only
ALTER TABLE public.ai_provider_events ENABLE ROW LEVEL SECURITY;
-- No policies = no access for anon/authenticated; service role bypasses RLS
