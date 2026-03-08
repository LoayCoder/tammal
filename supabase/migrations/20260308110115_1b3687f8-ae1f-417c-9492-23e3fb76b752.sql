
-- Recognition notifications table for endorsement requests, etc.
CREATE TABLE public.recognition_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nomination_id UUID REFERENCES public.nominations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'endorsement_requested',
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_recognition_notifications_user ON public.recognition_notifications(user_id, is_read);
CREATE INDEX idx_recognition_notifications_tenant ON public.recognition_notifications(tenant_id);

-- RLS
ALTER TABLE public.recognition_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.recognition_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can update own notifications"
  ON public.recognition_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated can insert notifications"
  ON public.recognition_notifications FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_tenant_id());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.recognition_notifications;
