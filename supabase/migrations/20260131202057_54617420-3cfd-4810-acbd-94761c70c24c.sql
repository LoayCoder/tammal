-- Seed default roles for existing tenant that was created before the auto-create trigger
DO $$
DECLARE
  _tenant_id UUID := '4fc9029e-2485-46a5-a540-ec2de643c3e3';
  admin_role_id UUID;
  manager_role_id UUID;
  viewer_role_id UUID;
BEGIN
  -- Only insert if roles don't exist for this tenant
  IF NOT EXISTS (SELECT 1 FROM roles WHERE tenant_id = _tenant_id AND deleted_at IS NULL) THEN
    -- Insert Administrator role (full access)
    INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
    VALUES (_tenant_id, 'Administrator', 'مدير', 'Full administrative access', 'وصول إداري كامل', 'tenant_admin', true, '#dc2626')
    RETURNING id INTO admin_role_id;
    
    -- Insert Manager role (operational access)
    INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
    VALUES (_tenant_id, 'Manager', 'مشرف', 'Manage employees and operations', 'إدارة الموظفين والعمليات', 'manager', true, '#2563eb')
    RETURNING id INTO manager_role_id;
    
    -- Insert Viewer role (read-only access)
    INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
    VALUES (_tenant_id, 'Viewer', 'عارض', 'View-only access to data', 'وصول للعرض فقط', 'user', true, '#16a34a')
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
  END IF;
END;
$$;