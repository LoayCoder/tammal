
-- Create dynamic roles table for custom tenant roles
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  is_system_role BOOLEAN DEFAULT false,
  base_role public.app_role DEFAULT 'user',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, name)
);

-- Create permissions table for granular access control
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Add custom_role_id to user_roles for dynamic role assignment
ALTER TABLE public.user_roles 
  ADD COLUMN custom_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Super admins can manage all roles" ON public.roles
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins can manage their roles" ON public.roles
  FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can view roles in their tenant" ON public.roles
  FOR SELECT USING ((tenant_id = get_user_tenant_id(auth.uid())) AND deleted_at IS NULL);

-- RLS Policies for permissions table (read-only for most users)
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage permissions" ON public.permissions
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for role_permissions
CREATE POLICY "Super admins manage all role permissions" ON public.role_permissions
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant admins manage their role permissions" ON public.role_permissions
  FOR ALL USING (
    role_id IN (SELECT id FROM roles WHERE tenant_id = get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Users can view role permissions in their tenant" ON public.role_permissions
  FOR SELECT USING (
    role_id IN (SELECT id FROM roles WHERE tenant_id = get_user_tenant_id(auth.uid()))
  );

-- Seed default permissions
INSERT INTO public.permissions (code, name, name_ar, description, description_ar, category) VALUES
  ('users.view', 'View Users', 'عرض المستخدمين', 'Can view user list and details', 'يمكنه عرض قائمة المستخدمين وتفاصيلهم', 'Users'),
  ('users.create', 'Create Users', 'إنشاء المستخدمين', 'Can invite and create new users', 'يمكنه دعوة وإنشاء مستخدمين جدد', 'Users'),
  ('users.edit', 'Edit Users', 'تعديل المستخدمين', 'Can edit user profiles and settings', 'يمكنه تعديل ملفات المستخدمين وإعداداتهم', 'Users'),
  ('users.delete', 'Delete Users', 'حذف المستخدمين', 'Can deactivate or remove users', 'يمكنه إلغاء تفعيل أو حذف المستخدمين', 'Users'),
  ('roles.view', 'View Roles', 'عرض الأدوار', 'Can view available roles', 'يمكنه عرض الأدوار المتاحة', 'Roles'),
  ('roles.manage', 'Manage Roles', 'إدارة الأدوار', 'Can create, edit, and delete roles', 'يمكنه إنشاء وتعديل وحذف الأدوار', 'Roles'),
  ('permissions.view', 'View Permissions', 'عرض الصلاحيات', 'Can view permission assignments', 'يمكنه عرض تعيينات الصلاحيات', 'Roles'),
  ('permissions.manage', 'Manage Permissions', 'إدارة الصلاحيات', 'Can assign permissions to roles', 'يمكنه تعيين الصلاحيات للأدوار', 'Roles'),
  ('tenants.view', 'View Tenants', 'عرض المستأجرين', 'Can view tenant information', 'يمكنه عرض معلومات المستأجرين', 'Admin'),
  ('tenants.manage', 'Manage Tenants', 'إدارة المستأجرين', 'Can create and manage tenants', 'يمكنه إنشاء وإدارة المستأجرين', 'Admin'),
  ('employees.view', 'View Employees', 'عرض الموظفين', 'Can view employee records', 'يمكنه عرض سجلات الموظفين', 'Employees'),
  ('employees.manage', 'Manage Employees', 'إدارة الموظفين', 'Can create and edit employee records', 'يمكنه إنشاء وتعديل سجلات الموظفين', 'Employees'),
  ('reports.view', 'View Reports', 'عرض التقارير', 'Can view reports and analytics', 'يمكنه عرض التقارير والتحليلات', 'Reports'),
  ('reports.export', 'Export Reports', 'تصدير التقارير', 'Can export reports to files', 'يمكنه تصدير التقارير إلى ملفات', 'Reports'),
  ('settings.view', 'View Settings', 'عرض الإعدادات', 'Can view system settings', 'يمكنه عرض إعدادات النظام', 'Settings'),
  ('settings.edit', 'Edit Settings', 'تعديل الإعدادات', 'Can modify system settings', 'يمكنه تعديل إعدادات النظام', 'Settings'),
  ('questions.view', 'View Questions', 'عرض الأسئلة', 'Can view questions', 'يمكنه عرض الأسئلة', 'Questions'),
  ('questions.manage', 'Manage Questions', 'إدارة الأسئلة', 'Can create and edit questions', 'يمكنه إنشاء وتعديل الأسئلة', 'Questions'),
  ('schedules.view', 'View Schedules', 'عرض الجداول', 'Can view question schedules', 'يمكنه عرض جداول الأسئلة', 'Schedules'),
  ('schedules.manage', 'Manage Schedules', 'إدارة الجداول', 'Can create and edit schedules', 'يمكنه إنشاء وتعديل الجداول', 'Schedules'),
  ('audit.view', 'View Audit Logs', 'عرض سجلات المراجعة', 'Can view audit trail', 'يمكنه عرض سجل المراجعة', 'Admin');

-- Create permission check function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.custom_role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id 
      AND p.code = _permission_code
      AND r.deleted_at IS NULL
  )
  OR has_role(_user_id, 'super_admin'::app_role)
$$;

-- Create trigger for updated_at on roles
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
