-- Create audit_logs table for tracking all changes
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'module_toggle', 'status_change')),
  changes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view and create all audit logs
CREATE POLICY "Super admins can manage audit logs" ON public.audit_logs
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Tenant admins can view their tenant's logs
CREATE POLICY "Tenant admins can view their logs" ON public.audit_logs
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create tenant_usage table for tracking usage metrics
CREATE TABLE public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  active_users INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  storage_used_mb NUMERIC DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, period_start)
);

-- Indexes for tenant_usage
CREATE INDEX idx_tenant_usage_tenant ON public.tenant_usage(tenant_id, period_start DESC);

-- Enable RLS
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all usage records
CREATE POLICY "Super admins can manage usage" ON public.tenant_usage
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Tenants can view their own usage
CREATE POLICY "Tenants can view own usage" ON public.tenant_usage
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Trigger for updated_at on tenant_usage
CREATE TRIGGER update_tenant_usage_updated_at
  BEFORE UPDATE ON public.tenant_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();