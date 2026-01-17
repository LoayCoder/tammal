-- Function to create default roles for a new tenant
CREATE OR REPLACE FUNCTION public.create_default_roles_for_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_role_id UUID;
  manager_role_id UUID;
  viewer_role_id UUID;
BEGIN
  -- Insert Administrator role (full access)
  INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
  VALUES (NEW.id, 'Administrator', 'مدير', 'Full administrative access', 'وصول إداري كامل', 'tenant_admin', true, '#dc2626')
  RETURNING id INTO admin_role_id;
  
  -- Insert Manager role (operational access)
  INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
  VALUES (NEW.id, 'Manager', 'مشرف', 'Manage employees and operations', 'إدارة الموظفين والعمليات', 'manager', true, '#2563eb')
  RETURNING id INTO manager_role_id;
  
  -- Insert Viewer role (read-only access)
  INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
  VALUES (NEW.id, 'Viewer', 'عارض', 'View-only access to data', 'وصول للعرض فقط', 'user', true, '#16a34a')
  RETURNING id INTO viewer_role_id;

  -- Administrator: ALL permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT admin_role_id, id FROM public.permissions;

  -- Manager: Most permissions except admin-only ones
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT manager_role_id, id FROM public.permissions 
  WHERE code NOT IN ('tenants.manage', 'settings.edit', 'roles.manage', 'permissions.manage');

  -- Viewer: Only view permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT viewer_role_id, id FROM public.permissions 
  WHERE code LIKE '%.view';

  RETURN NEW;
END;
$$;

-- Trigger to auto-create roles when tenant is created
DROP TRIGGER IF EXISTS on_tenant_created_create_roles ON public.tenants;
CREATE TRIGGER on_tenant_created_create_roles
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_roles_for_tenant();