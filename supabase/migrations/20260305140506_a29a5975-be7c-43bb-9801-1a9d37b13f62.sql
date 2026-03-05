
-- ===== burnout_predictions =====
CREATE TABLE public.burnout_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  burnout_probability_score NUMERIC NOT NULL DEFAULT 0,
  indicators JSONB NOT NULL DEFAULT '{}'::jsonb,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence_score NUMERIC DEFAULT 0,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.burnout_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.burnout_predictions
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant_isolation_insert" ON public.burnout_predictions
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());

CREATE INDEX idx_burnout_predictions_tenant_created ON public.burnout_predictions(tenant_id, created_at DESC);
CREATE INDEX idx_burnout_predictions_employee ON public.burnout_predictions(tenant_id, employee_id);

-- ===== redistribution_recommendations =====
CREATE TABLE public.redistribution_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  from_employee_id UUID NOT NULL REFERENCES public.employees(id),
  to_employee_id UUID NOT NULL REFERENCES public.employees(id),
  action_id UUID REFERENCES public.objective_actions(id),
  reason TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  capacity_diff NUMERIC DEFAULT 0,
  skill_match_score NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.redistribution_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.redistribution_recommendations
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant_isolation_insert" ON public.redistribution_recommendations
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.redistribution_recommendations
  FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id());

CREATE INDEX idx_redistribution_tenant_created ON public.redistribution_recommendations(tenant_id, created_at DESC);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_redistribution_status()
  RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted', 'rejected', 'expired') THEN
    RAISE EXCEPTION 'Invalid redistribution status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_redistribution_status
  BEFORE INSERT OR UPDATE ON public.redistribution_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.validate_redistribution_status();

-- ===== org_intelligence_scores =====
CREATE TABLE public.org_intelligence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  score NUMERIC NOT NULL DEFAULT 0,
  components JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.org_intelligence_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.org_intelligence_scores
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant_isolation_insert" ON public.org_intelligence_scores
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());

CREATE INDEX idx_org_intelligence_tenant_date ON public.org_intelligence_scores(tenant_id, snapshot_date DESC);
