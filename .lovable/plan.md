

# Add Duha Prayer & Rawatib to Prayer Tracker + Sunnah Integration

## Overview
Add two new voluntary prayer sections to the Prayer Tracker page -- **Duha** (mid-morning) and **Rawatib** (Sunnah prayers before/after obligatory ones). These will be tracked via the existing `spiritual_sunnah_logs` table, reusing the Sunnah toggle system for a consistent, simple tap-to-mark experience.

## Changes

### 1. Add new practice keys to `SUNNAH_PRACTICES`
**File:** `src/hooks/spiritual/useSunnahLogs.ts`

Add two new entries:
- `duha` -- emoji: `☀️`, labels: "Duha Prayer" / "صلاة الضحى"
- `rawatib` -- emoji: `📿`, labels: "Rawatib" / "الرواتب"

The stats grid in the Sunnah Tracker page will automatically pick these up since it iterates over `SUNNAH_PRACTICES`.

### 2. Add a "Voluntary Prayers" section to Prayer Tracker
**File:** `src/pages/spiritual/PrayerTracker.tsx`

After the 5 obligatory prayer cards and before the weekly summary, add a new card titled "Voluntary Prayers" / "النوافل" containing two simple emoji toggle buttons (same style as Sunnah Tracker):
- **Duha**: ☀️ tap to mark done
- **Rawatib**: 📿 tap to mark done

These buttons call `useSunnahLogs().togglePractice` with `practice_type: 'duha'` / `'rawatib'`, writing to `spiritual_sunnah_logs` -- fully integrated with the Sunnah page.

Import `useSunnahLogs` into PrayerTracker and use `todayCompleted` to show checked/unchecked state.

### 3. Localization
**Files:** `src/locales/en.json`, `src/locales/ar.json`

Add keys:
- `spiritual.prayer.voluntaryTitle`: "Voluntary Prayers" / "النوافل"
- `spiritual.prayer.voluntarySubtitle`: "Sunnah prayers linked to your daily tracking" / "صلوات السنة مرتبطة بتتبعك اليومي"

No new keys needed for the practice labels themselves -- they're defined in `SUNNAH_PRACTICES` with inline bilingual labels.

### 4. Update stats grid layout
**File:** `src/pages/spiritual/SunnahTracker.tsx`

Change the 30-day stats grid from `sm:grid-cols-4` to `sm:grid-cols-3` (6 items now, 3 per row looks better than 4+2).

## Files to modify
- `src/hooks/spiritual/useSunnahLogs.ts` -- add `duha` and `rawatib` to `SUNNAH_PRACTICES`
- `src/pages/spiritual/PrayerTracker.tsx` -- add voluntary prayers section using sunnah toggle
- `src/pages/spiritual/SunnahTracker.tsx` -- adjust grid columns for 6 items
- `src/locales/en.json` -- add 2 keys
- `src/locales/ar.json` -- add 2 keys

## No database changes needed
Both new practices use the existing `spiritual_sunnah_logs` table with `practice_type` text field -- no migration required.

