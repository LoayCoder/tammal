

# Fix Role Assignment & Manager Select Filtering

## Issues Found

### Issue 1: System Role Not Updated When Assigning Custom Roles
When you assign a custom role (e.g., "Viewer") via the Manage Roles dialog, the code always sets `role: 'user'` regardless of the custom role's `base_role` property. So even if the custom role has `base_role: 'tenant_admin'`, the system role stays as "User".

**Root cause**: In `UserRoleDialog.tsx` line 83, the `assignRole` call hardcodes `role: 'user'` instead of using the selected role's `base_role`.

### Issue 2: Manager Select Shows All Employees
The `ManagerSelect` component shows all active employees as potential managers, regardless of whether they actually have the "manager" system role. LUAY appears in the manager dropdown even though he has no manager role assigned.

**Root cause**: `ManagerSelect.tsx` only filters by `status === 'active'` and does not check for manager role assignment.

---

## Solution

### 1. Fix UserRoleDialog -- Use the custom role's `base_role` as the system role

When assigning a custom role, look up that role's `base_role` property and pass it as the system role instead of hardcoding `'user'`.

**File**: `src/components/users/UserRoleDialog.tsx`

- When adding a new role assignment, find the role object from the `roles` list using the roleId
- Pass `role.base_role` (e.g., `'tenant_admin'`, `'manager'`, `'user'`) to `assignRole` instead of hardcoding `'user'`
- When multiple custom roles are selected, use the highest-privilege `base_role` for the system role

### 2. Fix ManagerSelect -- Filter by manager system role

Update `ManagerSelect` to only show employees who have a `manager` (or higher) system role assigned.

**File**: `src/components/employees/ManagerSelect.tsx`

- Accept an optional list of user IDs who have the manager role
- Filter the dropdown to only show those employees

**File**: `src/components/employees/EmployeeSheet.tsx`

- Query `user_roles` table to get user IDs with `role = 'manager'` or `role = 'tenant_admin'` or `role = 'super_admin'`
- Pass the valid manager employee list to `ManagerSelect`

---

## Technical Details

### UserRoleDialog change (system role fix):
```typescript
// Before (line 79-83):
await assignRole.mutateAsync({ 
  userId: user.user_id, 
  customRoleId: roleId,
  role: 'user'  // Always 'user' -- wrong!
});

// After:
const roleObj = roles.find(r => r.id === roleId);
await assignRole.mutateAsync({ 
  userId: user.user_id, 
  customRoleId: roleId,
  role: roleObj?.base_role || 'user'  // Use the role's base_role
});
```

### ManagerSelect change (filter by role):
```typescript
// Add a hook or prop to fetch employees with manager+ roles
// Filter: only show employees whose user_id has a user_role 
// with role IN ('manager', 'tenant_admin', 'super_admin')
```

### Files to modify:
| File | Change |
|---|---|
| `src/components/users/UserRoleDialog.tsx` | Use `role.base_role` instead of hardcoded `'user'` |
| `src/components/employees/ManagerSelect.tsx` | Add filtering by manager role |
| `src/components/employees/EmployeeSheet.tsx` | Pass manager-eligible employees to ManagerSelect |

No database changes needed.
