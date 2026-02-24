
-- ============================================================
-- WORKLOAD INTELLIGENCE PLATFORM - Phase 1: Core Schema
-- ============================================================

-- 1. Strategic Objectives (OKR top level)
CREATE TABLE public.strategic_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  quarter TEXT NOT NULL DEFAULT 'Q1',
  owner_user_id UUID,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'on_track',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.strategic_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all objectives"
  ON public.strategic_objectives FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their objectives"
  ON public.strategic_objectives FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view objectives in their tenant"
  ON public.strategic_objectives FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

CREATE TRIGGER update_strategic_objectives_updated_at
  BEFORE UPDATE ON public.strategic_objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Key Results
CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  objective_id UUID NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'percentage',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all key results"
  ON public.key_results FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their key results"
  ON public.key_results FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view key results in their tenant"
  ON public.key_results FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

CREATE TRIGGER update_key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Initiatives
CREATE TABLE public.initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  objective_id UUID NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  owner_user_id UUID,
  department_id UUID REFERENCES public.departments(id),
  division_id UUID REFERENCES public.divisions(id),
  budget NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all initiatives"
  ON public.initiatives FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their initiatives"
  ON public.initiatives FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view initiatives in their tenant"
  ON public.initiatives FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

CREATE TRIGGER update_initiatives_updated_at
  BEFORE UPDATE ON public.initiatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Objective Actions (tasks under initiatives)
CREATE TABLE public.objective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES public.employees(id),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 3,
  estimated_hours NUMERIC(6,1) NOT NULL DEFAULT 1,
  actual_hours NUMERIC(6,1),
  planned_start DATE,
  planned_end DATE,
  work_hours_only BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'planned',
  source TEXT NOT NULL DEFAULT 'manual',
  dependencies UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.objective_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all actions"
  ON public.objective_actions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their actions"
  ON public.objective_actions FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can view their assigned actions"
  ON public.objective_actions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Employees can update their assigned actions"
  ON public.objective_actions FOR UPDATE
  USING (assignee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE TRIGGER update_objective_actions_updated_at
  BEFORE UPDATE ON public.objective_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Sub-Actions (time-boxed tasks under actions)
CREATE TABLE public.action_sub_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  action_id UUID NOT NULL REFERENCES public.objective_actions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.action_sub_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all sub tasks"
  ON public.action_sub_tasks FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their sub tasks"
  ON public.action_sub_tasks FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view sub tasks in their tenant"
  ON public.action_sub_tasks FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- 6. Unified Tasks (aggregates external + internal)
CREATE TABLE public.unified_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  connector_id UUID,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  is_work_hours BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'todo',
  external_url TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.unified_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all unified tasks"
  ON public.unified_tasks FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their unified tasks"
  ON public.unified_tasks FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can manage their own tasks"
  ON public.unified_tasks FOR ALL
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE TRIGGER update_unified_tasks_updated_at
  BEFORE UPDATE ON public.unified_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Task Connectors (external integrations)
CREATE TABLE public.task_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT NOT NULL DEFAULT 'hourly',
  status TEXT NOT NULL DEFAULT 'disconnected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.task_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all connectors"
  ON public.task_connectors FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Employees can manage their own connectors"
  ON public.task_connectors FOR ALL
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE TRIGGER update_task_connectors_updated_at
  BEFORE UPDATE ON public.task_connectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Off-Hours Sessions
CREATE TABLE public.off_hours_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  category TEXT NOT NULL DEFAULT 'evening',
  task_count INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  flagged BOOLEAN NOT NULL DEFAULT false,
  manager_notified BOOLEAN NOT NULL DEFAULT false,
  source_task_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.off_hours_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all off hours sessions"
  ON public.off_hours_sessions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view their off hours sessions"
  ON public.off_hours_sessions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can view their own off hours"
  ON public.off_hours_sessions FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Managers can view department off hours"
  ON public.off_hours_sessions FOR SELECT
  USING (
    is_manager(auth.uid()) AND 
    tenant_id = get_user_tenant_id(auth.uid()) AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE department_id = get_user_department_id(auth.uid()) AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- 9. Workload Predictions (analytics cache)
CREATE TABLE public.workload_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  prediction_date DATE NOT NULL,
  predicted_hours NUMERIC(5,1) NOT NULL DEFAULT 0,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0,
  source_breakdown JSONB DEFAULT '{}',
  risk_factors JSONB DEFAULT '[]',
  suggested_actions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workload_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all predictions"
  ON public.workload_predictions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view their predictions"
  ON public.workload_predictions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can view their own predictions"
  ON public.workload_predictions FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Managers can view department predictions"
  ON public.workload_predictions FOR SELECT
  USING (
    is_manager(auth.uid()) AND 
    tenant_id = get_user_tenant_id(auth.uid()) AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE department_id = get_user_department_id(auth.uid()) AND deleted_at IS NULL
    )
  );

-- 10. Survey-Workload Correlations
CREATE TABLE public.survey_workload_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  survey_response_id UUID,
  correlation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  workload_snapshot JSONB NOT NULL DEFAULT '{}',
  mood_score NUMERIC(3,1),
  correlation_score NUMERIC(3,2),
  insights JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_workload_correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all correlations"
  ON public.survey_workload_correlations FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view their correlations"
  ON public.survey_workload_correlations FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can view their own correlations"
  ON public.survey_workload_correlations FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_strategic_objectives_tenant ON public.strategic_objectives(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_key_results_objective ON public.key_results(objective_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_initiatives_objective ON public.initiatives(objective_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_objective_actions_initiative ON public.objective_actions(initiative_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_objective_actions_assignee ON public.objective_actions(assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_action_sub_tasks_action ON public.action_sub_tasks(action_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_unified_tasks_employee ON public.unified_tasks(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_unified_tasks_status ON public.unified_tasks(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_off_hours_employee ON public.off_hours_sessions(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workload_predictions_employee ON public.workload_predictions(employee_id, prediction_date);
CREATE INDEX idx_task_connectors_employee ON public.task_connectors(employee_id) WHERE deleted_at IS NULL;
