

# Fix Role Assignment for Tenant Admins

## The Problem
The `user_roles` table only has two RLS policies:
1. **Super admins can manage all roles** (ALL) -- works
2. **Users can view their own roles** (SELECT only)

Tenant admins are completely blocked from assigning, editing, or removing roles for users in their tenant. Only super admins can do this.

## The Difference: Role vs System Role
- **Role** (shown in "Roles" column): Custom, tenant-specific roles like "Administrator", "Manager", "Viewer". These are defined in the Roles & Permissions tab and carry granular permissions (e.g., `users.view`, `reports.edit`). They map to the `custom_role_id` field.
- **System Role** (shown in "System Role" column): The base access level (`Super Admin`, `Tenant Admin`, `Manager`, `User`). This is the `role` field on `user_roles` and controls fundamental platform-level access via RLS policies.

## Solution

### 1. Database Migration -- Add RLS policies for tenant admins on `user_roles`

Add policies so tenant admins can manage role assignments for users within their own tenant:

```sql
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
```

Key security constraints:
- Tenant admins can only manage users within their own tenant
- Tenant admins cannot assign or remove the `super_admin` system role (prevents privilege escalation)

### 2. No Code Changes Needed
The UI components (`UserRoleDialog`, `UserTable`) and hooks (`useUserRoles`) already have the correct logic for assigning/removing roles. The only blocker is the missing RLS policies on the `user_roles` table.

## Files Summary

| File | Action |
|---|---|
| Migration SQL | Add 4 RLS policies for tenant admin access to `user_roles` |

No frontend code changes required -- the existing UI will work once the database allows tenant admins to write to `user_roles`.

