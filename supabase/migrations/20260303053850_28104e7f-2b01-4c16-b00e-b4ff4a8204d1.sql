
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- ── 1. CRITICAL: Restrict invitations table ──
DROP POLICY IF EXISTS "Anyone can verify invitation codes" ON public.invitations;

-- RPC to verify codes without exposing PII
CREATE OR REPLACE FUNCTION public.verify_invitation_code(p_code text)
RETURNS TABLE(id uuid, tenant_id uuid, used boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, used
  FROM public.invitations
  WHERE UPPER(code) = UPPER(p_code)
    AND deleted_at IS NULL
    AND used = false
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- ── 2. WARN: Fix update_updated_at_column search_path ──
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- ── 3. WARN: Restrict ai_models to authenticated users ──
DROP POLICY IF EXISTS "Anyone can view active models" ON public.ai_models;
CREATE POLICY "Authenticated users can view active models"
  ON public.ai_models FOR SELECT TO authenticated
  USING (is_active = true);

-- ── 4. WARN: Restrict platform_settings ──
DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;
CREATE POLICY "Authenticated users can read platform settings"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (true);

-- Public RPC for pre-auth config
CREATE OR REPLACE FUNCTION public.get_public_platform_config()
RETURNS TABLE(allow_public_signup boolean, show_invitation_link boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT allow_public_signup, show_invitation_link
  FROM public.platform_settings LIMIT 1;
$$;

-- ── 5. INFO: Restrict plans to authenticated ──
DROP POLICY IF EXISTS "Authenticated users can view active plans" ON public.plans;
CREATE POLICY "Authenticated users can view active plans"
  ON public.plans FOR SELECT TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- ── 6. INFO: Add policies to RLS-enabled tables with no policies ──
CREATE POLICY "Super admins can manage provider events"
  ON public.ai_provider_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view their provider events"
  ON public.ai_provider_events FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can manage provider penalties"
  ON public.ai_provider_penalties FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage provider usage"
  ON public.ai_provider_usage_24h FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));
