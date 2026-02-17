

# Admin-Controlled Auth Page Options

## Overview
Instead of removing signup or invitation features, both will remain on the Auth page but their visibility will be controlled by a **global platform setting** that super admins can toggle on/off. By default, signup is hidden and invitation link is shown.

## Problem
The Auth page is public (no user is logged in), so it cannot read per-tenant settings. We need a **platform-level** settings table that is publicly readable to control what options appear on the login screen.

## Solution

### 1. New Database Table: `platform_settings`
A single-row table storing global platform configuration, publicly readable.

| Column | Type | Default |
|---|---|---|
| id | uuid (PK) | auto |
| allow_public_signup | boolean | false |
| show_invitation_link | boolean | true |
| updated_at | timestamp | now() |
| updated_by | uuid | null |

- **RLS**: Anyone can SELECT (public page needs to read it). Only super admins can UPDATE.
- Seed with one row on creation.

### 2. New Hook: `src/hooks/usePlatformSettings.ts`
- Fetches the single row from `platform_settings`
- Returns `{ allowSignup, showInvitation, isLoading }`
- No auth required (anon-accessible SELECT)

### 3. Update Auth Page (`src/pages/Auth.tsx`)
- Call `usePlatformSettings()` on mount
- If `allowSignup` is false: hide the "Create account" toggle and signup form entirely (login-only mode)
- If `showInvitation` is true: show a "Have an invitation code?" link to `/auth/accept-invite`
- Both can be true simultaneously (user sees signup toggle AND invitation link)

### 4. Admin Settings Page
Add a "Platform Auth Settings" section to an existing admin page (e.g., a new card in the Document Settings page or a dedicated section). Super admins can toggle:
- "Allow Public Signup" switch
- "Show Invitation Link" switch

### 5. Translation Keys
Add to `en.json` and `ar.json`:
- `auth.haveInviteCode` / `auth.useInviteCode`
- `platformSettings.title` / `platformSettings.allowSignup` / `platformSettings.showInvitation` and descriptions

## Technical Details

### Database Migration
```sql
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allow_public_signup boolean NOT NULL DEFAULT false,
  show_invitation_link boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for public auth page)
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Only super admins can update
CREATE POLICY "Super admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Seed single row
INSERT INTO public.platform_settings (allow_public_signup, show_invitation_link)
VALUES (false, true);
```

### Auth Page Behavior Matrix

| allow_public_signup | show_invitation_link | Auth Page Shows |
|---|---|---|
| false | true | Login form + "Have an invitation code?" link |
| true | true | Login/Signup toggle + "Have an invitation code?" link |
| true | false | Login/Signup toggle only |
| false | false | Login form only |

### Files to Create/Modify
| File | Change |
|---|---|
| **Migration SQL** | Create `platform_settings` table with RLS + seed row |
| `src/hooks/usePlatformSettings.ts` | New hook to fetch settings |
| `src/pages/Auth.tsx` | Conditionally show signup toggle and invitation link |
| `src/pages/admin/DocumentSettings.tsx` | Add platform auth settings card for super admins |
| `src/locales/en.json` | Add translation keys |
| `src/locales/ar.json` | Add Arabic translation keys |

