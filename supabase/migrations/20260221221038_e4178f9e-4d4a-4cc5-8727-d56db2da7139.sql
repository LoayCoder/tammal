
-- =============================================
-- Step 1: New table: generation_periods
-- =============================================
CREATE TABLE public.generation_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  period_type TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  locked_category_ids JSONB NOT NULL DEFAULT '[]',
  locked_subcategory_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.generation_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all generation periods"
  ON public.generation_periods FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their generation periods"
  ON public.generation_periods FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_generation_periods_updated_at
  BEFORE UPDATE ON public.generation_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Step 2: Alter generated_questions - add analytical columns
-- =============================================
ALTER TABLE public.generated_questions
  ADD COLUMN IF NOT EXISTS category_id UUID,
  ADD COLUMN IF NOT EXISTS subcategory_id UUID,
  ADD COLUMN IF NOT EXISTS mood_score INTEGER,
  ADD COLUMN IF NOT EXISTS affective_state TEXT,
  ADD COLUMN IF NOT EXISTS generation_period_id UUID REFERENCES public.generation_periods(id),
  ADD COLUMN IF NOT EXISTS question_hash TEXT;

-- =============================================
-- Step 3: Alter questions - add missing columns
-- =============================================
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS subcategory_id UUID,
  ADD COLUMN IF NOT EXISTS mood_score INTEGER,
  ADD COLUMN IF NOT EXISTS affective_state TEXT;
