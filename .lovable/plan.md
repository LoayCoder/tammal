

## Fix: Midnight Reset & Verify DB Persistence for Prayers + Rawatib

### Issues Found

1. **No midnight reset**: The widget uses `getLocalDateString()` which computes `today` once at render time. After midnight, the `today` value becomes stale — the widget still shows yesterday's data until a full page refresh. There is no mechanism to detect the day boundary and refresh queries.

2. **DB persistence is working correctly**: Both `spiritual_prayer_logs` and `spiritual_sunnah_logs` tables exist with proper schemas. Prayer logs use upsert with `onConflict: 'user_id,prayer_name,prayer_date'`, and Rawatib sunnah logs use upsert with `onConflict: 'user_id,log_date,practice_type'`. All saves go to the database — no issues there.

3. **Witr cross-midnight issue**: When it's 12:01 AM, `getLocalDateString()` returns the new date. But the Witr prayer logged at 12:01 AM should logically belong to the previous night's session. Currently it saves with today's new date, which is technically correct (the user is praying on the new day), but the widget resets and shows Witr as unlogged because `todayLogs` now filters by the new date.

### Plan

#### 1. Add a midnight auto-refresh hook
**New file: `src/hooks/useAutoRefreshOnDayChange.ts`**

A small hook that polls every 30 seconds (or uses `setTimeout` to the next midnight). When the date changes from the previously stored date, it invalidates all prayer and sunnah query keys, forcing the widget to re-fetch with the correct new date.

#### 2. Apply the hook in `DashboardPrayerWidget.tsx`
Call `useAutoRefreshOnDayChange()` at the top of the component. When midnight passes:
- `getLocalDateString()` returns the new date
- All query keys include the new date → fresh data fetched
- Widget resets to show the new day's empty state automatically

#### 3. Apply the same hook in `PrayerTracker.tsx` (details page)
Ensures the full prayer tracker page also resets at midnight without requiring a manual refresh.

### What's Already Working (No Changes Needed)
- **Prayer logs → DB**: `usePrayerLogs.logPrayer` upserts to `spiritual_prayer_logs` ✅
- **Rawatib logs → DB**: `useSunnahLogs.togglePractice` upserts to `spiritual_sunnah_logs` with practice types like `rawatib_fajr_before`, `rawatib_dhuhr_after` ✅
- **Date consistency**: Both hooks use `getLocalDateString()` for browser-local dates ✅

### Technical Details
The hook will use `useRef` to track the last known date string and a 30-second interval to check if `getLocalDateString()` has changed. On change, it calls `queryClient.invalidateQueries` for `['prayer-logs']` and `['sunnah-logs']` keys.

