-- Baseline Hardening Migration: Multi-tenancy Structure
-- Adds Branch and Site isolation levels

-- 1. Create branches table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  address TEXT,
  address_ar TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2. Create sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  address TEXT,
  address_ar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for new tables
CREATE INDEX idx_branches_tenant ON public.branches(tenant_id);
CREATE INDEX idx_sites_tenant ON public.sites(tenant_id);
CREATE INDEX idx_sites_branch ON public.sites(branch_id);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- 3. Add columns to existing tables

-- Employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON public.employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_site ON public.employees(site_id);

-- Questions (Optional scoping)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);
CREATE INDEX IF NOT EXISTS idx_questions_branch ON public.questions(branch_id);

-- Scheduled Questions
ALTER TABLE public.scheduled_questions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.scheduled_questions ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);
CREATE INDEX IF NOT EXISTS idx_scheduled_questions_branch ON public.scheduled_questions(branch_id);

-- Question Schedules (The config for scheduling)
ALTER TABLE public.question_schedules ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.question_schedules ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);
CREATE INDEX IF NOT EXISTS idx_question_schedules_branch ON public.question_schedules(branch_id);

-- Audit Logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);

-- Login History
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);

-- Question Categories
ALTER TABLE public.question_categories ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.question_categories ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);

-- Invitations
-- branch_id already exists but without FK in some versions, so we conditionally add FK
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invitations_branch') THEN
    ALTER TABLE public.invitations ADD CONSTRAINT fk_invitations_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id);
  END IF;
END $$;

ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);


-- 4. Update user_roles for Scoped Access
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE;

-- Drop old constraint safely
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add new constraint for scoped uniqueness
-- Using COALESCE trick for compatibility with older Postgres versions or standard unique behavior
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_assignment ON public.user_roles (
  user_id,
  role,
  COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(site_id, '00000000-0000-0000-0000-000000000000'::uuid)
);


-- 5. Basic RLS for new tables (to prevent lockout)

-- Branches Policies
CREATE POLICY "Super admins can manage branches" ON public.branches
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage branches" ON public.branches
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'));

CREATE POLICY "Users can view branches in their tenant" ON public.branches
  FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Sites Policies
CREATE POLICY "Super admins can manage sites" ON public.sites
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage sites" ON public.sites
  FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND public.has_role(auth.uid(), 'tenant_admin'));

CREATE POLICY "Users can view sites in their tenant" ON public.sites
  FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
