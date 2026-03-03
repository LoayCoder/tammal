
-- representative_assignments: tracks which users are representatives for which org scope
CREATE TABLE public.representative_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope_type text NOT NULL,
  scope_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, user_id, scope_type, scope_id)
);

-- Validation trigger for scope_type
CREATE OR REPLACE FUNCTION public.validate_representative_scope_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.scope_type NOT IN ('division', 'department', 'section') THEN
    RAISE EXCEPTION 'Invalid scope_type: %. Must be division, department, or section', NEW.scope_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_representative_scope_type
  BEFORE INSERT OR UPDATE ON public.representative_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_representative_scope_type();

-- updated_at trigger
CREATE TRIGGER trg_representative_assignments_updated_at
  BEFORE UPDATE ON public.representative_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.representative_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: tenant isolation
CREATE POLICY "tenant_isolation" ON public.representative_assignments
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Super admin bypass
CREATE POLICY "super_admin_bypass" ON public.representative_assignments
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));
