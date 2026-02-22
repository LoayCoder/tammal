

# Comprehensive Audit Report: Spiritual Wellbeing Module (Phases 1-3)

## Summary

After a thorough end-to-end review of all spiritual module files -- hooks, pages, components, edge function, sidebar, locales, and database schema -- I found **8 issues** ranging from critical bugs to minor improvements.

---

## Issues Found

### 1. CRITICAL BUG: Hijri Calendar API URL is Wrong

**File:** `src/hooks/useHijriCalendar.ts` (lines 70-75)

The `useHijriCalendar` hook contains a typo in the Aladhan API URL. It uses `gpiritualToHijriCalendar` instead of `gToHCalendar`. There are also two dead variable assignments (`url` and `calUrl`) that are never used -- only the third `fetch` call (line 75) uses the correct URL.

**Impact:** The unused variables are harmless but confusing. The actual fetch on line 75 uses the correct URL `gToHCalendar`, so the calendar **does work**, but the dead code should be cleaned up.

**Fix:** Remove the dead `url` and `calUrl` variable declarations on lines 70-72.

---

### 2. MEDIUM BUG: Edge Function Uses `getUser()` Instead of `getClaims()`

**File:** `supabase/functions/generate-spiritual-insights/index.ts` (lines 28-37)

Per project standards, edge functions should use `getClaims(token)` for JWT verification, not `getUser()`. The current implementation creates an extra `anonClient` and calls `getUser()` which makes a server round-trip. It also creates a service-role client for data queries but constructs auth incorrectly.

**Fix:** Replace with `getClaims()` pattern and use a single service-role client for data fetching (since RLS is user-only and service role bypasses it correctly for server-side operations).

---

### 3. MEDIUM BUG: Edge Function Inserts with Service Role -- Bypasses RLS

**File:** `supabase/functions/generate-spiritual-insights/index.ts` (line 168)

The edge function inserts into `spiritual_insight_reports` using the service-role client. Since RLS on that table requires `user_id = auth.uid()`, the service-role bypasses RLS entirely. This works but is a security concern -- any authenticated user could potentially generate reports for any user if the edge function logic had a bug.

**Fix:** Use the user-scoped client (with Authorization header forwarded) for the insert, or validate user_id explicitly before insert with service role.

---

### 4. MEDIUM: `SpiritualPreferences` Interface Missing `reminder_time` Field

**File:** `src/hooks/useSpiritualPreferences.ts`

The `SpiritualPreferences` TypeScript interface does not include the `reminder_time` field that exists in the database (confirmed in `types.ts`). If the reminders feature tries to read/write this field, TypeScript won't catch type errors.

**Fix:** Add `reminder_time: string | null;` to the interface.

---

### 5. LOW: All Spiritual Hooks Use `as any` Type Casting

**Files:** All 5 spiritual hooks (`useSpiritualPreferences`, `usePrayerLogs`, `useQuranSessions`, `useFastingLogs`, `useSpiritualReports`)

Every Supabase `.from()` call uses `as any` to bypass TypeScript type checking. Since the `types.ts` file (auto-generated) includes these tables, the `as any` casts are unnecessary and hide potential type mismatches.

**Fix:** Remove `as any` from all `.from()` calls. The tables exist in the generated types.

---

### 6. LOW: Toast Messages Not Translated in Hooks

**Files:** `src/hooks/useQuranSessions.ts` (line 66), `src/hooks/useFastingLogs.ts` (line 83)

Hardcoded English strings in toast messages: `"Qur'an session logged"`, `"Fasting logged"`, and `"Error"`. These should use `i18n.t()` or be replaced with translation keys.

**Fix:** Import `i18n` from `@/lib/i18n` and use `i18n.t('...')` for toast messages (following the project's hook pattern of using `i18n` directly instead of `useTranslation` hook).

---

### 7. LOW: Spiritual Reminders Toggle Has No Actual Functionality

**File:** `src/components/spiritual/SpiritualPreferencesCard.tsx`

The "Spiritual Reminders" toggle and intensity selector save preferences to the database, but there is no push notification or in-app reminder system wired up. The toggle stores the value but nothing consumes it.

**Impact:** Users can enable reminders but won't receive any. This is a feature gap, not a bug per se, since Phase 3 planned it but only the UI was built.

**Fix:** Either implement browser notification integration, or add a "Coming soon" badge next to the reminder toggle to set expectations.

---

### 8. LOW: Hijri Calendar Dead Code Cleanup

**File:** `src/hooks/useHijriCalendar.ts` (lines 70-72)

Two unused variable declarations with the wrong API URL string. These are dead code left from development.

**Fix:** Remove lines 70-72 (the two dead `url` and `calUrl` declarations).

---

## Implementation Plan

### Step 1: Fix Hijri Calendar Dead Code (Issue 1 + 8)
Remove the unused variables with the typo URL from `useHijriCalendar.ts`.

### Step 2: Fix Edge Function Auth Pattern (Issue 2 + 3)
Refactor `generate-spiritual-insights/index.ts` to use `getClaims()` and use an auth-forwarded client for the insert operation.

### Step 3: Fix TypeScript Interface (Issue 4)
Add `reminder_time` to the `SpiritualPreferences` interface.

### Step 4: Remove `as any` Casts (Issue 5)
Remove `as any` from all 5 spiritual hooks' `.from()` calls.

### Step 5: Translate Toast Messages (Issue 6)
Replace hardcoded English toast strings with `i18n.t()` calls in `useQuranSessions.ts` and `useFastingLogs.ts`.

### Step 6: Add "Coming Soon" to Reminders (Issue 7)
Add a visual indicator that reminders are not yet functional.

