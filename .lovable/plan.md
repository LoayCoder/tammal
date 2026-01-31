
# Make User Management Fully Functional

## Problem Analysis

The User Management page currently has several issues preventing it from working:

1. **Hardcoded placeholder tenant ID** - The page uses `'placeholder-tenant-id'` instead of the actual tenant
2. **No roles exist for the existing tenant** - The tenant was created before the auto-create trigger was added
3. **Super admin user has no tenant_id** - The test user's profile has `tenant_id: null`
4. **Users query doesn't fetch role details properly** - Missing the joined roles data

## Solution Overview

### 1. Database Fix: Seed Default Roles for Existing Tenant

Run a migration to manually create the three default roles (Administrator, Manager, Viewer) and their permissions for the existing tenant `4fc9029e-2485-46a5-a540-ec2de643c3e3`.

```sql
-- Insert default roles for existing tenant
INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
VALUES 
  ('4fc9029e-2485-46a5-a540-ec2de643c3e3', 'Administrator', 'مدير', 'Full administrative access', 'وصول إداري كامل', 'tenant_admin', true, '#dc2626'),
  ('4fc9029e-2485-46a5-a540-ec2de643c3e3', 'Manager', 'مشرف', 'Manage employees and operations', 'إدارة الموظفين والعمليات', 'manager', true, '#2563eb'),
  ('4fc9029e-2485-46a5-a540-ec2de643c3e3', 'Viewer', 'عارض', 'View-only access to data', 'وصول للعرض فقط', 'user', true, '#16a34a');

-- Assign permissions to roles (similar to trigger logic)
```

### 2. Fix UserManagement.tsx - Dynamic Tenant Resolution

Replace the hardcoded placeholder with dynamic tenant resolution:

| Current | Fixed |
|---------|-------|
| `const tenantId = 'placeholder-tenant-id';` | Use `useProfile()` to get tenant, or for super_admin, allow tenant selection |

**Logic Flow:**
- Fetch user's profile with `useProfile()`
- If user is super_admin and has no tenant, show tenant selector dropdown
- Otherwise, use profile.tenant_id

### 3. Update useUsers Hook - Fix Role Fetching

The current hook fetches user_roles but doesn't join the roles table properly. Update to:

```typescript
// Fetch user roles WITH custom role details
const { data: userRolesData } = await supabase
  .from('user_roles')
  .select(`
    *,
    roles:custom_role_id(id, name, name_ar, color)
  `)
  .in('user_id', userIds);
```

### 4. Update InviteUserDialog - Use Dynamic TenantId

Pass the actual tenant_id from parent component, not hardcoded value.

### 5. Add Tenant Selector for Super Admins

Since super_admins can manage all tenants, add a dropdown at the top of the page to select which tenant's users to view/manage.

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/UserManagement.tsx` | Add tenant selection for super_admin, get tenant from profile |
| `src/hooks/useUsers.ts` | Fix role fetching with proper join, add tenantId filter |
| `src/components/users/UserTable.tsx` | Ensure role badges render correctly |
| `src/components/users/InviteUserDialog.tsx` | Accept dynamic tenantId (already does, just need correct prop) |
| Database migration | Seed default roles for existing tenant |

## Implementation Steps

### Step 1: Database Migration (Default Roles for Existing Tenant)
```sql
-- Seed roles for existing tenant that was created before trigger
DO $$
DECLARE
  _tenant_id UUID := '4fc9029e-2485-46a5-a540-ec2de643c3e3';
  admin_role_id UUID;
  manager_role_id UUID;
  viewer_role_id UUID;
BEGIN
  -- Only insert if roles don't exist for this tenant
  IF NOT EXISTS (SELECT 1 FROM roles WHERE tenant_id = _tenant_id AND deleted_at IS NULL) THEN
    -- Insert Administrator role
    INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
    VALUES (_tenant_id, 'Administrator', 'مدير', 'Full administrative access', 'وصول إداري كامل', 'tenant_admin', true, '#dc2626')
    RETURNING id INTO admin_role_id;
    
    -- Insert Manager role
    INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
    VALUES (_tenant_id, 'Manager', 'مشرف', 'Manage employees and operations', 'إدارة الموظفين والعمليات', 'manager', true, '#2563eb')
    RETURNING id INTO manager_role_id;
    
    -- Insert Viewer role
    INSERT INTO public.roles (tenant_id, name, name_ar, description, description_ar, base_role, is_system_role, color)
    VALUES (_tenant_id, 'Viewer', 'عارض', 'View-only access to data', 'وصول للعرض فقط', 'user', true, '#16a34a')
    RETURNING id INTO viewer_role_id;

    -- Assign permissions to roles
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM public.permissions;

    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM public.permissions 
    WHERE code NOT IN ('tenants.manage', 'settings.edit', 'roles.manage', 'permissions.manage');

    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT viewer_role_id, id FROM public.permissions 
    WHERE code LIKE '%.view';
  END IF;
END;
$$;
```

### Step 2: Update UserManagement.tsx

```typescript
// Add imports
import { useProfile } from '@/hooks/useProfile';
import { useTenants } from '@/hooks/useTenants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// In component:
const { profile, isLoading: profileLoading } = useProfile();
const { tenants } = useTenants(); // For super_admin tenant selection
const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

// Determine effective tenant ID
const isSuperAdmin = user?.app_metadata?.role === 'super_admin' || true; // Check from user_roles
const effectiveTenantId = isSuperAdmin 
  ? (selectedTenantId || profile?.tenant_id || tenants?.[0]?.id)
  : profile?.tenant_id;

// Pass to hooks
const { users, isLoading: usersLoading } = useUsers({ tenantId: effectiveTenantId });
const { roles } = useRoles(effectiveTenantId);
```

### Step 3: Fix useUsers Hook

Update the query to properly fetch roles:
```typescript
// When fetching user roles, join with custom_role details
const { data: userRolesData } = await supabase
  .from('user_roles')
  .select(`
    id,
    user_id,
    role,
    custom_role_id,
    roles:custom_role_id(id, name, name_ar, color, description)
  `)
  .in('user_id', userIds);
```

### Step 4: Add Tenant Selector UI (for Super Admins)

Add a dropdown in the header section:
```tsx
{isSuperAdmin && tenants.length > 1 && (
  <Select value={effectiveTenantId || ''} onValueChange={setSelectedTenantId}>
    <SelectTrigger className="w-[250px]">
      <SelectValue placeholder={t('users.selectTenant')} />
    </SelectTrigger>
    <SelectContent>
      {tenants.map(tenant => (
        <SelectItem key={tenant.id} value={tenant.id}>
          {tenant.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```

## User Flow After Implementation

1. **Super Admin logs in** → Sees all tenants in dropdown → Selects a tenant → Views/manages users for that tenant
2. **Tenant Admin logs in** → Sees only their tenant's users (no dropdown)
3. **Creating a role** → Role is created for the selected/current tenant
4. **Inviting a user** → Invitation is created for the selected/current tenant
5. **Assigning roles to user** → Can select from tenant's available roles

## Technical Considerations

- **RLS Policies**: Already configured to allow super_admins to see all data and tenant_admins to see their own
- **Profile tenant_id**: Super admins may have null tenant_id, which is acceptable - they can select any tenant
- **Permissions**: Roles have proper permissions assigned via the trigger/migration
- **RTL Support**: All UI components already use logical properties (me-, ms-, gap-)
