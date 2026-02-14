
-- 1. Create departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  parent_id uuid REFERENCES public.departments(id),
  name text NOT NULL,
  name_ar text,
  description text,
  description_ar text,
  head_employee_id uuid REFERENCES public.employees(id),
  color text DEFAULT '#3B82F6',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 2. Create branches table
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  name text NOT NULL,
  name_ar text,
  address text,
  address_ar text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 3. Create sites table
CREATE TABLE public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  name text NOT NULL,
  name_ar text,
  address text,
  address_ar text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 4. Add department_id and branch_id to employees (additive, non-destructive)
ALTER TABLE public.employees ADD COLUMN department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.employees ADD COLUMN branch_id uuid REFERENCES public.branches(id);

-- 5. Enable RLS on all three tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for departments
CREATE POLICY "Super admins can manage all departments"
  ON public.departments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their departments"
  ON public.departments FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view departments in their tenant"
  ON public.departments FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- 7. RLS policies for branches
CREATE POLICY "Super admins can manage all branches"
  ON public.branches FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their branches"
  ON public.branches FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view branches in their tenant"
  ON public.branches FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- 8. RLS policies for sites
CREATE POLICY "Super admins can manage all sites"
  ON public.sites FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their sites"
  ON public.sites FOR ALL
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view sites in their tenant"
  ON public.sites FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND deleted_at IS NULL);

-- 9. Updated_at triggers
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
