
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.personal_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 3,
  due_date DATE,
  linked_task_id UUID REFERENCES public.unified_tasks(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_personal_todos_employee ON public.personal_todos(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_personal_todos_tenant ON public.personal_todos(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_personal_todos_due ON public.personal_todos(due_date) WHERE deleted_at IS NULL AND is_completed = false;

ALTER TABLE public.personal_todos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_todos' AND policyname = 'Tenant isolation for personal_todos') THEN
    CREATE POLICY "Tenant isolation for personal_todos"
      ON public.personal_todos FOR ALL
      TO authenticated
      USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()))
      WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()));
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_personal_todos_updated_at ON public.personal_todos;
CREATE TRIGGER set_personal_todos_updated_at
  BEFORE UPDATE ON public.personal_todos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
