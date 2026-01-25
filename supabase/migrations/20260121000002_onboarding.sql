-- Onboarding Automation: Default Structure Creation

CREATE OR REPLACE FUNCTION public.initialize_tenant_structure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
  v_site_id UUID;
BEGIN
  -- 1. Create Default Branch
  INSERT INTO public.branches (tenant_id, name, name_ar, is_active)
  VALUES (NEW.id, 'Main Branch', 'الفرع الرئيسي', true)
  RETURNING id INTO v_branch_id;

  -- 2. Create Default Site
  INSERT INTO public.sites (tenant_id, branch_id, name, name_ar, is_active)
  VALUES (NEW.id, v_branch_id, 'Main Site', 'الموقع الرئيسي', true)
  RETURNING id INTO v_site_id;

  -- 3. Log the event
  -- We attempt to log this initialization.
  INSERT INTO public.audit_logs (tenant_id, user_id, entity_type, entity_id, action, changes)
  VALUES (
    NEW.id,
    auth.uid(), -- Might be null if triggered by system
    'tenant',
    NEW.id,
    'create',
    jsonb_build_object('event', 'initialization', 'default_branch', v_branch_id, 'default_site', v_site_id)
  );

  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS on_tenant_created ON public.tenants;
CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_tenant_structure();
