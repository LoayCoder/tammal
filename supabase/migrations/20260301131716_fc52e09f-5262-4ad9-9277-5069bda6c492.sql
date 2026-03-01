
-- Tenant-level AI cost/token limits
CREATE TABLE public.ai_tenant_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  monthly_token_limit INTEGER NOT NULL DEFAULT 1000000,
  monthly_cost_limit NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  warning_threshold_percent INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

ALTER TABLE public.ai_tenant_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ai_tenant_limits"
  ON public.ai_tenant_limits
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

-- Cost warning alerts (one per tenant + month + feature + limit_type)
CREATE TABLE public.ai_cost_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  alert_month TEXT NOT NULL, -- 'YYYY-MM'
  feature TEXT NOT NULL DEFAULT 'question-generator',
  limit_type TEXT NOT NULL, -- 'token' or 'cost'
  percent_used NUMERIC(5, 1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, alert_month, feature, limit_type)
);

ALTER TABLE public.ai_cost_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ai_cost_alerts"
  ON public.ai_cost_alerts
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

-- Service role needs full access for the edge function
CREATE POLICY "Service role full access ai_tenant_limits"
  ON public.ai_tenant_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access ai_cost_alerts"
  ON public.ai_cost_alerts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamps
CREATE TRIGGER update_ai_tenant_limits_updated_at
  BEFORE UPDATE ON public.ai_tenant_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
