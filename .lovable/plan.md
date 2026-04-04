

## Improve Rawatib Logging UX & Layout Clarity

### Current State
Rawatib (Sunnah prayers tied to each obligatory prayer) are already fully saved to the database via `spiritual_sunnah_logs` with practice types like `rawatib_fajr_before`, `rawatib_dhuhr_after`, etc. The toggle buttons work and persist data correctly.

**However, the UX has issues:**
1. **Inconsistent config**: `PrayerCard.tsx` has Fajr as `{ after: 2 }` but `DashboardPrayerWidget.tsx` has Fajr as `{ before: 2 }`. The correct Sunnah for Fajr is **2 Rak'ahs BEFORE** Fajr (not after).
2. **Rawatib toggles are hidden** — in the dashboard widget, they only appear when the prayer row is expanded. Users may not know they exist.
3. **No visual explanation** of what Rawatib are or how many each prayer has.

### Plan

#### 1. Fix Rawatib Config Consistency
**Files: `PrayerCard.tsx` and `DashboardPrayerWidget.tsx`**

Correct Rawatib per Islamic Sunnah (12 total Rak'ahs):
- Fajr: **2 before** (not after)
- Dhuhr: 2 before + 2 after
- Asr: none
- Maghrib: 2 after
- Isha: 2 after

Update `PrayerCard.tsx` line 12 from `{ after: 2 }` to `{ before: 2 }`.

#### 2. Improve Rawatib Layout in PrayerCard (Details Page)
**File: `PrayerCard.tsx`**

- Add a small label/header: "📿 Rawatib Sunnah" above the toggle pills
- Show the total count (e.g., "2/4 Rak'ahs") as a subtle counter
- Make the pills slightly larger and more tappable on mobile
- Add a subtle info tooltip or text explaining what Rawatib are for first-time users

#### 3. Make Rawatib More Visible in Dashboard Widget
**File: `DashboardPrayerWidget.tsx`**

- Show small Rawatib indicator dots below each prayer name in the compact row (already partially done with dots)
- When a prayer row is expanded, keep the Rawatib toggles but add clearer labels
- Add a small Rawatib summary in the progress section (e.g., "Rawatib: 4/10")

#### 4. Add Rawatib Summary Section
**File: `DashboardPrayerWidget.tsx`**

Below the prayer progress bar, add a compact line:
```
📿 Rawatib: 4/10 completed
```
This gives users visibility into their Sunnah progress without expanding each prayer.

### Technical Details
- **DB flow**: `togglePractice.mutate({ practice_type: 'rawatib_fajr_before', completed: true })` → upserts to `spiritual_sunnah_logs` with `onConflict: 'user_id,log_date,practice_type'`
- **Read flow**: `todayCompleted` Set from `useSunnahLogs` contains all completed practice types for today
- Config fix is a one-line change in `PrayerCard.tsx`; layout improvements are CSS/JSX only

