
-- Phase 2: Peer Appreciation System
CREATE TABLE public.appreciations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  from_employee_id UUID NOT NULL REFERENCES public.employees(id),
  to_employee_id UUID NOT NULL REFERENCES public.employees(id),
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'teamwork',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

-- Validation trigger for category
CREATE OR REPLACE FUNCTION public.validate_appreciation_category()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.category NOT IN ('teamwork', 'innovation', 'support', 'leadership', 'above_beyond') THEN
    RAISE EXCEPTION 'Invalid appreciation category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_appreciation_category
  BEFORE INSERT OR UPDATE ON public.appreciations
  FOR EACH ROW EXECUTE FUNCTION public.validate_appreciation_category();

-- Prevent self-appreciation
CREATE OR REPLACE FUNCTION public.validate_appreciation_not_self()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.from_employee_id = NEW.to_employee_id THEN
    RAISE EXCEPTION 'Cannot send appreciation to yourself';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_appreciation_not_self
  BEFORE INSERT ON public.appreciations
  FOR EACH ROW EXECUTE FUNCTION public.validate_appreciation_not_self();

-- Indexes
CREATE INDEX idx_appreciations_tenant ON public.appreciations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appreciations_to_employee ON public.appreciations(to_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appreciations_from_employee ON public.appreciations(from_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appreciations_created ON public.appreciations(created_at DESC) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.appreciations ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only see appreciations within their tenant
CREATE POLICY "Tenant users can view appreciations"
  ON public.appreciations FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Users can create appreciations within their tenant
CREATE POLICY "Tenant users can create appreciations"
  ON public.appreciations FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_tenant_id());

-- Users can soft-delete their own sent appreciations
CREATE POLICY "Users can soft-delete own appreciations"
  ON public.appreciations FOR UPDATE
  TO authenticated
  USING (tenant_id = current_tenant_id() AND from_employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid() AND deleted_at IS NULL
  ))
  WITH CHECK (tenant_id = current_tenant_id());
