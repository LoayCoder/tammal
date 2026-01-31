

# Fix: Click on User Opens Wrong Dialog

## Problem

When clicking on a user row in the table, the **Role Assignment** dialog opens instead of the **User Edit/Details** dialog.

## Root Cause

In `UserManagement.tsx`, the `handleViewUserDetails` function incorrectly calls `handleEditUserRoles`:

```typescript
// Current (WRONG)
const handleViewUserDetails = (user: UserWithRoles) => {
  handleEditUserRoles(user);  // Opens Role Assignment dialog
};
```

## Solution

Change `handleViewUserDetails` to open the User Edit dialog instead:

```typescript
// Fixed (CORRECT)
const handleViewUserDetails = (user: UserWithRoles) => {
  setSelectedUser(user);
  setIsEditDialogOpen(true);  // Opens User Edit dialog
};
```

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/UserManagement.tsx` | Fix `handleViewUserDetails` to open edit dialog instead of role dialog |

## Expected Behavior After Fix

| Action | Dialog Opened |
|--------|---------------|
| **Click on user row** | User Edit Dialog (profile photo, name, org info, password reset) |
| **Click "Manage Roles" in dropdown** | Role Assignment Dialog |
| **Click "Edit User" in dropdown** | User Edit Dialog |

