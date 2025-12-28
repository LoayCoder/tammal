-- =====================================================
-- TAMMAL Phase 2: Core Question Engine Tables
-- =====================================================

-- Enable realtime for new tables
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_questions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_responses;

-- =====================================================
-- TABLE 1: question_schedules
-- =====================================================
CREATE TABLE public.question_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT '1_per_day' CHECK (frequency IN ('1_per_day', '2_per_day', '3_days_per_week', 'weekly', 'custom')),
    custom_schedule JSONB DEFAULT NULL,
    target_audience JSONB DEFAULT '{"all": true}'::jsonb,
    active_categories JSONB DEFAULT '[]'::jsonb,
    timezone TEXT DEFAULT 'UTC',
    preferred_time TIME DEFAULT '09:00:00',
    avoid_weekends BOOLEAN DEFAULT true,
    avoid_holidays BOOLEAN DEFAULT true,
    questions_per_delivery INTEGER DEFAULT 1 CHECK (questions_per_delivery BETWEEN 1 AND 5),
    enable_ai_generation BOOLEAN DEFAULT false,
    enable_validation BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.question_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_schedules
CREATE POLICY "Super admins can manage all schedules"
ON public.question_schedules FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage their schedules"
ON public.question_schedules FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view active schedules in their tenant"
ON public.question_schedules FOR SELECT
USING (
    tenant_id = public.get_user_tenant_id(auth.uid()) 
    AND status = 'active' 
    AND deleted_at IS NULL
);

-- Trigger for updated_at
CREATE TRIGGER update_question_schedules_updated_at
BEFORE UPDATE ON public.question_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABLE 2: scheduled_questions
-- =====================================================
CREATE TABLE public.scheduled_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.question_schedules(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    scheduled_delivery TIMESTAMPTZ NOT NULL,
    actual_delivery TIMESTAMPTZ DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'answered', 'skipped', 'expired', 'failed')),
    delivery_channel TEXT DEFAULT 'app' CHECK (delivery_channel IN ('email', 'app', 'sms')),
    reminder_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_questions
CREATE POLICY "Super admins can manage all scheduled questions"
ON public.scheduled_questions FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage their scheduled questions"
ON public.scheduled_questions FOR ALL
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can view their own scheduled questions"
ON public.scheduled_questions FOR SELECT
USING (
    employee_id IN (
        SELECT id FROM public.employees 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Employees can update their own scheduled questions"
ON public.scheduled_questions FOR UPDATE
USING (
    employee_id IN (
        SELECT id FROM public.employees 
        WHERE user_id = auth.uid()
    )
);

-- Indexes for scheduled_questions
CREATE INDEX idx_scheduled_questions_employee_delivery 
ON public.scheduled_questions(employee_id, scheduled_delivery);

CREATE INDEX idx_scheduled_questions_status_delivery 
ON public.scheduled_questions(status, scheduled_delivery);

CREATE INDEX idx_scheduled_questions_schedule_id 
ON public.scheduled_questions(schedule_id);

-- =====================================================
-- TABLE 3: employee_responses
-- =====================================================
CREATE TABLE public.employee_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_question_id UUID REFERENCES public.scheduled_questions(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    answer_value JSONB NOT NULL,
    answer_text TEXT DEFAULT NULL,
    responded_at TIMESTAMPTZ DEFAULT now(),
    response_time_seconds INTEGER DEFAULT NULL,
    device_type TEXT DEFAULT 'web' CHECK (device_type IN ('web', 'mobile')),
    session_id TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_responses
CREATE POLICY "Super admins can manage all responses"
ON public.employee_responses FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can view responses in their tenant"
ON public.employee_responses FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Employees can insert their own responses"
ON public.employee_responses FOR INSERT
WITH CHECK (
    employee_id IN (
        SELECT id FROM public.employees 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Employees can view their own responses"
ON public.employee_responses FOR SELECT
USING (
    employee_id IN (
        SELECT id FROM public.employees 
        WHERE user_id = auth.uid()
    )
);

-- Indexes for employee_responses
CREATE INDEX idx_employee_responses_employee_responded 
ON public.employee_responses(employee_id, responded_at);

CREATE INDEX idx_employee_responses_question 
ON public.employee_responses(question_id);

-- =====================================================
-- TABLE 4: validation_pairs
-- =====================================================
CREATE TABLE public.validation_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    primary_question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    validation_question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    validation_method TEXT DEFAULT 'consistency' CHECK (validation_method IN ('consistency', 'reverse', 'paraphrase')),
    expected_consistency_logic TEXT DEFAULT NULL,
    tolerance_threshold NUMERIC DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(primary_question_id, validation_question_id)
);

-- Enable RLS
ALTER TABLE public.validation_pairs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for validation_pairs
CREATE POLICY "Super admins can manage all validation pairs"
ON public.validation_pairs FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage their validation pairs"
ON public.validation_pairs FOR ALL
USING (
    tenant_id = public.get_user_tenant_id(auth.uid()) 
    OR tenant_id IS NULL
);

CREATE POLICY "Users can view active validation pairs"
ON public.validation_pairs FOR SELECT
USING (
    is_active = true 
    AND (tenant_id = public.get_user_tenant_id(auth.uid()) OR tenant_id IS NULL)
);

-- =====================================================
-- TABLE 5: ai_generation_logs (for tracking AI usage)
-- =====================================================
CREATE TABLE public.ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    prompt_type TEXT NOT NULL,
    focus_areas JSONB DEFAULT '[]'::jsonb,
    questions_generated INTEGER DEFAULT 0,
    questions_approved INTEGER DEFAULT 0,
    model_used TEXT DEFAULT 'google/gemini-2.5-flash',
    tokens_used INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_generation_logs
CREATE POLICY "Super admins can manage all AI logs"
ON public.ai_generation_logs FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can view their AI logs"
ON public.ai_generation_logs FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert AI logs"
ON public.ai_generation_logs FOR INSERT
WITH CHECK (user_id = auth.uid());