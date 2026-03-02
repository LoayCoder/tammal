
-- ============================================================
-- PR-AI-INT-06: Autonomous Optimization Layer
-- ============================================================

-- 1. ai_autonomous_state — per-tenant/feature optimization state
CREATE TABLE public.ai_autonomous_state (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  feature text NOT NULL,
  current_weights jsonb NOT NULL DEFAULT '{"w_quality":0.20,"w_latency":0.20,"w_stability":0.20,"w_cost":0.20,"w_confidence":0.20}',
  previous_weights_history jsonb[] NOT NULL DEFAULT '{}',
  last_adjustment timestamptz,
  adjustment_score numeric DEFAULT 0,
  mode text NOT NULL DEFAULT 'disabled',
  exploration_boost numeric NOT NULL DEFAULT 0,
  anomaly_frozen_until timestamptz,
  hyperparams jsonb NOT NULL DEFAULT '{"decay_window":30,"smoothing_alpha":0.3,"drift_threshold":0.15}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, feature)
);

-- Validation trigger for mode
CREATE OR REPLACE FUNCTION public.validate_autonomous_mode()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.mode NOT IN ('enabled', 'disabled', 'shadow') THEN
    RAISE EXCEPTION 'Invalid autonomous mode: %. Must be enabled, disabled, or shadow', NEW.mode;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_autonomous_mode
  BEFORE INSERT OR UPDATE ON public.ai_autonomous_state
  FOR EACH ROW EXECUTE FUNCTION public.validate_autonomous_mode();

ALTER TABLE public.ai_autonomous_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access to autonomous state"
  ON public.ai_autonomous_state FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins read own autonomous state"
  ON public.ai_autonomous_state FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'tenant_admin')
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- 2. ai_autonomous_audit_log — granular optimizer decisions
CREATE TABLE public.ai_autonomous_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  feature text NOT NULL,
  previous_weights jsonb,
  new_weights jsonb,
  adjustment_reason text,
  adjustment_magnitude numeric DEFAULT 0,
  anomaly_detected boolean NOT NULL DEFAULT false,
  hyperparameter_tuned boolean NOT NULL DEFAULT false,
  sandbox_event text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_autonomous_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins read all autonomous audit logs"
  ON public.ai_autonomous_audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins read own autonomous audit logs"
  ON public.ai_autonomous_audit_log FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'tenant_admin')
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- 3. ai_sandbox_evaluations — sandbox provider lifecycle tracking
CREATE TABLE public.ai_sandbox_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  feature text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  traffic_percentage numeric NOT NULL DEFAULT 5,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  calls_total integer NOT NULL DEFAULT 0,
  calls_success integer NOT NULL DEFAULT 0,
  avg_latency numeric,
  avg_cost numeric,
  median_quality numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for sandbox status
CREATE OR REPLACE FUNCTION public.validate_sandbox_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'promoted', 'disabled', 'expired') THEN
    RAISE EXCEPTION 'Invalid sandbox status: %. Must be active, promoted, disabled, or expired', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_sandbox_status
  BEFORE INSERT OR UPDATE ON public.ai_sandbox_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.validate_sandbox_status();

ALTER TABLE public.ai_sandbox_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access to sandbox evaluations"
  ON public.ai_sandbox_evaluations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins read own sandbox evaluations"
  ON public.ai_sandbox_evaluations FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'tenant_admin')
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- Indexes for performance
CREATE INDEX idx_ai_autonomous_state_mode ON public.ai_autonomous_state (mode);
CREATE INDEX idx_ai_autonomous_audit_log_tenant_created ON public.ai_autonomous_audit_log (tenant_id, created_at DESC);
CREATE INDEX idx_ai_sandbox_evaluations_active ON public.ai_sandbox_evaluations (tenant_id, feature, status) WHERE status = 'active';
