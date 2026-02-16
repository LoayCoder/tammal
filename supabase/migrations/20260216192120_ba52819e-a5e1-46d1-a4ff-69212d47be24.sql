
-- 1. Create divisions table
CREATE TABLE public.divisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- RLS policies for divisions
CREATE POLICY "Super admins can manage all divisions"
  ON public.divisions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their divisions"
  ON public.divisions FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view divisions in their tenant"
  ON public.divisions FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_divisions_updated_at
  BEFORE UPDATE ON public.divisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add division_id to departments
ALTER TABLE public.departments ADD COLUMN division_id UUID REFERENCES public.divisions(id);

-- 3. Add section_id to employees (references sites table which represents sections)
ALTER TABLE public.employees ADD COLUMN section_id UUID REFERENCES public.sites(id);

-- 4. Create work_sites table
CREATE TABLE public.work_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  name_ar TEXT,
  address TEXT,
  address_ar TEXT,
  department_id UUID REFERENCES public.departments(id),
  section_id UUID REFERENCES public.sites(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.work_sites ENABLE ROW LEVEL SECURITY;

-- RLS policies for work_sites
CREATE POLICY "Super admins can manage all work sites"
  ON public.work_sites FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their work sites"
  ON public.work_sites FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view work sites in their tenant"
  ON public.work_sites FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- Trigger for updated_at
CREATE TRIGGER update_work_sites_updated_at
  BEFORE UPDATE ON public.work_sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
