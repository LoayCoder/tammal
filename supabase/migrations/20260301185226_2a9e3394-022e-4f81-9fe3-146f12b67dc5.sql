
-- ============================================================
-- PR-AI-GOV-02: Tenant Feature Flags for AI RBAC
-- ============================================================

-- 1. Create tenant_feature_flags table
CREATE TABLE IF NOT EXISTS public.tenant_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one row per tenant+feature
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_feature_flags_tenant_feature
  ON public.tenant_feature_flags(tenant_id, feature_key);

-- 2. Enable RLS
ALTER TABLE public.tenant_feature_flags ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies: tenant-isolated reads
CREATE POLICY "Tenant members can read own feature flags"
  ON public.tenant_feature_flags
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Only admins can update
CREATE POLICY "Admins can update feature flags"
  ON public.tenant_feature_flags
  FOR UPDATE
  TO authenticated
  USING (
    (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'))
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Only admins can insert
CREATE POLICY "Admins can insert feature flags"
  ON public.tenant_feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'))
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- 4. Auto-seed default feature flags on tenant creation
CREATE OR REPLACE FUNCTION public.seed_default_feature_flags()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.tenant_feature_flags (tenant_id, feature_key, enabled) VALUES
    (NEW.id, 'question_generation', true),
    (NEW.id, 'prompt_rewrite', true),
    (NEW.id, 'ai_critic_pass', false),
    (NEW.id, 'quality_regen', false);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_feature_flags
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_feature_flags();
