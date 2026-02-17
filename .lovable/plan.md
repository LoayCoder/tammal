

# Assign test@example.com to TAMMAL Tenant

## What Needs to Happen
The user `test@example.com` (user_id: `5cfed714-2dc9-4d02-bc96-7569b70bd811`) needs their `profiles.tenant_id` set to the TAMMAL tenant (`4fc9029e-2485-46a5-a540-ec2de643c3e3`).

This is a **data update**, not a code change. The database trigger `auto_create_employee_on_profile_link` will automatically create an employee record when `tenant_id` goes from NULL to a value.

## Implementation
Run a single SQL UPDATE via a database migration:

```sql
UPDATE public.profiles 
SET tenant_id = '4fc9029e-2485-46a5-a540-ec2de643c3e3',
    full_name = COALESCE(full_name, 'Test User')
WHERE user_id = '5cfed714-2dc9-4d02-bc96-7569b70bd811'
  AND tenant_id IS NULL;
```

## What Happens Automatically
1. The `auto_create_employee_on_profile_link` trigger fires
2. An employee record is created in the `employees` table for this user under the TAMMAL tenant
3. The user will now appear in the **User Management** directory when viewing the TAMMAL tenant
4. The user can log in and see the Employee Homepage

## Files
| File | Action |
|---|---|
| Migration SQL | UPDATE profile to set tenant_id |

No code changes needed -- this is purely a data operation.
