
-- Governance configuration table for tenant-customizable rules
CREATE TABLE public.governance_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, config_key)
);

-- Enable RLS
ALTER TABLE public.governance_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "tenant_isolation" ON public.governance_config
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "admin_manage" ON public.governance_config
  FOR ALL TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND deleted_at IS NULL
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'tenant_admin'))
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'tenant_admin'))
  );

-- Index for fast lookups
CREATE INDEX idx_governance_config_tenant_key ON public.governance_config(tenant_id, config_key) WHERE deleted_at IS NULL;

-- Seed default escalation and SLA configs for existing tenants
INSERT INTO public.governance_config (tenant_id, config_key, config_value, description)
SELECT t.id, 'escalation_thresholds',
  '[{"level":1,"daysOverdue":3,"target":"manager"},{"level":2,"daysOverdue":7,"target":"department_head"},{"level":3,"daysOverdue":14,"target":"executive"}]'::jsonb,
  'Escalation level thresholds for overdue tasks'
FROM public.tenants t
WHERE t.deleted_at IS NULL
ON CONFLICT (tenant_id, config_key) DO NOTHING;

INSERT INTO public.governance_config (tenant_id, config_key, config_value, description)
SELECT t.id, 'sla_thresholds',
  '{"approaching_percent":80,"breach_percent":100}'::jsonb,
  'SLA breach threshold percentages'
FROM public.tenants t
WHERE t.deleted_at IS NULL
ON CONFLICT (tenant_id, config_key) DO NOTHING;

-- Auto-seed for new tenants
CREATE OR REPLACE FUNCTION public.seed_default_governance_config()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.governance_config (tenant_id, config_key, config_value, description) VALUES
    (NEW.id, 'escalation_thresholds',
     '[{"level":1,"daysOverdue":3,"target":"manager"},{"level":2,"daysOverdue":7,"target":"department_head"},{"level":3,"daysOverdue":14,"target":"executive"}]'::jsonb,
     'Escalation level thresholds for overdue tasks'),
    (NEW.id, 'sla_thresholds',
     '{"approaching_percent":80,"breach_percent":100}'::jsonb,
     'SLA breach threshold percentages');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_governance_config
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_governance_config();
