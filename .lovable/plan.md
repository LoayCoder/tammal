

# Spiritual Wellbeing Module -- Phase 1: Foundation + Prayer Tracking

## Overview

Add an optional, fully private Spiritual Wellbeing module to TAMMAL. Phase 1 covers the database foundation, user preference toggles in the profile page, and a complete Prayer Tracking feature with the Aladhan API integration.

**Privacy guarantee**: All spiritual data is stored in separate tables (`spiritual_*` prefix), protected by user-only RLS policies, and completely excluded from organizational analytics.

---

## What Gets Built

### A. Database Foundation (4 new tables)

| Table | Purpose |
|---|---|
| `spiritual_preferences` | Per-user toggle states (prayer, quran, fasting, reminders enabled) + location settings |
| `spiritual_prayer_logs` | Individual prayer completion records |
| `spiritual_quran_sessions` | Qur'an reading session logs (prepared for Phase 2 built-in reader) |
| `spiritual_fasting_logs` | Fasting day records (prepared for Phase 2) |

**RLS Policy**: Every table uses `user_id = auth.uid()` -- only the user can see their own data. No tenant-level access. No admin access. No super-admin bypass for spiritual data.

### B. User Profile -- Spiritual Preferences Section

Add a new card to the User Profile page (`/settings/profile`) below the existing Permissions card:

- **Main toggle**: "Enable Spiritual Wellbeing Tools" (Switch)
- When enabled, show sub-toggles:
  - Prayer Tracking (Switch)
  - Qur'an Engagement (Switch, disabled label "Coming Soon")
  - Sunnah Fasting (Switch, disabled label "Coming Soon")
  - Spiritual Reminders (Switch, disabled label "Coming Soon")
- Location selector: City/Country dropdown (stored for prayer time API)
- Calculation method selector (for Aladhan API: e.g., Umm al-Qura, ISNA, Muslim World League)
- Legal disclaimer at the bottom

### C. Prayer Tracking Page

New route: `/spiritual/prayer` accessible from the sidebar (under Wellness group, visible only when prayer tracking is enabled).

**Features:**
- Fetch today's prayer times from Aladhan API based on saved city/coordinates
- Display 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) as cards with time and status
- Each prayer card has a check-in prompt with options: Mosque, Home, Work, Missed, Remind Later
- Weekly summary view showing consistency percentage
- Positive, non-judgmental feedback messages
- No streaks, no red alerts, no guilt messaging

### D. Prayer Tracking Hook + Aladhan Integration

- `useSpiritualPreferences` hook: CRUD for user's spiritual settings
- `usePrayerTimes` hook: Fetches prayer times from `https://api.aladhan.com/v1/timingsByCity` (free, no API key)
- `usePrayerLogs` hook: CRUD for prayer completion records
- Correlation data point stored alongside mood entries for future AI insights (Phase 2+)

### E. Sidebar Integration

Add a "Spiritual Wellbeing" collapsible section in the sidebar (below Mental Toolkit), visible only when `spiritual_preferences.enabled = true`:
- Prayer Tracker (Phase 1)
- Qur'an Reader (grayed out, Phase 2)
- Sunnah Fasting (grayed out, Phase 2)

### F. Mood Check-in Integration Point

After mood check-in submission, if the spiritual module is enabled, optionally show a soft prompt: "Would you like to engage in a calming spiritual activity?" linking to the Prayer Tracker or a dhikr prompt. This is non-intrusive and dismissible.

---

## Files to Create

| File | Purpose |
|---|---|
| `src/hooks/useSpiritualPreferences.ts` | Manage user spiritual settings |
| `src/hooks/usePrayerTimes.ts` | Aladhan API integration |
| `src/hooks/usePrayerLogs.ts` | Prayer log CRUD |
| `src/components/spiritual/SpiritualPreferencesCard.tsx` | Profile preferences UI |
| `src/components/spiritual/PrayerCard.tsx` | Individual prayer status card |
| `src/pages/spiritual/PrayerTracker.tsx` | Main prayer tracking page |
| Migration SQL | 4 tables + RLS policies |

## Files to Modify

| File | Change |
|---|---|
| `src/pages/settings/UserProfile.tsx` | Add SpiritualPreferencesCard |
| `src/components/layout/AppSidebar.tsx` | Add Spiritual Wellbeing section |
| `src/App.tsx` | Add `/spiritual/prayer` route |
| `src/locales/en.json` | Add all spiritual module keys |
| `src/locales/ar.json` | Add all Arabic translations |

---

## Technical Details

### Database Schema

```text
spiritual_preferences
- id (uuid, PK)
- user_id (uuid, NOT NULL, references auth.users, UNIQUE)
- enabled (boolean, default false)
- prayer_enabled (boolean, default false)
- quran_enabled (boolean, default false)
- fasting_enabled (boolean, default false)
- reminders_enabled (boolean, default false)
- reminder_intensity (text, default 'light') -- light/moderate/high
- city (text)
- country (text)
- latitude (numeric)
- longitude (numeric)
- calculation_method (integer, default 4) -- Aladhan method ID
- created_at, updated_at

spiritual_prayer_logs
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- prayer_name (text) -- fajr/dhuhr/asr/maghrib/isha
- prayer_date (date)
- status (text) -- completed_mosque/completed_home/completed_work/missed/skipped
- logged_at (timestamptz)
- created_at
- UNIQUE(user_id, prayer_name, prayer_date)

spiritual_quran_sessions (Phase 2 placeholder)
- id, user_id, duration_minutes, surah_name, juz_number, reflection_notes, session_date, created_at

spiritual_fasting_logs (Phase 2 placeholder)
- id, user_id, fast_date, fast_type, completed, energy_rating, notes, created_at
```

### RLS Policy (same pattern for all 4 tables)

```text
Policy: "Users can manage their own spiritual data"
Command: ALL
Using: (user_id = auth.uid())
With Check: (user_id = auth.uid())
```

No tenant-level, admin, or super-admin policies -- spiritual data is strictly private.

### Aladhan API Call

```text
GET https://api.aladhan.com/v1/timingsByCity?city=Riyadh&country=SA&method=4
```

Response includes Fajr, Dhuhr, Asr, Maghrib, Isha times. No API key required. Cached per day.

### Privacy Safeguards

- No `tenant_id` column in spiritual tables (unlike all other tables)
- RLS is user-only (no admin bypass)
- No joins to organizational tables
- Data export and full deletion supported via preferences toggle
- Disabling the module archives data and stops all tracking immediately

