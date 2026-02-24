
-- Phase 1: Survey Monitor Snapshots table for trend data
CREATE TABLE public.survey_monitor_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  schedule_id UUID NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one snapshot per schedule per day
CREATE UNIQUE INDEX idx_survey_monitor_snapshots_unique 
  ON public.survey_monitor_snapshots(tenant_id, schedule_id, snapshot_date);

-- Index for fast lookups
CREATE INDEX idx_survey_monitor_snapshots_schedule 
  ON public.survey_monitor_snapshots(schedule_id, snapshot_date);

-- Enable RLS
ALTER TABLE public.survey_monitor_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Super admins can manage all snapshots"
  ON public.survey_monitor_snapshots FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their snapshots"
  ON public.survey_monitor_snapshots FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));
