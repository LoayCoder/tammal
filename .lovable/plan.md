

# Unified User Management Module

## Overview

Merge the separate Employee Management (`/admin/employees`) and User Management (`/admin/users`) into a single, consolidated module at `/admin/user-management`. The `employees` table becomes the **primary Person entity**; the `profiles` table remains the **Access layer** linked via `user_id`.

---

## Architecture

The unified page uses a **4-tab layout**:

| Tab | Content |
|-----|---------|
| **Directory** | Full people table (from `employees`), with account link status, filters, add/edit/import/export, invitation actions |
| **Access & Auth** | Users with login accounts (from `profiles_with_email`), status management, password resets |
| **Roles & Permissions** | Existing role management + permission matrix (unchanged logic) |
| **Invitations** | Existing invitation management view (from `useTenantInvitations`) |

---

## Step 1: Create Unified Page

Create `src/pages/admin/UnifiedUserManagement.tsx`

### Directory Tab (Person Records)
- Reuses existing `EmployeeTable`, `EmployeeSheet`, `EmployeeImport`, `EmployeeInviteDialog` components
- Enhanced table columns: Name, Email, Department, Job Title, Employment Status, **Account Link Status** (badge), Role (if linked), Last Login
- Account Link Status badge values:
  - "Not Invited" -- no `user_id`, no pending invitation
  - "Invitation Sent" -- no `user_id`, but pending invitation exists
  - "Active User" -- has `user_id`, profile status = active
  - "Suspended" -- has `user_id`, profile status = suspended
- Filters: search, department, employment status, account link status

### Access & Auth Tab
- Shows only people who have a linked login account (`employees` JOIN `profiles_with_email` via `user_id`)
- Reuses `UserEditDialog` for editing profile/access fields
- Reuses `UserStatusDialog` for suspend/deactivate/reactivate
- Shows: Name, Email, Login Status, Roles, MFA Status, Last Login
- Actions: Edit profile, manage roles, password reset, suspend/reactivate

### Roles Tab
- Existing `RoleTable`, `RoleDialog`, `PermissionMatrix` -- no changes needed, move from current UserManagement

### Invitations Tab
- Shows pending/used invitations from `InvitationManagement` component
- Existing functionality, relocated

---

## Step 2: Enhance Employee Table with Account Status

Modify `src/components/employees/EmployeeTable.tsx`:
- Replace the simple checkmark/X icon with a descriptive status badge
- Add new props: `invitations` (to check pending invites) and `profiles` (to check login status)
- New column: "Account Status" with colored badges
- New column: "Role" showing assigned role name if account is linked

---

## Step 3: Create Account Status Badge Component

Create `src/components/employees/AccountStatusBadge.tsx`:
- Renders badge based on account link state
- Variants: `not_invited` (outline), `invited` (secondary/yellow), `active` (default/green), `suspended` (destructive/red), `inactive` (secondary/gray)

---

## Step 4: Update Sidebar Navigation

Edit `src/components/layout/AppSidebar.tsx`:
- Remove the separate "Employees" link from Survey System group
- Replace "User Management" in Operations group with the new unified link
- New item: `{ title: "User Management", url: "/admin/user-management", icon: Users }`

---

## Step 5: Update Routes

Edit `src/App.tsx`:
- Add route: `/admin/user-management` pointing to `UnifiedUserManagement`
- Keep `/admin/users` as a redirect to `/admin/user-management` for backward compatibility
- Keep `/admin/employees` as a redirect to `/admin/user-management` for backward compatibility

---

## Step 6: Auto-Sync Behavioral Logic

Add logic in the unified hook layer:
- When an employee's employment status changes to **"terminated"**: if they have a linked `user_id`, automatically set the profile status to "suspended"
- When employment status changes to **"resigned"**: show a confirmation asking if the account should be suspended
- This logic lives in the `updateEmployee` mutation's `onSuccess` callback

---

## Step 7: Fetch Account Status Data

Create/update a custom hook `src/hooks/useUnifiedUsers.ts`:
- Fetches employees with their linked profile status by joining employees -> profiles (via `user_id`)
- Fetches pending invitations for employees without accounts
- Returns enriched employee list with `accountStatus` computed field
- Reuses existing `useEmployees` base query, enhanced with profile data

---

## Step 8: Localization Updates

Add keys to `en.json` and `ar.json`:

| Key | EN | AR |
|-----|----|----|
| `userManagement.title` | User Management | ادارة المستخدمين |
| `userManagement.subtitle` | Manage your organization's people, access, and roles | ادارة الأشخاص والوصول والأدوار في مؤسستك |
| `userManagement.directoryTab` | Directory | الدليل |
| `userManagement.accessTab` | Access & Auth | الوصول والمصادقة |
| `userManagement.rolesTab` | Roles & Permissions | الأدوار والصلاحيات |
| `userManagement.invitationsTab` | Invitations | الدعوات |
| `userManagement.accountStatus` | Account Status | حالة الحساب |
| `userManagement.notInvited` | Not Invited | غير مدعو |
| `userManagement.invitationSent` | Invitation Sent | تم إرسال الدعوة |
| `userManagement.activeUser` | Active User | مستخدم نشط |
| `userManagement.suspendedUser` | Suspended | معلق |
| `userManagement.inactiveUser` | Inactive | غير نشط |
| `userManagement.filterByAccountStatus` | Account Status | حالة الحساب |
| `userManagement.autoSuspendConfirm` | This employee has a login account. Suspend their access? | هذا الموظف لديه حساب دخول. هل تريد تعليق وصوله؟ |

---

## Step 9: Tenant Selector (Super Admin)

The unified page inherits the tenant selector pattern from the current UserManagement:
- Super admins see a tenant dropdown at the top
- Regular tenant admins see only their own tenant's data
- The selected tenant flows into all data queries

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/pages/admin/UnifiedUserManagement.tsx` | New unified page with 4 tabs |
| Create | `src/hooks/useUnifiedUsers.ts` | Enriched employee + profile + invitation data |
| Create | `src/components/employees/AccountStatusBadge.tsx` | Visual badge component |
| Edit | `src/components/employees/EmployeeTable.tsx` | Add account status column and role column |
| Edit | `src/components/layout/AppSidebar.tsx` | Consolidate navigation links |
| Edit | `src/App.tsx` | Add new route + redirects |
| Edit | `src/locales/en.json` | Add unified management keys |
| Edit | `src/locales/ar.json` | Add unified management Arabic keys |

No database migrations needed -- both `employees` and `profiles` tables already have the necessary columns and relationships.

