
-- =============================================
-- WELLNESS MODULE: 5 New Tables + RLS
-- =============================================

-- 1. question_generation_batches (must be created first, referenced by wellness_questions)
CREATE TABLE public.question_generation_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  target_month date NOT NULL,
  question_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  deleted_at timestamptz
);

ALTER TABLE public.question_generation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all batches"
  ON public.question_generation_batches FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their batches"
  ON public.question_generation_batches FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 2. wellness_questions
CREATE TABLE public.wellness_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  batch_id uuid REFERENCES public.question_generation_batches(id),
  question_text_en text NOT NULL,
  question_text_ar text,
  question_type text NOT NULL DEFAULT 'scale',
  options jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.wellness_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all wellness questions"
  ON public.wellness_questions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their wellness questions"
  ON public.wellness_questions FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can view published wellness questions"
  ON public.wellness_questions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND status = 'published' AND deleted_at IS NULL);

-- 3. question_schedule_settings (single row per tenant)
CREATE TABLE public.question_schedule_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id),
  delivery_time time NOT NULL DEFAULT '09:00'::time,
  active_days jsonb NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb,
  questions_per_day integer NOT NULL DEFAULT 1,
  workdays_only boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.question_schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all schedule settings"
  ON public.question_schedule_settings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their schedule settings"
  ON public.question_schedule_settings FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 4. daily_question_schedule
CREATE TABLE public.daily_question_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  question_id uuid NOT NULL REFERENCES public.wellness_questions(id),
  scheduled_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_question_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all daily schedules"
  ON public.daily_question_schedule FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their daily schedules"
  ON public.daily_question_schedule FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can view their tenant daily schedules"
  ON public.daily_question_schedule FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 5. mood_entries
CREATE TABLE public.mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  mood_level text NOT NULL,
  mood_score integer NOT NULL,
  question_id uuid REFERENCES public.wellness_questions(id),
  answer_value jsonb,
  answer_text text,
  ai_tip text,
  support_actions jsonb DEFAULT '[]'::jsonb,
  points_earned integer NOT NULL DEFAULT 0,
  streak_count integer NOT NULL DEFAULT 0,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all mood entries"
  ON public.mood_entries FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view mood entries in their tenant"
  ON public.mood_entries FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can insert their own mood entries"
  ON public.mood_entries FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can view their own mood entries"
  ON public.mood_entries FOR SELECT
  USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_daily_question_schedule_date ON public.daily_question_schedule(tenant_id, scheduled_date);
CREATE INDEX idx_mood_entries_employee_date ON public.mood_entries(employee_id, entry_date);
CREATE INDEX idx_wellness_questions_batch ON public.wellness_questions(batch_id);
CREATE INDEX idx_mood_entries_tenant_date ON public.mood_entries(tenant_id, entry_date);
