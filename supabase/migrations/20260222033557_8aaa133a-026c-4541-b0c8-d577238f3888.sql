
-- Create breathing_sessions table
CREATE TABLE public.breathing_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  technique text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  rounds_completed integer,
  rounds_target integer,
  mood_before integer,
  mood_after integer,
  completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (mirroring thought_reframes pattern)
CREATE POLICY "Employees can insert their own breathing sessions"
  ON public.breathing_sessions FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can view their own breathing sessions"
  ON public.breathing_sessions FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Employees can update their own breathing sessions"
  ON public.breathing_sessions FOR UPDATE
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can manage all breathing sessions"
  ON public.breathing_sessions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view tenant breathing sessions"
  ON public.breathing_sessions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Indexes
CREATE INDEX idx_breathing_sessions_employee ON public.breathing_sessions (employee_id, created_at);
CREATE INDEX idx_breathing_sessions_tenant ON public.breathing_sessions (tenant_id, created_at);
