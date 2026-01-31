
# Fix: RLS Policy Blocks Tenant Creation for Non-Super-Admin Users

## Problem Summary
When creating a tenant, the API returns error `42501`:
```
new row violates row-level security policy for table "tenants"
```

## Root Cause
The RLS policy on the `tenants` table requires the user to have the `super_admin` role:

| Policy Name | Command | Rule |
|-------------|---------|------|
| Super admins can manage tenants | ALL | `has_role(auth.uid(), 'super_admin')` |

The currently logged-in user (`test@example.com`, ID: `5cfed714-...`) does NOT have the `super_admin` role in the `user_roles` table. Only user `276100d6-...` has this role.

## Solution Options

### Option A: Assign super_admin Role to Test User (Recommended for Testing)
Add the test user to the `user_roles` table with `super_admin` role so they can manage tenants.

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('5cfed714-2dc9-4d02-bc96-7569b70bd811', 'super_admin');
```

This is the correct approach because:
- The RLS policy is working as intended (security is enforced)
- Only designated super admins should be able to create/manage tenants
- The test user needs the proper role to perform admin actions

### Option B: Modify RLS Policy (Not Recommended)
Loosening the RLS policy would be a security risk since tenant management is a privileged operation.

## Why This is a Permissions Issue, Not a Code Bug
- The code correctly submits data to Supabase
- The database correctly enforces RLS policies
- The user simply lacks the required role

## What Will Happen After Fix
Once the test user has the `super_admin` role:
- User can create, update, and delete tenants
- User can view all tenants (not just their own)
- All other RLS-protected admin operations will also work

## Recommendation
Apply the SQL migration to grant the `super_admin` role to the test user. This is a data fix, not a code fix - the application is working correctly.
