-- Baseline Hardening Migration: RLS & Helper Functions

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.get_user_accessible_branches(_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(branch_id)
  FROM public.user_roles
  WHERE user_id = _user_id AND branch_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_user_accessible_sites(_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(site_id)
  FROM public.user_roles
  WHERE user_id = _user_id AND site_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_wide_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND branch_id IS NULL AND site_id IS NULL
  );
$$;

-- 2. Update RLS for Employees

DROP POLICY IF EXISTS "Users can view employees in their tenant" ON public.employees;
DROP POLICY IF EXISTS "Tenant admins can manage their employees" ON public.employees;

CREATE POLICY "Users can view scoped employees" ON public.employees
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_tenant_wide_access(auth.uid())
      OR (branch_id IS NOT NULL AND branch_id = ANY(public.get_user_accessible_branches(auth.uid())))
      OR (site_id IS NOT NULL AND site_id = ANY(public.get_user_accessible_sites(auth.uid())))
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Tenant admins and managers can manage scoped employees" ON public.employees
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR (
          -- Tenant admins have full access
          public.has_role(auth.uid(), 'tenant_admin') AND public.has_tenant_wide_access(auth.uid())
      )
      OR (
          -- Managers can manage within their scope
          public.has_role(auth.uid(), 'manager')
          AND (
             public.has_tenant_wide_access(auth.uid())
             OR (branch_id IS NOT NULL AND branch_id = ANY(public.get_user_accessible_branches(auth.uid())))
             OR (site_id IS NOT NULL AND site_id = ANY(public.get_user_accessible_sites(auth.uid())))
          )
      )
    )
  );


-- 3. Update RLS for Questions
-- Questions: Users can view Tenant-Wide questions + their Branch questions.

DROP POLICY IF EXISTS "Users can view active questions" ON public.questions;
DROP POLICY IF EXISTS "Tenant admins can manage their questions" ON public.questions;

CREATE POLICY "Users can view scoped active questions" ON public.questions
  FOR SELECT USING (
    (tenant_id = public.get_user_tenant_id(auth.uid()) OR is_global = true)
    AND is_active = true
    AND deleted_at IS NULL
    AND (
       -- If global (cross-tenant), allow.
       is_global = true
       OR
       -- If tenant-wide user, allow all in tenant.
       public.has_tenant_wide_access(auth.uid())
       OR
       -- If question is tenant-wide (null branch/site), allow all users in tenant.
       (branch_id IS NULL AND site_id IS NULL)
       OR
       -- Explicit match
       (branch_id IS NOT NULL AND branch_id = ANY(public.get_user_accessible_branches(auth.uid())))
       OR
       (site_id IS NOT NULL AND site_id = ANY(public.get_user_accessible_sites(auth.uid())))
    )
  );

CREATE POLICY "Tenant admins and managers can manage scoped questions" ON public.questions
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_tenant_wide_access(auth.uid()) -- Simple check: if you are tenant-wide admin/manager, you can manage.
      OR (
          -- Scoped manager
          public.has_role(auth.uid(), 'manager')
          AND (
             (branch_id IS NOT NULL AND branch_id = ANY(public.get_user_accessible_branches(auth.uid())))
             OR (site_id IS NOT NULL AND site_id = ANY(public.get_user_accessible_sites(auth.uid())))
          )
      )
    )
  );


-- 4. Update RLS for Scheduled Questions

-- Assuming existing policies need update.
DROP POLICY IF EXISTS "Users can view own scheduled questions" ON public.scheduled_questions;

CREATE POLICY "Employees can view own scheduled questions" ON public.scheduled_questions
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view scoped scheduled questions" ON public.scheduled_questions
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_tenant_wide_access(auth.uid())
      OR (branch_id IS NOT NULL AND branch_id = ANY(public.get_user_accessible_branches(auth.uid())))
      OR (site_id IS NOT NULL AND site_id = ANY(public.get_user_accessible_sites(auth.uid())))
    )
  );

-- 5. Update RLS for Invitations
-- Update `Tenant admins can manage their invitations`

DROP POLICY IF EXISTS "Tenant admins can manage their invitations" ON public.invitations;

CREATE POLICY "Managers can manage scoped invitations" ON public.invitations
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_tenant_wide_access(auth.uid())
      OR (branch_id IS NOT NULL AND branch_id = ANY(public.get_user_accessible_branches(auth.uid())))
      OR (site_id IS NOT NULL AND site_id = ANY(public.get_user_accessible_sites(auth.uid())))
    )
  );

-- 6. Update RLS for Question Schedules (NEW)
-- Similar to questions/invitations: Scoped management.

CREATE POLICY "Managers can manage scoped question schedules" ON public.question_schedules
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_tenant_wide_access(auth.uid())
      OR (branch_id IS NOT NULL AND branch_id = ANY(public.get_user_accessible_branches(auth.uid())))
      OR (site_id IS NOT NULL AND site_id = ANY(public.get_user_accessible_sites(auth.uid())))
    )
  );
