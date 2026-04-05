
-- 1. Engagement Action Log table
CREATE TABLE public.engagement_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  action_type TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_engagement_action_log_tenant ON public.engagement_action_log(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_engagement_action_log_employee ON public.engagement_action_log(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_engagement_action_log_type ON public.engagement_action_log(action_type, created_at) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.engagement_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.engagement_action_log
  FOR ALL USING (tenant_id = current_tenant_id());

-- Validation trigger for action_type
CREATE OR REPLACE FUNCTION public.validate_engagement_action_type()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.action_type NOT IN ('cta_clicked', 'nudge_dismissed', 'nudge_acted', 'appreciation_sent', 'checkin_from_nudge') THEN
    RAISE EXCEPTION 'Invalid engagement action_type: %', NEW.action_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_engagement_action_type
  BEFORE INSERT OR UPDATE ON public.engagement_action_log
  FOR EACH ROW EXECUTE FUNCTION public.validate_engagement_action_type();

-- Validation trigger for source
CREATE OR REPLACE FUNCTION public.validate_engagement_action_source()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.source NOT IN ('pulse_card', 'nudge_card', 'appreciation_widget') THEN
    RAISE EXCEPTION 'Invalid engagement action source: %', NEW.source;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_engagement_action_source
  BEFORE INSERT OR UPDATE ON public.engagement_action_log
  FOR EACH ROW EXECUTE FUNCTION public.validate_engagement_action_source();

-- 2. Unique constraint on pulse_targets to prevent duplicate daily entries
CREATE UNIQUE INDEX idx_pulse_targets_unique_daily
  ON public.pulse_targets (COALESCE(employee_id, '00000000-0000-0000-0000-000000000000'), scope, target_date)
  WHERE deleted_at IS NULL;
