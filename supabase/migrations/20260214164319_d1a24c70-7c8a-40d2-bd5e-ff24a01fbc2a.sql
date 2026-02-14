
-- 1. Add branch_id to departments table
ALTER TABLE public.departments 
  ADD COLUMN branch_id uuid REFERENCES public.branches(id);

-- 2. Add department_id to sites table
ALTER TABLE public.sites 
  ADD COLUMN department_id uuid REFERENCES public.departments(id);

-- 3. Helper function to get user's department
CREATE OR REPLACE FUNCTION public.get_user_department_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT department_id FROM employees 
  WHERE user_id = _user_id AND deleted_at IS NULL 
  LIMIT 1
$$;

-- 4. Helper function to check if user is a manager
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.custom_role_id = r.id
    WHERE ur.user_id = _user_id 
      AND r.base_role = 'manager'
      AND r.deleted_at IS NULL
  )
$$;

-- 5. Manager-scoped RLS: employees table
-- Managers can only see employees in their own department
CREATE POLICY "Managers see own department employees"
  ON public.employees FOR SELECT
  USING (
    is_manager(auth.uid())
    AND department_id = get_user_department_id(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND deleted_at IS NULL
  );

-- 6. Manager-scoped RLS: departments table
-- Managers can only see their own department and its children
CREATE POLICY "Managers see own department"
  ON public.departments FOR SELECT
  USING (
    is_manager(auth.uid())
    AND (
      id = get_user_department_id(auth.uid())
      OR parent_id = get_user_department_id(auth.uid())
    )
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND deleted_at IS NULL
  );

-- 7. Manager-scoped RLS: sites table
-- Managers can only see sites belonging to their department
CREATE POLICY "Managers see own department sites"
  ON public.sites FOR SELECT
  USING (
    is_manager(auth.uid())
    AND department_id = get_user_department_id(auth.uid())
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND deleted_at IS NULL
  );

-- 8. Manager-scoped RLS: branches table
-- Managers can see the branch their department belongs to
CREATE POLICY "Managers see own branch"
  ON public.branches FOR SELECT
  USING (
    is_manager(auth.uid())
    AND id IN (
      SELECT d.branch_id FROM public.departments d
      WHERE d.id = get_user_department_id(auth.uid())
      AND d.deleted_at IS NULL
    )
    AND tenant_id = get_user_tenant_id(auth.uid())
    AND deleted_at IS NULL
  );
