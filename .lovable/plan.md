

# Auto-Create Employee Record on Signup / Invitation Accept

## Problem

Users who sign up directly (not via invitation with a pre-existing employee record) only get a `profiles` entry but no `employees` record. Since the Unified Directory is built on the `employees` table, these users are invisible in the Directory.

## Solution

Add auto-creation logic at two points and a one-time backfill for existing orphaned profiles like Luay.

---

## Step 1: Auto-Create Employee on Invitation Accept (without employee_id)

In `src/pages/auth/AcceptInvite.tsx`, the current code only links an existing employee record if `invitation.employee_id` exists. If the invitation was created without linking to an employee, no employee record is created.

**Change**: After step 2 (profile update), if `invitation.employee_id` is null, insert a new employee record:

```
INSERT INTO employees (tenant_id, user_id, full_name, email, status)
```

Then update the invitation's `employee_id` to the newly created record.

## Step 2: Auto-Create Employee on Direct Signup

In `src/pages/Auth.tsx`, after a successful `signUp`, the `handle_new_user` trigger creates a profile but no employee. Since direct signups may not have a `tenant_id` yet, we handle this differently:

**Change**: Create a database trigger function `handle_profile_tenant_update` that fires when a profile's `tenant_id` is set (UPDATE on profiles WHERE tenant_id changes from NULL to a value). This trigger auto-creates an employee record if one doesn't already exist for that user.

This is cleaner than frontend logic because it covers all cases (invitation accept, admin assignment, etc.).

## Step 3: Backfill Existing Orphaned Profiles

Run a one-time data operation to create employee records for profiles that have a `tenant_id` but no matching employee record (like Luay).

Query:
```sql
INSERT INTO employees (tenant_id, user_id, full_name, email, status)
SELECT p.tenant_id, p.user_id, p.full_name, 
       get_user_email(p.user_id), 'active'
FROM profiles p
WHERE p.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.user_id = p.user_id
  );
```

## Step 4: Localization

Add i18n keys for any toast messages related to auto-creation.

| Key | EN | AR |
|-----|----|----|
| `employees.autoCreated` | Employee record created automatically | تم إنشاء سجل الموظف تلقائياً |

---

## Technical Details

### Database Migration: Auto-Sync Trigger

Create a trigger on the `profiles` table:

```sql
CREATE OR REPLACE FUNCTION public.auto_create_employee_on_profile_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when tenant_id is set (from NULL to a value)
  IF OLD.tenant_id IS NULL AND NEW.tenant_id IS NOT NULL THEN
    -- Check if employee record already exists
    IF NOT EXISTS (SELECT 1 FROM employees WHERE user_id = NEW.user_id) THEN
      INSERT INTO employees (tenant_id, user_id, full_name, email, status)
      VALUES (
        NEW.tenant_id,
        NEW.user_id,
        COALESCE(NEW.full_name, 'New User'),
        get_user_email(NEW.user_id),
        'active'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_tenant_linked
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.tenant_id IS DISTINCT FROM NEW.tenant_id)
  EXECUTE FUNCTION auto_create_employee_on_profile_link();
```

### Frontend Change: AcceptInvite.tsx

In the `handleSignup` function, after step 2 (profile update), add a conditional block:

```typescript
// 3. Create employee record if no employee_id on invitation
if (!invitation.employee_id) {
  const { data: newEmp } = await supabase
    .from("employees")
    .insert({
      tenant_id: invitation.tenant_id,
      user_id: userId,
      full_name: fullName,
      email: invitation.email,
      status: "active",
    })
    .select("id")
    .single();
  
  // Update invitation with the new employee_id
  if (newEmp) {
    await supabase
      .from("invitations")
      .update({ employee_id: newEmp.id })
      .eq("id", invitation.id);
  }
}
```

### Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/pages/auth/AcceptInvite.tsx` | Auto-create employee when invitation has no employee_id |
| Edit | `src/locales/en.json` | Add auto-creation i18n key |
| Edit | `src/locales/ar.json` | Add auto-creation Arabic key |
| Migration | Database trigger | Auto-create employee when profile gets tenant_id |
| Data operation | Backfill query | Create employee records for existing orphaned profiles (Luay) |

