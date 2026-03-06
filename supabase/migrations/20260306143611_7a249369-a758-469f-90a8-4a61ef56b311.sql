
CREATE TABLE public.task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  task_id UUID NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  description TEXT,
  is_running BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_time_entries_task ON public.task_time_entries(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_employee ON public.task_time_entries(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_running ON public.task_time_entries(employee_id, is_running) WHERE deleted_at IS NULL AND is_running = true;

ALTER TABLE public.task_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_time_entries"
  ON public.task_time_entries FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
