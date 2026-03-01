
-- ============================================================
-- CRITICAL FIX C1: Create ai_governance_audit_log table
-- ============================================================
CREATE TABLE public.ai_governance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_entity text,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_governance_audit_log ENABLE ROW LEVEL SECURITY;

-- Super admins can read all audit logs
CREATE POLICY "Super admins read all governance audit logs"
  ON public.ai_governance_audit_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- Tenant admins can read their own tenant's audit logs
CREATE POLICY "Tenant admins read own tenant governance audit logs"
  ON public.ai_governance_audit_log
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'tenant_admin')
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- ============================================================
-- CRITICAL FIX C2: Create ai_governance_summary materialized view
-- ============================================================
CREATE MATERIALIZED VIEW public.ai_governance_summary AS
SELECT
  f.tenant_id,
  f.feature,
  f.projected_monthly_cost,
  f.burn_rate,
  f.sla_risk_level,
  f.performance_drift_score,
  f.last_updated AS forecast_updated,
  m.provider,
  m.model,
  m.scope,
  m.ewma_latency_ms,
  m.ewma_quality,
  m.ewma_success_rate,
  m.ewma_cost_per_1k,
  m.cost_ewma,
  m.sample_count,
  m.ts_alpha,
  m.ts_beta,
  m.last_call_at,
  u.calls_last_24h,
  u.usage_percentage
FROM public.ai_forecast_state f
LEFT JOIN public.ai_provider_metrics_agg m
  ON m.feature = f.feature
  AND (m.tenant_id = f.tenant_id OR m.scope = 'global')
LEFT JOIN public.ai_provider_usage_24h u
  ON u.provider = m.provider;

CREATE UNIQUE INDEX idx_ai_governance_summary_pk
  ON public.ai_governance_summary (tenant_id, feature, provider, model, scope);

-- ============================================================
-- CRITICAL FIX C2b: Create refresh RPC function
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_ai_governance_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.ai_governance_summary;
END;
$$;

-- ============================================================
-- LOW: Add production scaling indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_provider_events_created_at
  ON public.ai_provider_events (created_at);

CREATE INDEX IF NOT EXISTS idx_ai_cost_daily_agg_tenant_date
  ON public.ai_cost_daily_agg (tenant_id, date);

CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_tenant_created
  ON public.ai_generation_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_governance_audit_log_tenant_created
  ON public.ai_governance_audit_log (tenant_id, created_at DESC);
