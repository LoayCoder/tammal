
-- PR-AI-INT-02: Cost-Aware Routing Layer

-- 1.1 Extend ai_provider_metrics_agg with cost EWMA and recency tracking
ALTER TABLE public.ai_provider_metrics_agg
  ADD COLUMN IF NOT EXISTS cost_ewma numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_call_at timestamptz;

-- 1.2 Create tenant_ai_budget_config
CREATE TABLE public.tenant_ai_budget_config (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id),
  monthly_budget numeric NOT NULL DEFAULT 100,
  soft_limit_percentage numeric NOT NULL DEFAULT 0.8,
  routing_mode text NOT NULL DEFAULT 'balanced',
  current_month_usage numeric NOT NULL DEFAULT 0,
  usage_month text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for routing_mode
CREATE OR REPLACE FUNCTION public.validate_routing_mode()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.routing_mode NOT IN ('performance', 'balanced', 'cost_saver') THEN
    RAISE EXCEPTION 'Invalid routing_mode: %. Must be performance, balanced, or cost_saver', NEW.routing_mode;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_routing_mode
  BEFORE INSERT OR UPDATE ON public.tenant_ai_budget_config
  FOR EACH ROW EXECUTE FUNCTION public.validate_routing_mode();

-- RLS for tenant_ai_budget_config
ALTER TABLE public.tenant_ai_budget_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can read own budget config"
  ON public.tenant_ai_budget_config FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can manage own budget config"
  ON public.tenant_ai_budget_config FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- 1.3 Create ai_provider_penalties
CREATE TABLE public.ai_provider_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  feature text NOT NULL,
  penalty_multiplier numeric NOT NULL DEFAULT 0.7,
  penalty_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, feature)
);

ALTER TABLE public.ai_provider_penalties ENABLE ROW LEVEL SECURITY;
-- Service-role only, no client policies needed

-- 1.4 Create ai_provider_usage_24h
CREATE TABLE public.ai_provider_usage_24h (
  provider text PRIMARY KEY,
  calls_last_24h integer NOT NULL DEFAULT 0,
  usage_percentage numeric NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_provider_usage_24h ENABLE ROW LEVEL SECURITY;
-- Service-role only, no client policies needed
