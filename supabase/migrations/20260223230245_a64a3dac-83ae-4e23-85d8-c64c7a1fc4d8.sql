
-- Create wellness insight cache table for AI-generated analytics
CREATE TABLE public.wellness_insight_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  insight_date DATE NOT NULL DEFAULT CURRENT_DATE,
  insight_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, insight_date)
);

-- Enable RLS
ALTER TABLE public.wellness_insight_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Super admins can manage all insights"
  ON public.wellness_insight_cache FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view their insights"
  ON public.wellness_insight_cache FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can insert their insights"
  ON public.wellness_insight_cache FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
