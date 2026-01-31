

# Enhanced User Edit Dialog with Full Profile Management

## Problem Summary

The current `UserEditDialog` only allows editing:
- Full Name
- Status (active/inactive/suspended)

Missing features requested:
1. **Reset Password** - Admin ability to trigger password reset for users
2. **Upload Profile Photo** - Admin ability to change user avatar
3. **Extended User Information** - Fields for position, department, location, etc.

## Current Architecture Analysis

| Component | Current State | Gap |
|-----------|--------------|-----|
| `profiles` table | Has: `id`, `user_id`, `tenant_id`, `full_name`, `avatar_url`, `status` | Missing: `job_title`, `department`, `location`, `phone` |
| `employees` table | Has organizational fields: `department`, `role_title`, `employee_number`, `manager_id` | Separate from profiles - HR data |
| `UserEditDialog.tsx` | Only edits `full_name` and `status` | No avatar upload, no extended fields |
| Password Reset | Only self-service via `ChangePasswordDialog` | No admin-triggered reset via email |

## Solution Overview

### Approach: Extend Profiles Table
Rather than duplicating employee data, we'll add organizational context fields directly to the `profiles` table since this is for system users (login accounts), not just HR records.

### Step 1: Database Migration - Extend Profiles Table

Add new columns to store organizational information:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;
```

### Step 2: Create Admin Password Reset Edge Function

Since admins cannot directly change other users' passwords, we need an edge function that uses the Supabase Admin API to send a password reset email:

```typescript
// supabase/functions/admin-reset-password/index.ts
- Accepts user_id parameter
- Verifies caller is super_admin or tenant_admin
- Uses Supabase Admin API to send password reset email
- Returns success/failure
```

### Step 3: Update useUsers Hook

Add new mutation functions:
- `updateProfile` - Extended to support new fields (job_title, department, phone, location)
- `sendPasswordReset` - Calls the edge function to trigger password reset email

### Step 4: Rebuild UserEditDialog.tsx

Transform into a comprehensive user management dialog with:

**Section 1: Avatar Management**
- Display current avatar with fallback initials
- Upload new avatar button (reuse existing pattern from EditProfileDialog)
- Remove avatar button

**Section 2: Basic Information**
- Full Name (existing)
- Email (read-only, display only)
- Phone Number (new)

**Section 3: Organizational Info**
- Job Title / Position (new)
- Department (new)
- Location (new)

**Section 4: Account Status**
- Status select (existing: active/inactive/suspended)

**Section 5: Security Actions**
- "Send Password Reset Email" button
- Confirmation before sending

### Step 5: Update Locale Files

**English (en.json)** - Add to `users` section:
```json
"jobTitle": "Job Title",
"department": "Department",
"phone": "Phone Number",
"location": "Location",
"avatarSection": "Profile Photo",
"uploadPhoto": "Upload Photo",
"removePhoto": "Remove Photo",
"basicInfo": "Basic Information",
"organizationalInfo": "Organization",
"securityActions": "Security",
"sendPasswordReset": "Send Password Reset",
"sendPasswordResetDescription": "Send a password reset email to this user",
"passwordResetSent": "Password reset email sent successfully",
"passwordResetError": "Failed to send password reset email",
"confirmPasswordReset": "Are you sure you want to send a password reset email to {{email}}?"
```

**Arabic (ar.json)** - Add translations:
```json
"jobTitle": "المسمى الوظيفي",
"department": "القسم",
"phone": "رقم الهاتف",
"location": "الموقع",
"avatarSection": "صورة الملف الشخصي",
"uploadPhoto": "رفع صورة",
"removePhoto": "إزالة الصورة",
"basicInfo": "المعلومات الأساسية",
"organizationalInfo": "المعلومات التنظيمية",
"securityActions": "الأمان",
"sendPasswordReset": "إرسال رابط إعادة تعيين كلمة المرور",
"sendPasswordResetDescription": "إرسال بريد إلكتروني لإعادة تعيين كلمة المرور",
"passwordResetSent": "تم إرسال بريد إعادة تعيين كلمة المرور بنجاح",
"passwordResetError": "فشل إرسال بريد إعادة تعيين كلمة المرور",
"confirmPasswordReset": "هل أنت متأكد من إرسال بريد إعادة تعيين كلمة المرور إلى {{email}}؟"
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add job_title, department, phone, location to profiles |
| `supabase/functions/admin-reset-password/index.ts` | Create | Edge function for admin password reset |
| `src/hooks/useUsers.ts` | Modify | Add extended update fields + password reset mutation |
| `src/components/users/UserEditDialog.tsx` | Rebuild | Full profile editor with avatar, org info, password reset |
| `src/locales/en.json` | Modify | Add new translation keys |
| `src/locales/ar.json` | Modify | Add Arabic translations |

---

## UI Wireframe for New UserEditDialog

```text
+------------------------------------------+
| Edit User                            [X] |
| Update user profile and settings         |
+------------------------------------------+
|                                          |
|  [Profile Photo Section]                 |
|  +------+  Full Name Here                |
|  |Avatar|  email@example.com             |
|  +------+  Status: Active                |
|                                          |
|  [Upload Photo] [Remove]                 |
|                                          |
+------------------------------------------+
|  Basic Information                       |
|  ┌─────────────────────────────────────┐ |
|  │ Full Name                           │ |
|  └─────────────────────────────────────┘ |
|  ┌─────────────────────────────────────┐ |
|  │ Phone Number                        │ |
|  └─────────────────────────────────────┘ |
+------------------------------------------+
|  Organization                            |
|  ┌─────────────────────────────────────┐ |
|  │ Job Title                           │ |
|  └─────────────────────────────────────┘ |
|  ┌─────────────────────────────────────┐ |
|  │ Department                          │ |
|  └─────────────────────────────────────┘ |
|  ┌─────────────────────────────────────┐ |
|  │ Location                            │ |
|  └─────────────────────────────────────┘ |
+------------------------------------------+
|  Status                                  |
|  ┌─────────────────────────────────────┐ |
|  │ [Active ▼]                          │ |
|  └─────────────────────────────────────┘ |
+------------------------------------------+
|  Security                                |
|  [🔐 Send Password Reset Email]          |
|  Sends a password reset link to user     |
+------------------------------------------+
|                    [Cancel] [Save]       |
+------------------------------------------+
```

---

## Technical Considerations

1. **Avatar Upload**: Reuse the storage pattern from `EditProfileDialog.tsx` using the existing `avatars` bucket
2. **Password Reset Security**: Edge function must verify the caller has admin permissions before sending reset email
3. **RTL Support**: All new fields will use logical properties (`me-`, `ms-`, `ps-`, `pe-`)
4. **Soft Delete**: No hard deletes - status changes handle deactivation
5. **View Refresh**: The `profiles_with_email` view will automatically include new columns

---

## User Flow After Implementation

1. **Admin clicks "Edit" on a user** → Opens enhanced UserEditDialog
2. **Avatar Management**: Upload/remove profile photo immediately saved
3. **Edit Profile**: Change name, phone, job title, department, location
4. **Change Status**: Switch between active/inactive/suspended
5. **Password Reset**: Click button → Confirm → User receives password reset email
6. **Save Changes**: All profile updates saved at once

