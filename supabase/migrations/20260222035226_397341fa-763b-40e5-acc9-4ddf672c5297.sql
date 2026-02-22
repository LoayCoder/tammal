
-- ============================================================
-- CRISIS SUPPORT MODULE — Full Schema
-- ============================================================

-- A) mh_first_aiders
CREATE TABLE public.mh_first_aiders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  department text,
  role_title text,
  languages text[],
  bio text,
  contact_modes jsonb DEFAULT '{"chat": true, "call": false, "meeting": false}'::jsonb,
  max_active_cases integer NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  allow_anonymous_requests boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, user_id)
);

ALTER TABLE public.mh_first_aiders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mh_first_aiders_tenant_active ON public.mh_first_aiders(tenant_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_mh_first_aiders_tenant_user ON public.mh_first_aiders(tenant_id, user_id);

CREATE TRIGGER update_mh_first_aiders_updated_at BEFORE UPDATE ON public.mh_first_aiders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: users see active first aiders in their tenant
CREATE POLICY "Users can view active first aiders in tenant" ON public.mh_first_aiders
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) AND is_active = true AND deleted_at IS NULL);

CREATE POLICY "Super admins can manage all first aiders" ON public.mh_first_aiders
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their first aiders" ON public.mh_first_aiders
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

CREATE POLICY "First aiders can view own record" ON public.mh_first_aiders
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

-- B) mh_first_aider_schedule
CREATE TABLE public.mh_first_aider_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  first_aider_id uuid NOT NULL REFERENCES public.mh_first_aiders(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Asia/Riyadh',
  weekly_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_sla_minutes integer NOT NULL DEFAULT 60,
  is_enabled boolean NOT NULL DEFAULT true,
  temp_unavailable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, first_aider_id)
);

ALTER TABLE public.mh_first_aider_schedule ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mh_schedule_tenant_fa ON public.mh_first_aider_schedule(tenant_id, first_aider_id);

CREATE TRIGGER update_mh_schedule_updated_at BEFORE UPDATE ON public.mh_first_aider_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view schedules in tenant" ON public.mh_first_aider_schedule
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can manage all schedules" ON public.mh_first_aider_schedule
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their schedules" ON public.mh_first_aider_schedule
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

CREATE POLICY "First aiders can manage own schedule" ON public.mh_first_aider_schedule
  FOR ALL USING (first_aider_id IN (SELECT id FROM public.mh_first_aiders WHERE user_id = auth.uid()));

-- C) mh_crisis_cases
CREATE TABLE public.mh_crisis_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  requester_user_id uuid NOT NULL,
  assigned_first_aider_id uuid REFERENCES public.mh_first_aiders(id),
  intent text NOT NULL,
  risk_level text NOT NULL DEFAULT 'moderate',
  status text NOT NULL DEFAULT 'new',
  anonymity_mode text NOT NULL DEFAULT 'named',
  summary text,
  reroute_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz
);

ALTER TABLE public.mh_crisis_cases ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mh_cases_tenant_status ON public.mh_crisis_cases(tenant_id, status);
CREATE INDEX idx_mh_cases_requester ON public.mh_crisis_cases(tenant_id, requester_user_id, created_at DESC);
CREATE INDEX idx_mh_cases_first_aider ON public.mh_crisis_cases(tenant_id, assigned_first_aider_id, created_at DESC);

