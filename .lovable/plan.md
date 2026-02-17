

# Admin-Controlled Auth Page (Signup & Invitation Visibility)

## Overview
Make the signup form and invitation link on the Auth page controlled by a global platform setting. Super admins can toggle these on/off from the admin panel. By default, signup is hidden and the invitation link is shown.

## What You Will See

### On the Auth Page (`/auth`)
- **Default state**: Login form only + "Have an invitation code?" link
- When a super admin enables public signup: the "Create account" toggle reappears
- When a super admin hides the invitation link: it disappears
- Both toggles work independently

### In Admin Settings (Document Settings page)
- A new "Platform Authentication" card with two switches:
  - **Allow Public Signup** (off by default)
  - **Show Invitation Link** (on by default)

## Technical Details

### 1. Database Migration
Create a `platform_settings` table (single-row, publicly readable):

```sql
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allow_public_signup boolean NOT NULL DEFAULT false,
  show_invitation_link boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT USING (true);

CREATE POLICY "Super admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.platform_settings (allow_public_signup, show_invitation_link)
VALUES (false, true);
```

### 2. New File: `src/hooks/usePlatformSettings.ts`
- Fetches the single row from `platform_settings` (no auth required)
- Returns `{ allowSignup, showInvitation, isLoading }`

### 3. Update: `src/pages/Auth.tsx`
- Import `usePlatformSettings` and `Link` from react-router-dom
- Wrap the signup toggle in `if (allowSignup)` -- when false, force `isLogin = true` and hide the toggle
- Add invitation link at the bottom when `showInvitation` is true:
  ```
  Have an invitation code? Use Invitation Code
  ```
- The login form always remains visible

### 4. Update: `src/pages/admin/DocumentSettings.tsx`
- Add a "Platform Authentication" card with two Switch components
- Fetches current settings and allows super admins to toggle them
- Saves changes via Supabase update to `platform_settings`

### 5. Translation Keys (en.json / ar.json)
- `auth.haveInviteCode`: "Have an invitation code?" / "لديك رمز دعوة؟"
- `auth.useInviteCode`: "Use Invitation Code" / "استخدم رمز الدعوة"
- `platformSettings.title`: "Platform Authentication" / "إعدادات المصادقة"
- `platformSettings.allowSignup`: "Allow Public Signup" / "السماح بالتسجيل العام"
- `platformSettings.allowSignupDesc`: "When enabled, anyone can create an account from the login page" / "عند التفعيل، يمكن لأي شخص إنشاء حساب من صفحة تسجيل الدخول"
- `platformSettings.showInvitation`: "Show Invitation Link" / "إظهار رابط الدعوة"
- `platformSettings.showInvitationDesc`: "Show 'Have an invitation code?' link on the login page" / "إظهار رابط 'لديك رمز دعوة؟' في صفحة تسجيل الدخول"

### Files Summary

| File | Action |
|---|---|
| Migration SQL | Create `platform_settings` table + RLS + seed |
| `src/hooks/usePlatformSettings.ts` | New -- fetch platform settings |
| `src/pages/Auth.tsx` | Update -- conditional signup/invitation rendering |
| `src/pages/admin/DocumentSettings.tsx` | Update -- add admin toggle switches |
| `src/locales/en.json` | Update -- add new keys |
| `src/locales/ar.json` | Update -- add Arabic keys |

