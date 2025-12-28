-- Create question_categories table
CREATE TABLE public.question_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'help-circle',
  weight NUMERIC DEFAULT 1.0,
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  category_id UUID REFERENCES public.question_categories(id),
  text TEXT NOT NULL,
  text_ar TEXT,
  type TEXT NOT NULL CHECK (type IN ('likert_5', 'numeric_scale', 'yes_no', 'open_ended', 'multiple_choice')),
  options JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false,
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID,
  employee_number TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  role_title TEXT,
  manager_id UUID REFERENCES public.employees(id),
  hire_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resigned', 'terminated')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);

-- Create indexes for performance
CREATE INDEX idx_question_categories_tenant ON public.question_categories(tenant_id);
CREATE INDEX idx_question_categories_active ON public.question_categories(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_tenant ON public.questions(tenant_id);
CREATE INDEX idx_questions_category ON public.questions(category_id);
CREATE INDEX idx_questions_active ON public.questions(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_tenant ON public.employees(tenant_id);
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_employees_manager ON public.employees(manager_id);
CREATE INDEX idx_employees_status ON public.employees(status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS for question_categories
CREATE POLICY "Super admins can manage all categories"
ON public.question_categories FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage their categories"
ON public.question_categories FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()) OR is_global = true);

CREATE POLICY "Users can view active categories"
ON public.question_categories FOR SELECT
USING ((tenant_id = get_user_tenant_id(auth.uid()) OR is_global = true) AND is_active = true AND deleted_at IS NULL);

-- RLS for questions
CREATE POLICY "Super admins can manage all questions"
ON public.questions FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage their questions"
ON public.questions FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()) OR is_global = true);

CREATE POLICY "Users can view active questions"
ON public.questions FOR SELECT
USING ((tenant_id = get_user_tenant_id(auth.uid()) OR is_global = true) AND is_active = true AND deleted_at IS NULL);

-- RLS for employees
CREATE POLICY "Super admins can manage all employees"
ON public.employees FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage their employees"
ON public.employees FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view employees in their tenant"
ON public.employees FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- Triggers for updated_at
CREATE TRIGGER update_question_categories_updated_at
BEFORE UPDATE ON public.question_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();