-- RLS
CREATE POLICY "Users can view their own cases" ON public.mh_crisis_cases
  FOR SELECT USING (requester_user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create cases in their tenant" ON public.mh_crisis_cases
  FOR INSERT WITH CHECK (requester_user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "First aiders can view assigned cases" ON public.mh_crisis_cases
  FOR SELECT USING (
    assigned_first_aider_id IN (SELECT id FROM public.mh_first_aiders WHERE user_id = auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "First aiders can update assigned cases" ON public.mh_crisis_cases
  FOR UPDATE USING (
    assigned_first_aider_id IN (SELECT id FROM public.mh_first_aiders WHERE user_id = auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Users can update own cases" ON public.mh_crisis_cases
  FOR UPDATE USING (requester_user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can manage all cases" ON public.mh_crisis_cases
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view tenant cases" ON public.mh_crisis_cases
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

-- D) mh_crisis_messages
CREATE TABLE public.mh_crisis_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  case_id uuid NOT NULL REFERENCES public.mh_crisis_cases(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  message text NOT NULL,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mh_crisis_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mh_messages_case ON public.mh_crisis_messages(tenant_id, case_id, created_at);

-- RLS: only case participants can read/write messages
CREATE POLICY "Case participants can view messages" ON public.mh_crisis_messages
  FOR SELECT USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      case_id IN (SELECT id FROM public.mh_crisis_cases WHERE requester_user_id = auth.uid())
      OR case_id IN (SELECT cc.id FROM public.mh_crisis_cases cc JOIN public.mh_first_aiders fa ON cc.assigned_first_aider_id = fa.id WHERE fa.user_id = auth.uid())
    )
  );

CREATE POLICY "Case participants can send messages" ON public.mh_crisis_messages
  FOR INSERT WITH CHECK (
    sender_user_id = auth.uid()
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND (
      case_id IN (SELECT id FROM public.mh_crisis_cases WHERE requester_user_id = auth.uid())
      OR case_id IN (SELECT cc.id FROM public.mh_crisis_cases cc JOIN public.mh_first_aiders fa ON cc.assigned_first_aider_id = fa.id WHERE fa.user_id = auth.uid())
    )
  );

CREATE POLICY "Super admins can manage all messages" ON public.mh_crisis_messages
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view tenant messages" ON public.mh_crisis_messages
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

-- E) mh_crisis_escalations
CREATE TABLE public.mh_crisis_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  case_id uuid NOT NULL REFERENCES public.mh_crisis_cases(id) ON DELETE CASCADE,
  escalation_type text NOT NULL,
  triggered_by text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mh_crisis_escalations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mh_escalations_case ON public.mh_crisis_escalations(tenant_id, case_id);

CREATE POLICY "Case participants can view escalations" ON public.mh_crisis_escalations
  FOR SELECT USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      case_id IN (SELECT id FROM public.mh_crisis_cases WHERE requester_user_id = auth.uid())
      OR case_id IN (SELECT cc.id FROM public.mh_crisis_cases cc JOIN public.mh_first_aiders fa ON cc.assigned_first_aider_id = fa.id WHERE fa.user_id = auth.uid())
    )
  );

CREATE POLICY "System can insert escalations" ON public.mh_crisis_escalations
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can manage all escalations" ON public.mh_crisis_escalations
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view tenant escalations" ON public.mh_crisis_escalations
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

-- F) mh_emergency_contacts
CREATE TABLE public.mh_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  title text NOT NULL,
  phone text,
  description text,
  available_24_7 boolean NOT NULL DEFAULT false,
  country text NOT NULL DEFAULT 'SA',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.mh_emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mh_emergency_contacts_tenant ON public.mh_emergency_contacts(tenant_id, is_active) WHERE deleted_at IS NULL;

CREATE TRIGGER update_mh_emergency_contacts_updated_at BEFORE UPDATE ON public.mh_emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view active emergency contacts in tenant" ON public.mh_emergency_contacts
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) AND is_active = true AND deleted_at IS NULL);

CREATE POLICY "Super admins can manage all emergency contacts" ON public.mh_emergency_contacts
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their emergency contacts" ON public.mh_emergency_contacts
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'tenant_admin'::app_role));

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Helper: check if user is a first aider
CREATE OR REPLACE FUNCTION public.is_first_aider(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mh_first_aiders
    WHERE user_id = _user_id AND is_active = true AND deleted_at IS NULL
  );
$$;

-- Helper: get first aider id for a user
CREATE OR REPLACE FUNCTION public.get_first_aider_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.mh_first_aiders
  WHERE user_id = _user_id AND is_active = true AND deleted_at IS NULL
  LIMIT 1;
$$;

-- Helper: count active cases for a first aider
CREATE OR REPLACE FUNCTION public.count_active_cases(_first_aider_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.mh_crisis_cases
  WHERE assigned_first_aider_id = _first_aider_id
    AND status IN ('active', 'pending_first_aider_acceptance', 'awaiting_user', 'awaiting_first_aider');
$$;

-- Map intent to risk level
CREATE OR REPLACE FUNCTION public.map_intent_to_risk(p_intent text)
RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
  SELECT CASE
    WHEN p_intent IN ('self_harm', 'unsafe') THEN 'high'
    WHEN p_intent IN ('overwhelmed', 'anxiety', 'work_stress', 'other') THEN 'moderate'
    WHEN p_intent = 'talk' THEN 'low'
    ELSE 'moderate'
  END;
$$;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.mh_crisis_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mh_crisis_cases;
