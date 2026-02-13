
-- Create ai_models reference table
CREATE TABLE public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  accuracy_tier text NOT NULL DEFAULT 'standard',
  cost_tier text NOT NULL DEFAULT 'medium',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active models"
  ON public.ai_models FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage models"
  ON public.ai_models FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Seed models
INSERT INTO public.ai_models (model_key, display_name, accuracy_tier, cost_tier) VALUES
  ('google/gemini-2.5-flash-lite', 'Gemini Flash Lite', 'standard', 'low'),
  ('google/gemini-2.5-flash', 'Gemini Flash', 'high', 'medium'),
  ('google/gemini-2.5-pro', 'Gemini Pro', 'premium', 'high'),
  ('google/gemini-3-flash-preview', 'Gemini 3 Flash', 'high', 'medium'),
  ('google/gemini-3-pro-preview', 'Gemini 3 Pro', 'premium', 'high'),
  ('openai/gpt-5-nano', 'GPT-5 Nano', 'standard', 'low'),
  ('openai/gpt-5-mini', 'GPT-5 Mini', 'high', 'medium'),
  ('openai/gpt-5', 'GPT-5', 'premium', 'high');

-- Create question_sets table
CREATE TABLE public.question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid,
  model_used text NOT NULL,
  accuracy_mode text NOT NULL DEFAULT 'standard',
  settings jsonb DEFAULT '{}'::jsonb,
  validation_result jsonb DEFAULT '{}'::jsonb,
  critic_pass_result jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all question sets"
  ON public.question_sets FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their question sets"
  ON public.question_sets FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage their own question sets"
  ON public.question_sets FOR ALL
  USING (user_id = auth.uid());

-- Create generated_questions table
CREATE TABLE public.generated_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id uuid NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id),
  question_text text NOT NULL,
  question_text_ar text,
  type text NOT NULL,
  complexity text,
  tone text,
  explanation text,
  confidence_score numeric DEFAULT 0,
  bias_flag boolean DEFAULT false,
  ambiguity_flag boolean DEFAULT false,
  validation_status text DEFAULT 'pending',
  validation_details jsonb DEFAULT '{}'::jsonb,
  options jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.generated_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all generated questions"
  ON public.generated_questions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their generated questions"
  ON public.generated_questions FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create validation_logs table
CREATE TABLE public.validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id uuid NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id),
  validation_type text NOT NULL,
  result text NOT NULL DEFAULT 'pending',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all validation logs"
  ON public.validation_logs FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can view their validation logs"
  ON public.validation_logs FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Add enhanced columns to ai_generation_logs
ALTER TABLE public.ai_generation_logs
  ADD COLUMN IF NOT EXISTS accuracy_mode text,
  ADD COLUMN IF NOT EXISTS temperature numeric,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS validation_result jsonb,
  ADD COLUMN IF NOT EXISTS critic_pass_result jsonb,
  ADD COLUMN IF NOT EXISTS settings jsonb;

-- Create indexes
CREATE INDEX idx_question_sets_tenant ON public.question_sets(tenant_id);
CREATE INDEX idx_question_sets_user ON public.question_sets(user_id);
CREATE INDEX idx_generated_questions_set ON public.generated_questions(question_set_id);
CREATE INDEX idx_validation_logs_set ON public.validation_logs(question_set_id);

-- Triggers for updated_at
CREATE TRIGGER update_question_sets_updated_at
  BEFORE UPDATE ON public.question_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
