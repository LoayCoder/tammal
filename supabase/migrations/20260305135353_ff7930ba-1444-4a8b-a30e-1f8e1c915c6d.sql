
-- 1) execution_velocity_metrics
CREATE TABLE public.execution_velocity_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  department_id uuid REFERENCES public.departments(id),
  initiative_id uuid REFERENCES public.initiatives(id),
  actions_completed integer NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  velocity_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.execution_velocity_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.execution_velocity_metrics
  FOR SELECT TO authenticated USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
CREATE POLICY "tenant_isolation_insert" ON public.execution_velocity_metrics
  FOR INSERT TO authenticated WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.execution_velocity_metrics
  FOR UPDATE TO authenticated USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation_delete" ON public.execution_velocity_metrics
  FOR DELETE TO authenticated USING (tenant_id = current_tenant_id());

CREATE INDEX idx_velocity_tenant_snapshot ON public.execution_velocity_metrics (tenant_id, period_end) WHERE deleted_at IS NULL;
CREATE INDEX idx_velocity_tenant_dept ON public.execution_velocity_metrics (tenant_id, department_id) WHERE deleted_at IS NULL;

-- 2) strategic_alignment_metrics
CREATE TABLE public.strategic_alignment_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  aligned_actions integer NOT NULL DEFAULT 0,
  total_actions integer NOT NULL DEFAULT 0,
  alignment_score numeric NOT NULL DEFAULT 0,
  snapshot_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.strategic_alignment_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.strategic_alignment_metrics
  FOR SELECT TO authenticated USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
CREATE POLICY "tenant_isolation_insert" ON public.strategic_alignment_metrics
  FOR INSERT TO authenticated WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.strategic_alignment_metrics
  FOR UPDATE TO authenticated USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation_delete" ON public.strategic_alignment_metrics
  FOR DELETE TO authenticated USING (tenant_id = current_tenant_id());

CREATE INDEX idx_alignment_tenant_snapshot ON public.strategic_alignment_metrics (tenant_id, snapshot_date) WHERE deleted_at IS NULL;

-- 3) workload_heatmap_metrics
CREATE TABLE public.workload_heatmap_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  department_id uuid REFERENCES public.departments(id),
  utilization_pct numeric NOT NULL DEFAULT 0,
  classification text NOT NULL DEFAULT 'healthy',
  snapshot_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.workload_heatmap_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.workload_heatmap_metrics
  FOR SELECT TO authenticated USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
CREATE POLICY "tenant_isolation_insert" ON public.workload_heatmap_metrics
  FOR INSERT TO authenticated WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.workload_heatmap_metrics
  FOR UPDATE TO authenticated USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation_delete" ON public.workload_heatmap_metrics
  FOR DELETE TO authenticated USING (tenant_id = current_tenant_id());

CREATE INDEX idx_heatmap_tenant_snapshot ON public.workload_heatmap_metrics (tenant_id, snapshot_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_heatmap_tenant_dept ON public.workload_heatmap_metrics (tenant_id, department_id) WHERE deleted_at IS NULL;

-- 4) initiative_risk_metrics
CREATE TABLE public.initiative_risk_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  initiative_id uuid NOT NULL REFERENCES public.initiatives(id),
  overdue_score numeric NOT NULL DEFAULT 0,
  velocity_score numeric NOT NULL DEFAULT 0,
  resource_score numeric NOT NULL DEFAULT 0,
  escalation_score numeric NOT NULL DEFAULT 0,
  risk_score numeric NOT NULL DEFAULT 0,
  snapshot_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.initiative_risk_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.initiative_risk_metrics
  FOR SELECT TO authenticated USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
CREATE POLICY "tenant_isolation_insert" ON public.initiative_risk_metrics
  FOR INSERT TO authenticated WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation_update" ON public.initiative_risk_metrics
  FOR UPDATE TO authenticated USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "tenant_isolation_delete" ON public.initiative_risk_metrics
  FOR DELETE TO authenticated USING (tenant_id = current_tenant_id());

CREATE INDEX idx_risk_tenant_snapshot ON public.initiative_risk_metrics (tenant_id, snapshot_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_risk_tenant_initiative ON public.initiative_risk_metrics (tenant_id, initiative_id) WHERE deleted_at IS NULL;
