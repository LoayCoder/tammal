
# Enable Login Accounts for Employees

## Overview

This feature will allow administrators to send login invitations to employees directly from the Employee Management page. When an employee accepts the invitation and creates their account, the system will automatically link their new user account to their employee record.

## Current System Architecture

```
+------------------+       +------------------+       +------------------+
|    employees     |       |   invitations    |       |   auth.users     |
+------------------+       +------------------+       +------------------+
| id               |       | id               |       | id               |
| user_id (null)   |<----->| code             |<----->| email            |
| email            |       | email            |       | ...              |
| full_name        |       | employee_id (new)|       +------------------+
| tenant_id        |       | tenant_id        |              |
| ...              |       | ...              |              v
+------------------+       +------------------+       +------------------+
                                                      |    profiles      |
                                                      +------------------+
                                                      | user_id          |
                                                      | tenant_id        |
                                                      +------------------+
```

## Implementation Plan

### Part 1: Database Changes

Add `employee_id` column to `invitations` table to track which employee record to link:

| Column | Type | Purpose |
|--------|------|---------|
| `employee_id` | uuid (nullable) | Links invitation to an employee record for auto-linking on signup |

### Part 2: Create "Send Invite" Action in Employee Table

Add a new action button in the EmployeeTable dropdown menu:

- **Icon**: Mail or UserPlus
- **Label**: "Send Login Invite" / "ارسال دعوة تسجيل"
- **Condition**: Only show if employee has no `user_id` (no account yet)
- **Action**: Opens dialog to send invitation email

### Part 3: Create EmployeeInviteDialog Component

A simplified dialog for inviting employees:

```
+------------------------------------------+
| Send Login Invitation              [X]   |
+------------------------------------------+
| Employee: John Doe                       |
| Email: john@company.com                  |
|                                          |
| Invitation expires in:                   |
| [7 days ▼]                               |
|                                          |
| [Cancel]              [Send Invitation]  |
+------------------------------------------+
```

Features:
- Pre-fills email and name from employee record
- Only needs expiry selection
- Passes `employee_id` to invitation for linking

### Part 4: Create Accept Invitation Page

New route: `/auth/accept-invite`

This page handles the signup flow for invited users:

1. **Code Verification Step**
   - User enters 8-character code (or arrives via link with code in URL)
   - Validates code against database
   - Shows error if expired, used, or invalid

2. **Signup Form**
   - Email (pre-filled from invitation, read-only)
   - Full name (pre-filled if available)
   - Password + Confirm password

3. **On Successful Signup**
   - Create user account
   - Create profile linked to tenant
   - If `employee_id` exists: Update `employees.user_id` to new user
   - Mark invitation as used
   - Assign pre-selected roles (if any)

### Part 5: Update Invitation Hook

Modify `useTenantInvitations` to:
- Accept optional `employee_id` parameter
- Store employee_id in invitation record

### Part 6: Employee Table Visual Indicator

Show account status in the Employee table:

| Visual | Meaning |
|--------|---------|
| Green checkmark icon | Has login account (`user_id` exists) |
| Gray user icon | No login account yet |

Add tooltip: "Has system access" / "No system access"

---

## User Flow Diagram

```
Admin Flow:
+-----------------------+    +----------------------+    +-------------------+
| Employee Management   | -> | Click "Send Invite"  | -> | Dialog Opens      |
| View employee row     |    | from dropdown menu   |    | Confirm & Send    |
+-----------------------+    +----------------------+    +-------------------+
                                                                   |
                                                                   v
                                                         Email sent to employee

Employee Flow:
+-------------------+    +---------------------+    +-------------------+
| Receives Email    | -> | Clicks link or      | -> | Enters code &     |
| with invite code  |    | enters code manually|    | creates password  |
+-------------------+    +---------------------+    +-------------------+
                                                             |
                                                             v
                                                   Account created + linked
                                                   to employee record
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add `employee_id` column to `invitations` table |
| `src/pages/auth/AcceptInvite.tsx` | Create | New page for accepting invitations |
| `src/App.tsx` | Modify | Add `/auth/accept-invite` route |
| `src/components/employees/EmployeeInviteDialog.tsx` | Create | Dialog for sending employee invitations |
| `src/components/employees/EmployeeTable.tsx` | Modify | Add invite action and account status indicator |
| `src/pages/admin/EmployeeManagement.tsx` | Modify | Add dialog state and handlers |
| `src/hooks/useTenantInvitations.ts` | Modify | Support `employee_id` in invitation creation |
| `src/hooks/useEmployees.ts` | Modify | Add mutation to link user_id |
| `src/locales/en.json` | Modify | Add new translation keys |
| `src/locales/ar.json` | Modify | Add Arabic translations |

---

## Technical Details

### Accept Invite Page Flow

```typescript
// On form submit:
1. signUp(email, password)
2. Create profile with tenant_id from invitation
3. If invitation.employee_id:
   - UPDATE employees SET user_id = new_user_id WHERE id = employee_id
4. Mark invitation as used
5. Assign roles from invitation metadata
6. Redirect to login or dashboard
```

### Security Considerations

1. **Code Validation**: Only valid, unused, non-expired codes work
2. **Tenant Linking**: Profile automatically linked to correct tenant
3. **Employee Linking**: Employee record securely linked via server-side check
4. **One-Time Use**: Invitation marked as used immediately after signup

---

## Translation Keys to Add

**English:**
```json
{
  "employees": {
    "sendInvite": "Send Login Invite",
    "hasAccount": "Has system account",
    "noAccount": "No system account",
    "inviteSuccess": "Invitation sent successfully",
    "alreadyHasAccount": "This employee already has a login account"
  },
  "acceptInvite": {
    "title": "Accept Invitation",
    "enterCode": "Enter your invitation code",
    "codePlaceholder": "XXXXXXXX",
    "verifyCode": "Verify Code",
    "createAccount": "Create Your Account",
    "invalidCode": "Invalid or expired invitation code",
    "codeUsed": "This invitation code has already been used",
    "accountCreated": "Account created successfully! Please log in."
  }
}
```

**Arabic:**
```json
{
  "employees": {
    "sendInvite": "إرسال دعوة تسجيل",
    "hasAccount": "لديه حساب في النظام",
    "noAccount": "لا يوجد حساب",
    "inviteSuccess": "تم إرسال الدعوة بنجاح",
    "alreadyHasAccount": "هذا الموظف لديه حساب تسجيل دخول بالفعل"
  },
  "acceptInvite": {
    "title": "قبول الدعوة",
    "enterCode": "أدخل رمز الدعوة الخاص بك",
    "codePlaceholder": "XXXXXXXX",
    "verifyCode": "تحقق من الرمز",
    "createAccount": "إنشاء حسابك",
    "invalidCode": "رمز الدعوة غير صالح أو منتهي الصلاحية",
    "codeUsed": "تم استخدام رمز الدعوة هذا بالفعل",
    "accountCreated": "تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول."
  }
}
```
