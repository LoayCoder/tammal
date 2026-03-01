
-- PR-AI-INT-04: Predictive Cost & Performance Engine
-- Creates daily aggregation tables and forecast state

-- 1. Daily cost aggregation for forecasting
CREATE TABLE IF NOT EXISTS public.ai_cost_daily_agg (
  date date NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  feature text NOT NULL,
  provider text NOT NULL,
  total_cost numeric DEFAULT 0,
  total_calls int DEFAULT 0,
  avg_cost_per_call numeric DEFAULT 0,
  PRIMARY KEY (date, tenant_id, feature, provider)
);

ALTER TABLE public.ai_cost_daily_agg ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only - ai_cost_daily_agg"
  ON public.ai_cost_daily_agg
  FOR ALL
  USING (false);

-- 2. Daily performance aggregation for SLA trend analysis
CREATE TABLE IF NOT EXISTS public.ai_performance_daily_agg (
  date date NOT NULL,
  provider text NOT NULL,
  feature text NOT NULL,
  avg_latency numeric DEFAULT 0,
  error_rate numeric DEFAULT 0,
  success_rate numeric DEFAULT 1,
  total_calls int DEFAULT 0,
  PRIMARY KEY (date, provider, feature)
);

ALTER TABLE public.ai_performance_daily_agg ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only - ai_performance_daily_agg"
  ON public.ai_performance_daily_agg
  FOR ALL
  USING (false);

-- 3. Forecast state per tenant+feature
CREATE TABLE IF NOT EXISTS public.ai_forecast_state (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  feature text NOT NULL,
  projected_monthly_cost numeric DEFAULT 0,
  burn_rate numeric DEFAULT 0,
  sla_risk_level text DEFAULT 'low',
  performance_drift_score numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, feature)
);

ALTER TABLE public.ai_forecast_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read own forecast state"
  ON public.ai_forecast_state
  FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

-- Validation trigger for sla_risk_level
CREATE OR REPLACE FUNCTION public.validate_sla_risk_level()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sla_risk_level NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'Invalid sla_risk_level: %. Must be low, medium, or high', NEW.sla_risk_level;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_ai_forecast_sla_risk
  BEFORE INSERT OR UPDATE ON public.ai_forecast_state
  FOR EACH ROW EXECUTE FUNCTION public.validate_sla_risk_level();
