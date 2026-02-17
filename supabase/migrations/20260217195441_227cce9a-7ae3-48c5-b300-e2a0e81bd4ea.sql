
-- Tenant admins can view roles for users in their tenant
CREATE POLICY "Tenant admins can view tenant user roles"
  ON public.user_roles FOR SELECT
  USING (
    has_role(auth.uid(), 'tenant_admin'::app_role)
    AND user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- Tenant admins can assign roles to users in their tenant
CREATE POLICY "Tenant admins can insert tenant user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'tenant_admin'::app_role)
    AND user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.tenant_id = get_user_tenant_id(auth.uid())
    )
    AND role != 'super_admin'
  );

-- Tenant admins can update roles for users in their tenant
CREATE POLICY "Tenant admins can update tenant user roles"
  ON public.user_roles FOR UPDATE
  USING (
    has_role(auth.uid(), 'tenant_admin'::app_role)
    AND user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.tenant_id = get_user_tenant_id(auth.uid())
    )
    AND role != 'super_admin'
  );

-- Tenant admins can remove roles for users in their tenant
CREATE POLICY "Tenant admins can delete tenant user roles"
  ON public.user_roles FOR DELETE
  USING (
    has_role(auth.uid(), 'tenant_admin'::app_role)
    AND user_id IN (
      SELECT p.user_id FROM profiles p
      WHERE p.tenant_id = get_user_tenant_id(auth.uid())
    )
    AND role != 'super_admin'
  );
