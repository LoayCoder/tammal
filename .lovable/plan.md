

# Transform Sunnah Fasting into Sunnah Tracker

## Goal
Rename and expand `/spiritual/fasting` to `/spiritual/sunnah` -- a broader "Sunnah Tracker" page that covers fasting, Adhkar (morning/evening), and Tahajjud/Qiyam al-Layl. Replace the current complex form with a simple emoji/word-based check-in.

## Changes

### 1. Database: Create `spiritual_sunnah_logs` table
A new table to track all Sunnah practices (not just fasting):

```text
spiritual_sunnah_logs
  id            uuid PK
  user_id       uuid FK -> auth.users
  log_date      date
  practice_type text  (fasting, adhkar_morning, adhkar_evening, tahajjud)
  completed     boolean
  created_at    timestamptz
  UNIQUE(user_id, log_date, practice_type)
```

RLS: user can only read/write their own rows (`auth.uid() = user_id`).

The existing `spiritual_fasting_logs` table stays untouched (no data loss). The new page uses the new table with a simpler model.

### 2. New hook: `src/hooks/spiritual/useSunnahLogs.ts`
- Query today's logs and last 30 days from `spiritual_sunnah_logs`
- `togglePractice(practice_type, completed)` mutation -- upsert on `(user_id, log_date, practice_type)`
- Return today's status per practice and 30-day completion counts

### 3. Rewrite page: rename `SunnahFasting.tsx` to `SunnahTracker.tsx`
Replace the current form-heavy UI with a simple card-based check-in:

```text
+------------------------------------------+
|  Today's Sunnah                          |
|                                          |
|  [🍽️ Fasting]  [🌅 Morning Adhkar]       |
|  [🌙 Evening Adhkar]  [🕌 Tahajjud]      |
|                                          |
|  Tap to mark as done. Tap again to undo. |
+------------------------------------------+
```

Each practice is a large tappable card/button with:
- An emoji icon (🍽️ / 🌅 / 🌙 / 🕌)
- The practice name in current language
- Visual state: muted when not done, highlighted/checked when done
- Single tap toggles completion -- no forms, no dropdowns, no sliders

Below: a simple 30-day stats summary (completed counts per practice) and a minimal history list.

### 4. Update routing and navigation
- **`src/App.tsx`**: Change route from `/spiritual/fasting` to `/spiritual/sunnah`, rename lazy import
- **`src/components/layout/AppSidebar.tsx`**: Update NavLink `to="/spiritual/sunnah"`, change icon from `UtensilsCrossed` to `Star` (broader meaning), update translation key to `spiritual.nav.sunnahTracker`
- Keep sidebar visibility gated on `fasting_enabled` preference (or rename later)

### 5. Localization updates
Update `src/locales/en.json` and `src/locales/ar.json`:
- Add `spiritual.nav.sunnahTracker`: "Sunnah Tracker" / "متتبع السنن"
- Add `spiritual.sunnah.*` keys for the new page:
  - `title`: "Sunnah Tracker" / "متتبع السنن"
  - `subtitle`: "Track your daily Sunnah practices" / "تتبع سننك اليومية"
  - `todayTitle`: "Today's Sunnah" / "سنن اليوم"
  - `tapToMark`: "Tap to mark as done" / "انقر للتسجيل"
  - Practice labels: Fasting / Morning Adhkar / Evening Adhkar / Tahajjud
  - Stats and history labels
- Keep existing `spiritual.fasting.*` keys (used by Islamic Calendar page)

## Files to create/modify
- **New migration**: create `spiritual_sunnah_logs` table with RLS
- **New file**: `src/hooks/spiritual/useSunnahLogs.ts`
- **Rename/rewrite**: `src/pages/spiritual/SunnahFasting.tsx` -> `src/pages/spiritual/SunnahTracker.tsx`
- **Edit**: `src/App.tsx` (route path + import)
- **Edit**: `src/components/layout/AppSidebar.tsx` (nav link + label)
- **Edit**: `src/locales/en.json` and `src/locales/ar.json` (new keys)

## What stays unchanged
- `spiritual_fasting_logs` table and `useFastingLogs` hook (still used by Islamic Calendar and Insights)
- All other spiritual pages
- RLS, auth, existing preferences

