
-- Create mood_question_configs table
CREATE TABLE public.mood_question_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mood_level TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  enable_free_text BOOLEAN DEFAULT FALSE NOT NULL,
  custom_prompt_context TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, mood_level)
);

ALTER TABLE public.mood_question_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all mood configs"
ON public.mood_question_configs FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their mood configs"
ON public.mood_question_configs FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_mood_question_configs_updated_at
  BEFORE UPDATE ON public.mood_question_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create mood_question_history table
CREATE TABLE public.mood_question_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  mood_level TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  theme TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.mood_question_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood question history"
ON public.mood_question_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can view tenant mood question history"
ON public.mood_question_history FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can manage all mood question history"
ON public.mood_question_history FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Index for efficient history lookups
CREATE INDEX idx_mood_question_history_user_mood_date
ON public.mood_question_history(user_id, mood_level, created_at DESC);

CREATE INDEX idx_mood_question_history_tenant
ON public.mood_question_history(tenant_id, created_at DESC);
