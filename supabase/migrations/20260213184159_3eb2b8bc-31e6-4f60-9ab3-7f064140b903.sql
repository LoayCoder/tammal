
-- Create reference_frameworks table
CREATE TABLE public.reference_frameworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  icon TEXT DEFAULT '📋',
  framework_key TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.reference_frameworks ENABLE ROW LEVEL SECURITY;

-- Super admins full access
CREATE POLICY "Super admins can manage all frameworks"
ON public.reference_frameworks FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Tenant admins can manage their own + view defaults
CREATE POLICY "Tenant admins can manage their frameworks"
ON public.reference_frameworks FOR ALL
USING (
  (tenant_id = get_user_tenant_id(auth.uid()))
  OR (is_default = true AND tenant_id IS NULL)
);

-- All authenticated users can view active frameworks (defaults + their tenant)
CREATE POLICY "Users can view active frameworks"
ON public.reference_frameworks FOR SELECT
USING (
  (
    (tenant_id = get_user_tenant_id(auth.uid()))
    OR (is_default = true AND tenant_id IS NULL)
  )
  AND is_active = true
  AND deleted_at IS NULL
);

-- Seed 6 default frameworks
INSERT INTO public.reference_frameworks (framework_key, name, name_ar, description, description_ar, icon, is_default) VALUES
('ISO45003', 'ISO 45003 — Psychological Health & Safety', 'ISO 45003 — الصحة والسلامة النفسية', 'ISO 45003 focuses on managing psychosocial risks to prevent work-related injury and ill health. Questions should identify hazards such as bullying, excessive workload, and poor management rather than just symptoms.', 'يركز ISO 45003 على إدارة المخاطر النفسية الاجتماعية لمنع الإصابات والأمراض المرتبطة بالعمل. يجب أن تحدد الأسئلة المخاطر مثل التنمر والعبء الزائد وسوء الإدارة بدلاً من مجرد الأعراض.', '🛡️', true),
('ISO10018', 'ISO 10018 & ISO 30414 — Engagement & HR Reporting', 'ISO 10018 و ISO 30414 — المشاركة وتقارير الموارد البشرية', 'Ensures questions align with global reporting standards for engagement, turnover intention, and productivity metrics as defined by ISO 10018 and ISO 30414.', 'يضمن توافق الأسئلة مع معايير التقارير العالمية للمشاركة ونية الدوران ومقاييس الإنتاجية وفقاً لـ ISO 10018 و ISO 30414.', '📊', true),
('COPSOQ', 'COPSOQ III — Psychosocial Questionnaire', 'COPSOQ III — استبيان العوامل النفسية الاجتماعية', 'Use the Copenhagen Psychosocial Questionnaire III for deep-dive questions on stress, burnout, sleeping troubles, and work environment quality.', 'استخدم استبيان كوبنهاغن النفسي الاجتماعي III لأسئلة معمقة حول الإجهاد والإرهاق ومشاكل النوم وجودة بيئة العمل.', '🧠', true),
('UWES', 'UWES — Work Engagement Scale', 'UWES — مقياس الانخراط في العمل', 'The Utrecht Work Engagement Scale measures positive work wellness defined by three dimensions: Vigor, Dedication, and Absorption — the opposite of burnout.', 'يقيس مقياس أوترخت للانخراط في العمل العافية الإيجابية في العمل عبر ثلاثة أبعاد: الحيوية والتفاني والاستغراق — عكس الإرهاق.', '⚡', true),
('WHO', 'WHO — Mental Health at Work Guidelines', 'WHO — إرشادات الصحة النفسية في العمل', 'World Health Organization guidelines emphasizing protection and promotion of mental health at work while respecting medical privacy and addressing well-being holistically.', 'إرشادات منظمة الصحة العالمية مع التركيز على حماية وتعزيز الصحة النفسية في العمل مع احترام الخصوصية الطبية ومعالجة الرفاهية بشكل شامل.', '🏥', true),
('Gallup', 'Gallup Q12 — Employee Needs Hierarchy', 'Gallup Q12 — تسلسل احتياجات الموظفين', 'Gallup Q12 structures questions based on the hierarchy of employee needs: Basic Needs, Management Support, Teamwork, and Growth opportunities.', 'يهيكل Gallup Q12 الأسئلة بناءً على تسلسل احتياجات الموظفين: الاحتياجات الأساسية ودعم الإدارة والعمل الجماعي وفرص النمو.', '📈', true);

-- Create reference_documents table
CREATE TABLE public.reference_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_set_id UUID REFERENCES public.question_sets(id),
  tenant_id UUID REFERENCES public.tenants(id),
  file_name TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reference_documents ENABLE ROW LEVEL SECURITY;

-- Super admins full access
CREATE POLICY "Super admins can manage all reference documents"
ON public.reference_documents FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Tenant admins can manage their documents
CREATE POLICY "Tenant admins can manage their reference documents"
ON public.reference_documents FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()));
