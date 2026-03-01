
-- ============================================================
-- PR-AI-PlanLimits: Plan-Based AI Limit Tables
-- ============================================================

-- A. ai_plan_limits — defines AI limits per plan tier
CREATE TABLE IF NOT EXISTS public.ai_plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key TEXT UNIQUE NOT NULL,
  monthly_token_limit BIGINT NULL,
  monthly_cost_limit NUMERIC NULL,
  warning_threshold_percent INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_plan_limits ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read plan definitions
CREATE POLICY "Authenticated users can read plan limits"
  ON public.ai_plan_limits FOR SELECT
  TO authenticated
  USING (true);

-- B. ai_tenant_plan — maps tenant to a plan
CREATE TABLE IF NOT EXISTS public.ai_tenant_plan (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL REFERENCES public.ai_plan_limits(plan_key),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tenant_plan ENABLE ROW LEVEL SECURITY;

-- Tenant members can read their own plan
CREATE POLICY "Tenant members can read own plan"
  ON public.ai_tenant_plan FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- C. Seed default plan tiers
INSERT INTO public.ai_plan_limits (plan_key, monthly_token_limit, monthly_cost_limit, warning_threshold_percent)
VALUES
  ('free',       10000,      1,    80),
  ('starter',    100000,     10,   80),
  ('pro',        1000000,    100,  85),
  ('enterprise', NULL,       NULL, 90)
ON CONFLICT (plan_key) DO NOTHING;

-- D. Trigger for updated_at on ai_plan_limits
CREATE TRIGGER update_ai_plan_limits_updated_at
  BEFORE UPDATE ON public.ai_plan_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- E. Trigger for updated_at on ai_tenant_plan
CREATE TRIGGER update_ai_tenant_plan_updated_at
  BEFORE UPDATE ON public.ai_tenant_plan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
