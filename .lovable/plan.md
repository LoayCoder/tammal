

## Plan: Add Rawatib (Sunnah) indicators to Dashboard Prayer Widget

The `DashboardPrayerWidget` currently only shows the active prayer with log buttons but lacks the Rawatib Sunnah rak'ah info that `PrayerCard` already has.

### Changes

**File: `src/components/dashboard/DashboardPrayerWidget.tsx`**

1. Import the Sunnah hooks (`useSunnahLogs`) and add a `RAWATIB_CONFIG` map (same as in `PrayerCard.tsx`: Fajr → 2 after, Dhuhr → 2 before + 2 after, Asr → none, Maghrib → 2 after, Isha → 2 after).

2. Inside the active prayer card section, add tap-to-toggle Rawatib chips below the log buttons — matching the existing style from `PrayerCard`:
   - 📿 "2 Rak'ahs before" (if applicable)
   - 📿 "2 Rak'ahs after" (if applicable)
   - Each chip toggles completed state via `onToggleSunnah`

3. In the progress row (5 prayer indicators at the bottom), add small dot indicators beneath each prayer icon showing if its Rawatib are completed.

### Hook dependency
Need to check if `useSunnahLogs` or a similar hook exists for Rawatib tracking at the dashboard level, or if the sunnah data is already available through `usePrayerLogs`.

