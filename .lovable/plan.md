
# Fix Missing Translation Keys in User Management Module

## Problem Summary

The User Management page displays raw translation keys instead of translated text in Arabic mode:

| Location | Current Display | Should Display (Arabic) |
|----------|-----------------|------------------------|
| Users Table Header | `users.roles` | الأدوار |
| Users Table Header | `users.user` (not showing but missing) | المستخدم |
| Roles Table Header | `roles.createdAt` | تاريخ الإنشاء |
| System Role Badges | `super_admin`, `tenant_admin`, `manager`, `user` | مدير أعلى، مدير المستأجر، مشرف، مستخدم |

## RTL Layout Verification

The RTL layout appears correct:
- Sidebar is on the right side
- Tables flow right-to-left
- Buttons and icons are properly positioned
- Logical properties (`me-`, `ms-`, `gap-`) are being used correctly

## Solution

### 1. Add Missing Keys to Both Locale Files

**English (`src/locales/en.json`)** - Add to `users` section:
```json
"user": "User",
"roles": "Roles"
```

**English (`src/locales/en.json`)** - Add to `roles` section:
```json
"createdAt": "Created At"
```

**Arabic (`src/locales/ar.json`)** - Add to `users` section:
```json
"user": "المستخدم",
"roles": "الأدوار"
```

**Arabic (`src/locales/ar.json`)** - Add to `roles` section:
```json
"createdAt": "تاريخ الإنشاء"
```

### 2. Translate System Role Badges in UserTable.tsx

The system role badges (from `user_roles.role` field) currently display raw values like `super_admin`. 

Create a helper function to translate these values:

```typescript
const getSystemRoleLabel = (role: string) => {
  const roleLabels: Record<string, string> = {
    'super_admin': t('users.superAdmin'),
    'tenant_admin': t('roles.baseRoles.tenantAdmin'),
    'manager': t('users.manager'),
    'user': t('users.user'),
  };
  return roleLabels[role] || role;
};
```

Then update the badge rendering:
```tsx
{user.user_roles?.map(ur => (
  <Badge key={ur.id} variant="secondary" className="me-1">
    {getSystemRoleLabel(ur.role)}
  </Badge>
))}
```

### 3. Translate Base Role Badges in RoleTable.tsx

Similarly, update RoleTable.tsx to translate the `base_role` values:

```typescript
const getBaseRoleLabel = (baseRole: string) => {
  const roleLabels: Record<string, string> = {
    'user': t('roles.baseRoles.user'),
    'manager': t('roles.baseRoles.manager'),
    'tenant_admin': t('roles.baseRoles.tenantAdmin'),
    'super_admin': t('roles.baseRoles.superAdmin'),
  };
  return roleLabels[baseRole] || baseRole;
};
```

Then update the badge rendering:
```tsx
<Badge variant="outline">{getBaseRoleLabel(role.base_role)}</Badge>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/locales/en.json` | Add `users.user`, `users.roles`, `roles.createdAt` |
| `src/locales/ar.json` | Add `users.user`, `users.roles`, `roles.createdAt` |
| `src/components/users/UserTable.tsx` | Add system role translation helper |
| `src/components/roles/RoleTable.tsx` | Add base role translation helper |

## Expected Result After Fix

| Location | Arabic Display |
|----------|----------------|
| Users Table - User Column Header | المستخدم |
| Users Table - Roles Column Header | الأدوار |
| Users Table - System Role Badge | مدير أعلى |
| Roles Table - Created At Header | تاريخ الإنشاء |
| Roles Table - Base Role Badges | مستخدم، مشرف، مدير المستأجر |

## Technical Notes

- The existing `roles.baseRoles` translation keys already exist in both locale files
- The existing `users.superAdmin`, `users.manager`, `users.user` keys already exist
- RTL layout is already correct - no CSS changes needed
- All components properly use `me-`, `ms-`, `gap-` logical properties
