
CREATE TABLE public.copilot_insight_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  insight_date DATE NOT NULL DEFAULT CURRENT_DATE,
  insight_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope_key, insight_date)
);

ALTER TABLE public.copilot_insight_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on copilot_insight_cache"
  ON public.copilot_insight_cache
  FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE INDEX idx_copilot_cache_scope_date ON public.copilot_insight_cache(scope_key, insight_date);
CREATE INDEX idx_copilot_cache_tenant ON public.copilot_insight_cache(tenant_id);
