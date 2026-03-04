-- Phase 1: Strategic Execution Platform — Data Model & Accountability

-- 1. Ownership & Accountability columns
ALTER TABLE strategic_objectives ADD COLUMN IF NOT EXISTS accountable_user_id UUID REFERENCES employees(id);
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS accountable_user_id UUID REFERENCES employees(id);
ALTER TABLE objective_actions ADD COLUMN IF NOT EXISTS accountable_user_id UUID REFERENCES employees(id);
ALTER TABLE action_sub_tasks ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES employees(id);

-- 2. Employee Capacity table
CREATE TABLE IF NOT EXISTS employee_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES employees(id),
  daily_capacity_minutes INT NOT NULL DEFAULT 480,
  weekly_capacity_minutes INT NOT NULL DEFAULT 2400,
  max_concurrent_actions INT NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, user_id)
);
ALTER TABLE employee_capacity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ec_tenant_select" ON employee_capacity FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "ec_tenant_insert" ON employee_capacity FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "ec_tenant_update" ON employee_capacity FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE TRIGGER set_employee_capacity_updated_at BEFORE UPDATE ON employee_capacity FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Workload Metrics table
CREATE TABLE IF NOT EXISTS workload_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  utilization_percentage NUMERIC(5,2) DEFAULT 0,
  burnout_risk_score NUMERIC(5,2) DEFAULT 0,
  alignment_score NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, employee_id)
);
ALTER TABLE workload_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wm_tenant_select" ON workload_metrics FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "wm_tenant_insert" ON workload_metrics FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "wm_tenant_update" ON workload_metrics FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 4. Evidence & SLA fields on objective_actions
ALTER TABLE objective_actions
  ADD COLUMN IF NOT EXISTS evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS evidence_type TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_minutes INT,
  ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'within_sla',
  ADD COLUMN IF NOT EXISTS priority_score NUMERIC(5,2);

-- 5. Task Dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  task_id UUID NOT NULL REFERENCES objective_actions(id),
  depends_on_task_id UUID NOT NULL REFERENCES objective_actions(id),
  dependency_type TEXT NOT NULL DEFAULT 'depends_on',
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "td_tenant_select" ON task_dependencies FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "td_tenant_insert" ON task_dependencies FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "td_tenant_update" ON task_dependencies FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 6. Escalation Events table
CREATE TABLE IF NOT EXISTS escalation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  task_id UUID NOT NULL REFERENCES objective_actions(id),
  escalation_level INT NOT NULL DEFAULT 1,
  escalated_to UUID REFERENCES employees(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ee_tenant_select" ON escalation_events FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "ee_tenant_insert" ON escalation_events FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "ee_tenant_update" ON escalation_events FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_employee_capacity_tenant ON employee_capacity(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workload_metrics_tenant ON workload_metrics(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_dependencies_tenant ON task_dependencies(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_escalation_events_tenant ON escalation_events(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_escalation_events_task ON escalation_events(task_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_objective_actions_sla ON objective_actions(sla_status) WHERE deleted_at IS NULL;