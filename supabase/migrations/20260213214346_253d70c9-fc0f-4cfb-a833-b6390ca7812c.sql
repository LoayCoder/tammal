
-- Create question_subcategories table
CREATE TABLE public.question_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  category_id UUID NOT NULL REFERENCES public.question_categories(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  color TEXT DEFAULT '#6366F1',
  weight NUMERIC DEFAULT 1.0,
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.question_subcategories ENABLE ROW LEVEL SECURITY;

-- Super admins: ALL
CREATE POLICY "Super admins can manage all subcategories"
ON public.question_subcategories FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Tenant admins: ALL where tenant_id matches or is_global
CREATE POLICY "Tenant admins can manage their subcategories"
ON public.question_subcategories FOR ALL
USING ((tenant_id = get_user_tenant_id(auth.uid())) OR (is_global = true));

-- Users: SELECT where active, not deleted, tenant or global
CREATE POLICY "Users can view active subcategories"
ON public.question_subcategories FOR SELECT
USING (
  ((tenant_id = get_user_tenant_id(auth.uid())) OR (is_global = true))
  AND is_active = true
  AND deleted_at IS NULL
);

-- Trigger for updated_at
CREATE TRIGGER update_question_subcategories_updated_at
BEFORE UPDATE ON public.question_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
