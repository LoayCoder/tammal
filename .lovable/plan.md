
# Fix User Management Display and Add Full User Actions

## Problem Summary

Based on my investigation, there are two main issues:

| Issue | Current Behavior | Expected Behavior |
|-------|------------------|-------------------|
| **UUID showing as subtitle** | User `276100d6-b28d-491b-9c6e-e54cb3cd306d` shows UUID instead of email | Should show user's email (`luay@dhuud.com`) |
| **Missing user actions** | Only "View Details" and "Manage Roles" in dropdown | Need Edit, Deactivate, Suspend, Delete actions |

### Root Cause Analysis

1. **UUID Display Issue**:
   - The profile for user `276100d6-b28d-491b-9c6e-e54cb3cd306d` has `full_name: null`
   - The `UserTable.tsx` displays `user.user_id` (the UUID) as the subtitle
   - The email is stored in `auth.users` table, not accessible directly from client

2. **Missing Actions**:
   - The profiles table has no `status` field for deactivation/suspension
   - The UserTable dropdown only has 2 menu items (View Details, Manage Roles)
   - No mutations exist in useUsers hook for update/delete operations

---

## Solution Overview

### Step 1: Database Changes

**A. Add status field to profiles table**
```sql
-- Add status column for user account states
ALTER TABLE public.profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'suspended'));
```

**B. Create a database function to fetch user emails**
Since we cannot query `auth.users` directly from the client, we need a security-definer function:

```sql
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id
$$;
```

**C. Create a view that includes email**
```sql
CREATE VIEW public.profiles_with_email
WITH (security_invoker=on) AS
SELECT 
  p.*,
  public.get_user_email(p.user_id) as email
FROM public.profiles p;
```

### Step 2: Update useUsers Hook

Modify the hook to:
1. Query the new view instead of profiles table directly
2. Add mutations for update and delete operations
3. Add status filtering support

```typescript
// Fetch from profiles_with_email view
const { data: profiles, error } = await supabase
  .from('profiles_with_email')
  .select('*')
  .eq('tenant_id', filters.tenantId)
  .order('created_at', { ascending: false });

// Add new mutations
const updateProfile = useMutation({
  mutationFn: async ({ id, ...updates }) => {
    // Update profile status, name, etc.
  },
});

const deleteUser = useMutation({
  mutationFn: async (userId: string) => {
    // Soft delete or deactivate
  },
});
```

### Step 3: Update UserTable.tsx

**A. Display email instead of UUID**
```tsx
<div>
  <div className="font-medium">{user.full_name || t('users.unnamed')}</div>
  <div className="text-sm text-muted-foreground">{user.email || user.user_id}</div>
</div>
```

**B. Add action menu items**
```tsx
<DropdownMenuContent align="end">
  <DropdownMenuItem onClick={() => onViewDetails(user)}>
    <UserCog className="me-2 h-4 w-4" />
    {t('users.viewDetails')}
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => onEditRoles(user)}>
    <Shield className="me-2 h-4 w-4" />
    {t('users.manageRoles')}
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => onEdit(user)}>
    <Pencil className="me-2 h-4 w-4" />
    {t('users.editUser')}
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => onDeactivate(user)}>
    <UserX className="me-2 h-4 w-4" />
    {t('users.deactivateUser')}
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => onSuspend(user)}>
    <Ban className="me-2 h-4 w-4" />
    {t('users.suspendUser')}
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive">
    <Trash2 className="me-2 h-4 w-4" />
    {t('users.deleteUser')}
  </DropdownMenuItem>
</DropdownMenuContent>
```

### Step 4: Create User Edit Dialog

Create a new `UserEditDialog.tsx` component to:
- Edit user profile (full_name)
- Change user status (active/inactive/suspended)
- View user details

### Step 5: Create Confirmation Dialogs

- **Deactivation Dialog**: Confirm before deactivating a user
- **Suspension Dialog**: Confirm before suspending a user  
- **Delete Dialog**: Confirm before soft-deleting a user

### Step 6: Update Translation Files

Add new translation keys:

**English (en.json)**
```json
"editUser": "Edit User",
"deleteUser": "Delete User",
"deactivateUser": "Deactivate User",
"suspendUser": "Suspend User",
"reactivateUser": "Reactivate User",
"userStatus": "Status",
"statusActive": "Active",
"statusInactive": "Inactive", 
"statusSuspended": "Suspended",
"confirmDeactivate": "Are you sure you want to deactivate this user?",
"confirmSuspend": "Are you sure you want to suspend this user?",
"confirmDelete": "Are you sure you want to delete this user?",
"updateSuccess": "User updated successfully",
"updateError": "Failed to update user",
"deleteSuccess": "User deleted successfully",
"deleteError": "Failed to delete user"
```

**Arabic (ar.json)**
```json
"editUser": "تعديل المستخدم",
"deleteUser": "حذف المستخدم",
"deactivateUser": "تعطيل المستخدم",
"suspendUser": "تعليق المستخدم",
"reactivateUser": "إعادة تفعيل المستخدم",
"userStatus": "الحالة",
"statusActive": "نشط",
"statusInactive": "غير نشط",
"statusSuspended": "معلّق",
"confirmDeactivate": "هل أنت متأكد من تعطيل هذا المستخدم؟",
"confirmSuspend": "هل أنت متأكد من تعليق هذا المستخدم؟",
"confirmDelete": "هل أنت متأكد من حذف هذا المستخدم؟",
"updateSuccess": "تم تحديث المستخدم بنجاح",
"updateError": "فشل تحديث المستخدم",
"deleteSuccess": "تم حذف المستخدم بنجاح",
"deleteError": "فشل حذف المستخدم"
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add status field, create email function and view |
| `src/hooks/useUsers.ts` | Modify | Use new view, add update/delete mutations |
| `src/components/users/UserTable.tsx` | Modify | Show email, add action buttons |
| `src/components/users/UserEditDialog.tsx` | Create | Dialog for editing user profile |
| `src/components/users/UserStatusDialog.tsx` | Create | Confirmation dialog for status changes |
| `src/pages/admin/UserManagement.tsx` | Modify | Wire up new dialogs and handlers |
| `src/locales/en.json` | Modify | Add new translation keys |
| `src/locales/ar.json` | Modify | Add Arabic translations |

---

## User Flow After Implementation

1. **View Users**: See list with proper names and emails (not UUIDs)
2. **Edit User**: Click menu → Edit → Change name, save
3. **Deactivate User**: Click menu → Deactivate → Confirm → User marked inactive
4. **Suspend User**: Click menu → Suspend → Confirm → User marked suspended
5. **Delete User**: Click menu → Delete → Confirm → User soft-deleted
6. **Reactivate User**: For inactive/suspended users, show reactivate option

---

## Technical Considerations

- **Security**: Email function uses SECURITY DEFINER to safely expose auth.users email
- **Soft Delete**: Never hard delete - use status changes or deleted_at timestamp
- **RLS**: Existing policies will work with the new view (security_invoker=on)
- **RTL Support**: All new components will use logical properties (me-, ms-)
