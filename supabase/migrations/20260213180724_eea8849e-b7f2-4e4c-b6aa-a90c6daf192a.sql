
-- Focus areas table for dynamic, tenant-scoped focus areas
CREATE TABLE public.focus_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants(id),
  label_key text NOT NULL,
  label_ar text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.focus_areas ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all
CREATE POLICY "Super admins can manage all focus areas"
ON public.focus_areas FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Tenant admins can manage their own + see defaults
CREATE POLICY "Tenant admins can manage their focus areas"
ON public.focus_areas FOR ALL
USING (
  (tenant_id = get_user_tenant_id(auth.uid()))
  OR (is_default = true AND tenant_id IS NULL)
);

-- Users can view active focus areas in their tenant
CREATE POLICY "Users can view active focus areas"
ON public.focus_areas FOR SELECT
USING (
  (
    (tenant_id = get_user_tenant_id(auth.uid()))
    OR (is_default = true AND tenant_id IS NULL)
  )
  AND is_active = true
  AND deleted_at IS NULL
);

-- Seed default focus areas (global, no tenant_id)
INSERT INTO public.focus_areas (label_key, label_ar, is_default, sort_order) VALUES
  ('burnout', 'الاحتراق الوظيفي', true, 1),
  ('engagement', 'المشاركة', true, 2),
  ('worklife', 'التوازن بين العمل والحياة', true, 3),
  ('growth', 'النمو والتطور', true, 4),
  ('culture', 'الثقافة المؤسسية', true, 5),
  ('leadership', 'القيادة', true, 6),
  ('communication', 'التواصل', true, 7),
  ('wellbeing', 'الرفاهية', true, 8);

-- Trigger for updated_at
CREATE TRIGGER update_focus_areas_updated_at
BEFORE UPDATE ON public.focus_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
