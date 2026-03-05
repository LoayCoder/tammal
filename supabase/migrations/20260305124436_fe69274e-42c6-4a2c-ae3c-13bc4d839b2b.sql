
-- ============================================================
-- MIGRATION 1: current_tenant_id() helper + missing tables
-- ============================================================

-- 1a) Create current_tenant_id() as a convenience alias
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- 1b) task_queue_items — Unified task queue synced from objective_actions
CREATE TABLE IF NOT EXISTS public.task_queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  action_id uuid NOT NULL REFERENCES public.objective_actions(id),
  employee_id uuid REFERENCES public.employees(id),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  priority integer NOT NULL DEFAULT 3,
  due_date timestamptz,
  source_type text NOT NULL DEFAULT 'objective_action',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.task_queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.task_queue_items
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "tenant_isolation_insert" ON public.task_queue_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_isolation_update" ON public.task_queue_items
  FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_isolation_delete" ON public.task_queue_items
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 1c) task_evidence — Evidence/compliance attachments for actions
CREATE TABLE IF NOT EXISTS public.task_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  action_id uuid NOT NULL REFERENCES public.objective_actions(id),
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'document',
  uploaded_by uuid REFERENCES public.employees(id),
  status text NOT NULL DEFAULT 'pending',
  verified_by uuid REFERENCES public.employees(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.task_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.task_evidence
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "tenant_isolation_insert" ON public.task_evidence
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_isolation_update" ON public.task_evidence
  FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_isolation_delete" ON public.task_evidence
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 1d) approvals — Governance approval records
CREATE TABLE IF NOT EXISTS public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  requested_by uuid REFERENCES public.employees(id),
  approved_by uuid REFERENCES public.employees(id),
  status text NOT NULL DEFAULT 'pending',
  justification text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON public.approvals
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "tenant_isolation_insert" ON public.approvals
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_isolation_update" ON public.approvals
  FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL)
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_isolation_delete" ON public.approvals
  FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Validation triggers for status fields
CREATE OR REPLACE FUNCTION public.validate_task_evidence_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid task_evidence status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_task_evidence_status
  BEFORE INSERT OR UPDATE ON public.task_evidence
  FOR EACH ROW EXECUTE FUNCTION validate_task_evidence_status();

CREATE OR REPLACE FUNCTION public.validate_approval_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid approval status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_approval_status
  BEFORE INSERT OR UPDATE ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION validate_approval_status();

CREATE OR REPLACE FUNCTION public.validate_queue_item_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid task_queue_items status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_queue_item_status
  BEFORE INSERT OR UPDATE ON public.task_queue_items
  FOR EACH ROW EXECUTE FUNCTION validate_queue_item_status();

-- updated_at triggers
CREATE TRIGGER set_updated_at_task_queue_items
  BEFORE UPDATE ON public.task_queue_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_approvals
  BEFORE UPDATE ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
