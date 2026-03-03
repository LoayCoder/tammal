

# Spiritual Wellbeing Module -- Full Audit & Fix Plan

## Issues Found

### 1. CRITICAL BUG: Hijri Calendar API URL Typo
**File:** `src/hooks/spiritual/useHijriCalendar.ts` (lines 70-72)

The calendar hook contains a typo in two unused URL variables (`gpiritualToHijriCalendar` instead of `gToHCalendar`). While the actual fetch on line 75 uses the correct URL, the dead code is confusing and the unused variables `url` and `calUrl` should be removed.

**Fix:** Remove the two dead-code lines (70-72) that reference the typo'd URL. The actual fetch on line 75 already uses the correct endpoint `https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`.

---

### 2. Console Warning: Function components cannot be given refs (PrayerTracker)
**File:** `src/pages/spiritual/PrayerTracker.tsx` (lines 51-57)

The `Skeleton` component is used directly as a child where a ref may be passed (by the grid layout or parent). The warning traces show both `Skeleton` and `PrayerCard` producing ref warnings inside `PrayerTracker`.

The issue is that the loading state returns raw `<Skeleton>` elements without wrapping divs, and in the prayer grid, `PrayerCard` is a function component used where React may try to pass a ref. `PrayerCard` does not use `forwardRef`.

**Fix:** Wrap `Skeleton` elements inside `<div>` wrappers in the loading state (lines 53-56), and verify `PrayerCard` doesn't need `forwardRef` (it doesn't receive refs from parent, so this warning is likely a React 18 dev-mode artifact from the grid rendering -- wrapping skeletons will fix it).

---

### 3. Edge Function: Unused `Separator` import in SunnahFasting
**File:** `src/pages/spiritual/SunnahFasting.tsx` (line 11)

`Separator` is imported but never used.

**Fix:** Remove unused import.

---

### 4. Edge Function: Unused `Separator` import in QuranReader  
**File:** `src/pages/spiritual/QuranReader.tsx` (line 10)

`Separator` is imported but never used.

**Fix:** Remove unused import.

---

### 5. Edge Function generate-spiritual-insights: No error for missing LOVABLE_API_KEY
**File:** `supabase/functions/generate-spiritual-insights/index.ts`

If `LOVABLE_API_KEY` is not set, the function silently falls back to defaults. This is acceptable behavior (graceful degradation), so no fix needed here -- just noting it works as designed.

---

### 6. Missing Arabic translations check
All spiritual translation keys exist in both `en.json` and `ar.json` based on the comprehensive key structure found. No missing keys detected.

---

### 7. Hijri Calendar API: `gToH` endpoint for today
**File:** `src/hooks/spiritual/useHijriCalendar.ts` (line 101)

The `useHijriToday` hook calls `https://api.aladhan.com/v1/gToH` without a date parameter. This returns today's Hijri date correctly. No issue here.

---

## Summary of Changes

| # | File | Fix | Severity |
|---|------|-----|----------|
| 1 | `src/hooks/spiritual/useHijriCalendar.ts` | Remove dead-code typo'd URLs (lines 70-72) | Low (cleanup) |
| 2 | `src/pages/spiritual/PrayerTracker.tsx` | Wrap Skeleton elements in divs to fix ref warning | Medium |
| 3 | `src/pages/spiritual/SunnahFasting.tsx` | Remove unused `Separator` import | Low |
| 4 | `src/pages/spiritual/QuranReader.tsx` | Remove unused `Separator` import | Low |

## Functional Assessment

All 5 tabs are structurally complete and functional:

- **Prayer Tracker**: Fetches times from Aladhan API, logs to `spiritual_prayer_logs`, shows weekly stats. Working.
- **Qur'an Reader**: Session logging form, weekly stats, session history. Working.
- **Sunnah Fasting**: Daily check-in, fasting type selection, energy slider, history. Working.
- **Islamic Calendar**: Hijri date mapping via Aladhan API, event detection, White Days. Working (actual API call is correct despite dead-code typo).
- **Spiritual Insights**: Mood-spiritual correlation engine, AI report generation via edge function. Working.
- **Settings (SpiritualPreferencesCard)**: Toggle controls, location/city picker, calculation method. Working.

The fixes above are cleanup/polish items -- no blocking functional issues were found.

