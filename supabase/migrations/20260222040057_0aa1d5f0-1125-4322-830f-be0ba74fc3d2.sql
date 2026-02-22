
-- Add reroute_count tracking and sort_order to emergency contacts if not exists
-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_crisis_cases_tenant_status ON public.mh_crisis_cases (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crisis_cases_tenant_created ON public.mh_crisis_cases (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_cases_assigned ON public.mh_crisis_cases (assigned_first_aider_id, status);

-- Create a notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.mh_crisis_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  case_id uuid REFERENCES public.mh_crisis_cases(id),
  type text NOT NULL, -- 'case_assigned', 'case_accepted', 'case_declined', 'new_message', 'case_resolved', 'escalation'
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mh_crisis_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.mh_crisis_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.mh_crisis_notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.mh_crisis_notifications FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can manage all notifications"
  ON public.mh_crisis_notifications FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_crisis_notifications_user ON public.mh_crisis_notifications (user_id, is_read, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.mh_crisis_notifications;

-- Function to auto-assign a case to the best available first aider
CREATE OR REPLACE FUNCTION public.auto_assign_crisis_case(p_case_id uuid, p_tenant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_best_aider_id uuid;
  v_max_reroutes integer := 3;
  v_current_reroutes integer;
BEGIN
  -- Check reroute count
  SELECT reroute_count INTO v_current_reroutes
  FROM mh_crisis_cases WHERE id = p_case_id;
  
  IF v_current_reroutes >= v_max_reroutes THEN
    RETURN NULL; -- exceeded max reroutes
  END IF;

  -- Find best available first aider:
  -- 1. Active, not deleted, in same tenant
  -- 2. Not temporarily unavailable
  -- 3. Has capacity (active cases < max_active_cases)
  -- 4. Schedule enabled
  -- 5. Order by lowest active case count
  SELECT fa.id INTO v_best_aider_id
  FROM mh_first_aiders fa
  LEFT JOIN mh_first_aider_schedule s ON s.first_aider_id = fa.id
  WHERE fa.tenant_id = p_tenant_id
    AND fa.is_active = true
    AND fa.deleted_at IS NULL
    AND (s.id IS NULL OR (s.is_enabled = true AND s.temp_unavailable = false))
    AND count_active_cases(fa.id) < fa.max_active_cases
    -- Exclude already-declined aiders for this case
    AND fa.id NOT IN (
      SELECT DISTINCT assigned_first_aider_id 
      FROM mh_crisis_escalations e
      JOIN mh_crisis_cases c ON c.id = e.case_id
      WHERE e.case_id = p_case_id 
        AND e.escalation_type = 'declined'
    )
  ORDER BY count_active_cases(fa.id) ASC, fa.created_at ASC
  LIMIT 1;

  IF v_best_aider_id IS NOT NULL THEN
    UPDATE mh_crisis_cases
    SET assigned_first_aider_id = v_best_aider_id,
        status = 'pending_first_aider_acceptance'
    WHERE id = p_case_id;
  END IF;

  RETURN v_best_aider_id;
END;
$$;
