
-- Recurring task templates
CREATE TABLE public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  visibility TEXT NOT NULL DEFAULT 'department',
  source_type TEXT NOT NULL DEFAULT 'recurring',
  assignee_id UUID REFERENCES public.employees(id),
  reviewer_id UUID REFERENCES public.employees(id),
  approver_id UUID REFERENCES public.employees(id),
  department_id UUID REFERENCES public.departments(id),
  initiative_id UUID REFERENCES public.initiatives(id),
  objective_id UUID REFERENCES public.strategic_objectives(id),
  estimated_minutes INT DEFAULT 60,
  -- Recurrence config
  recurrence_pattern TEXT NOT NULL DEFAULT 'weekly', -- daily, weekly, biweekly, monthly, quarterly
  recurrence_day_of_week INT, -- 0=Sun..6=Sat (for weekly/biweekly)
  recurrence_day_of_month INT, -- 1-28 (for monthly/quarterly)
  recurrence_time TIME DEFAULT '09:00',
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_task_templates_tenant ON public.task_templates(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_task_templates_next_run ON public.task_templates(next_run_at) WHERE deleted_at IS NULL AND is_active = true;

-- RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_templates"
  ON public.task_templates FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Validation trigger for recurrence_pattern
CREATE OR REPLACE FUNCTION public.validate_recurrence_pattern()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.recurrence_pattern NOT IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly') THEN
    RAISE EXCEPTION 'Invalid recurrence_pattern: %', NEW.recurrence_pattern;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_recurrence_pattern
  BEFORE INSERT OR UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION public.validate_recurrence_pattern();
