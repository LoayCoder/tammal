
CREATE TABLE public.pulse_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID REFERENCES public.employees(id),
  scope TEXT NOT NULL,
  target_metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  target_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_pulse_targets_tenant ON public.pulse_targets(tenant_id);
CREATE INDEX idx_pulse_targets_employee ON public.pulse_targets(employee_id);
CREATE INDEX idx_pulse_targets_scope ON public.pulse_targets(scope, target_date);

ALTER TABLE public.pulse_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on pulse_targets"
ON public.pulse_targets FOR ALL
TO authenticated
USING (tenant_id = (SELECT current_tenant_id()));

CREATE OR REPLACE FUNCTION public.validate_pulse_target_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.scope NOT IN ('personal', 'team', 'organization') THEN
    RAISE EXCEPTION 'Invalid pulse_target scope: %', NEW.scope;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pulse_target_scope
BEFORE INSERT OR UPDATE ON public.pulse_targets
FOR EACH ROW EXECUTE FUNCTION public.validate_pulse_target_scope();
