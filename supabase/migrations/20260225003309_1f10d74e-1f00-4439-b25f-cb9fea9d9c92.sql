
-- =============================================
-- Phase 1: First Aider System Upgrade Migration
-- =============================================

-- 1. Enhance mh_first_aiders with new columns
ALTER TABLE public.mh_first_aiders
  ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS response_time_avg integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_concurrent_sessions integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS calendar_integrations jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS availability_config jsonb DEFAULT '{"timezone": "UTC", "standard_hours": {}, "exceptions": []}';

-- 2. Enhance mh_crisis_cases with urgency and scheduling fields
ALTER TABLE public.mh_crisis_cases
  ADD COLUMN IF NOT EXISTS urgency_level integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS preferred_contact_method text DEFAULT 'chat',
  ADD COLUMN IF NOT EXISTS matched_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scheduled_session_id uuid DEFAULT NULL;

-- 3. Enhance mh_crisis_messages for enhanced chat
ALTER TABLE public.mh_crisis_messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS read_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS reply_to_id uuid DEFAULT NULL;

-- Add FK for reply_to_id (skip if exists)
DO $$ BEGIN
  ALTER TABLE public.mh_crisis_messages
    ADD CONSTRAINT mh_crisis_messages_reply_to_id_fkey
    FOREIGN KEY (reply_to_id) REFERENCES public.mh_crisis_messages(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- mh_crisis_messages already in supabase_realtime publication (skip)

-- 4. Create mh_support_sessions table
CREATE TABLE IF NOT EXISTS public.mh_support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  case_id uuid REFERENCES public.mh_crisis_cases(id),
  first_aider_id uuid NOT NULL REFERENCES public.mh_first_aiders(id),
  requester_user_id uuid NOT NULL,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  calendar_event_id text,
  channel text DEFAULT 'chat',
  chat_room_id text,
  call_record jsonb DEFAULT NULL,
  shared_resources jsonb DEFAULT '[]',
  session_notes text,
  outcome text,
  status text DEFAULT 'scheduled',
  data_retention_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- Add FK from mh_crisis_cases.scheduled_session_id
DO $$ BEGIN
  ALTER TABLE public.mh_crisis_cases
    ADD CONSTRAINT mh_crisis_cases_scheduled_session_id_fkey
    FOREIGN KEY (scheduled_session_id) REFERENCES public.mh_support_sessions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Create mh_session_ratings table
CREATE TABLE IF NOT EXISTS public.mh_session_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  session_id uuid NOT NULL REFERENCES public.mh_support_sessions(id),
  rater_user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- 6. Create mh_first_aider_availability table
CREATE TABLE IF NOT EXISTS public.mh_first_aider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  first_aider_id uuid NOT NULL REFERENCES public.mh_first_aiders(id),
  date date NOT NULL,
  time_slots jsonb NOT NULL DEFAULT '[]',
  external_busy_times jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL,
  UNIQUE (first_aider_id, date)
);

-- 7. Create mh_secure_attachments table
CREATE TABLE IF NOT EXISTS public.mh_secure_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  uploader_user_id uuid NOT NULL,
  context text NOT NULL DEFAULT 'session',
  context_id uuid,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  watermark_text text,
  access_log jsonb DEFAULT '[]',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- 8. Create private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_mh_support_sessions_tenant ON public.mh_support_sessions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mh_support_sessions_first_aider ON public.mh_support_sessions(first_aider_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mh_support_sessions_requester ON public.mh_support_sessions(requester_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mh_session_ratings_session ON public.mh_session_ratings(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mh_fa_availability_lookup ON public.mh_first_aider_availability(first_aider_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mh_secure_attachments_context ON public.mh_secure_attachments(context, context_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mh_crisis_messages_read ON public.mh_crisis_messages(case_id, read_at);

-- 10. Triggers for updated_at
CREATE TRIGGER update_mh_support_sessions_updated_at
  BEFORE UPDATE ON public.mh_support_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mh_fa_availability_updated_at
  BEFORE UPDATE ON public.mh_first_aider_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.mh_support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for support sessions"
  ON public.mh_support_sessions FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can create sessions"
  ON public.mh_support_sessions FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Session participants can update"
  ON public.mh_support_sessions FOR UPDATE TO authenticated
  USING (
    first_aider_id = get_first_aider_id(auth.uid())
    OR requester_user_id = auth.uid()
    OR has_role(auth.uid(), 'super_admin')
    OR has_permission(auth.uid(), 'crisis.manage')
  );

ALTER TABLE public.mh_session_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for session ratings"
  ON public.mh_session_ratings FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can rate their sessions"
  ON public.mh_session_ratings FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND rater_user_id = auth.uid());

ALTER TABLE public.mh_first_aider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for availability"
  ON public.mh_first_aider_availability FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "First aiders or admins can manage availability"
  ON public.mh_first_aider_availability FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      first_aider_id = get_first_aider_id(auth.uid())
      OR has_role(auth.uid(), 'super_admin')
      OR has_permission(auth.uid(), 'crisis.manage')
    )
  );

CREATE POLICY "First aiders or admins can update availability"
  ON public.mh_first_aider_availability FOR UPDATE TO authenticated
  USING (
    first_aider_id = get_first_aider_id(auth.uid())
    OR has_role(auth.uid(), 'super_admin')
    OR has_permission(auth.uid(), 'crisis.manage')
  );

ALTER TABLE public.mh_secure_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for secure attachments"
  ON public.mh_secure_attachments FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can upload attachments"
  ON public.mh_secure_attachments FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND uploader_user_id = auth.uid());

CREATE POLICY "Admins can manage attachments"
  ON public.mh_secure_attachments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_permission(auth.uid(), 'crisis.manage'));

-- Storage policies for support-attachments bucket
CREATE POLICY "Upload support attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "View own support attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "First aiders view support attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'support-attachments' AND is_first_aider(auth.uid()));
