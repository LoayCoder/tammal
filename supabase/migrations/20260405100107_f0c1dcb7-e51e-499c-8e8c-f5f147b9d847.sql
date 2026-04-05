
-- Create engagement_notifications table
CREATE TABLE public.engagement_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  recipient_id UUID NOT NULL REFERENCES public.employees(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  action_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_engagement_notifications_tenant ON public.engagement_notifications(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_engagement_notifications_recipient ON public.engagement_notifications(recipient_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_engagement_notifications_type_dedup ON public.engagement_notifications(recipient_id, type, created_at) WHERE deleted_at IS NULL;

-- Validation trigger for type enum
CREATE OR REPLACE FUNCTION public.validate_engagement_notification_type()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type NOT IN ('engagement_drop', 'appreciation_reminder', 'pulse_nudge', 'action_followup', 'manager_team_alert') THEN
    RAISE EXCEPTION 'Invalid engagement notification type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_engagement_notification_type
  BEFORE INSERT OR UPDATE ON public.engagement_notifications
  FOR EACH ROW EXECUTE FUNCTION public.validate_engagement_notification_type();

-- RLS
ALTER TABLE public.engagement_notifications ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: recipients can read their own notifications
CREATE POLICY "Recipients can view own engagement notifications"
  ON public.engagement_notifications
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND tenant_id = current_tenant_id()
    AND recipient_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Recipients can mark their own as read
CREATE POLICY "Recipients can update own engagement notifications"
  ON public.engagement_notifications
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND tenant_id = current_tenant_id()
    AND recipient_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND recipient_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Service role insert (edge function uses service role)
CREATE POLICY "Service role can insert engagement notifications"
  ON public.engagement_notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.engagement_notifications;
