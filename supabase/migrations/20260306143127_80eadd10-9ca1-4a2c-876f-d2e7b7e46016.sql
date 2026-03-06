
-- Dependencies for unified_tasks (separate from objective_actions dependencies)
CREATE TABLE public.unified_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  task_id UUID NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.unified_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks',
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT utd_no_self CHECK (task_id != depends_on_task_id),
  CONSTRAINT utd_unique UNIQUE (task_id, depends_on_task_id)
);

CREATE INDEX idx_utd_task ON public.unified_task_dependencies(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_utd_depends ON public.unified_task_dependencies(depends_on_task_id) WHERE deleted_at IS NULL;

ALTER TABLE public.unified_task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for unified_task_dependencies"
  ON public.unified_task_dependencies FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE OR REPLACE FUNCTION public.validate_utd_type()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.dependency_type NOT IN ('blocks', 'blocked_by', 'related') THEN
    RAISE EXCEPTION 'Invalid dependency_type: %', NEW.dependency_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_utd_type
  BEFORE INSERT OR UPDATE ON public.unified_task_dependencies
  FOR EACH ROW EXECUTE FUNCTION public.validate_utd_type();
