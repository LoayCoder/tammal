

## Add Duha Prayer to Dashboard Prayer Widget

### What Changes

Add Duha (صلاة الضحى) as a voluntary prayer in the progress row and active prayer section. Duha time window: after Sunrise until before Dhuhr (both already available from `timings.Sunrise` and `timings.Dhuhr`).

### Layout

```text
Progress row (7 circles instead of 6):

  ✓    ☀    ⏱    ○    ○    ○    ○
Fajr  Duha Dhuhr  Asr  Mgh  Isha Witr
5:03  6:30 12:08 15:28 18:16 19:36  —
```

Duha sits between Fajr and Dhuhr in chronological order. Its time label shows Sunrise time (start of window). When active, it shows the same inline UI as other prayers but with a simple "Done ✓ / Undo" toggle (like the existing Duha card in PrayerTracker page) since it's voluntary — no Mosque/Home/Work location buttons.

### Implementation — `DashboardPrayerWidget.tsx`

1. **Update `ALL_PRAYERS`** — insert `'Duha'` after `'Fajr'`: `['Fajr', 'Duha', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr']`

2. **Duha status** — read from `todayCompleted.has('duha')` (already tracked via `useSunnahLogs`), not from `todayLogs`

3. **Active prayer logic** — after checking Fajr, check if current time is between Sunrise and Dhuhr and Duha not completed → set active to `'Duha'`

4. **Active prayer card for Duha** — show prayer name + time range (Sunrise – Dhuhr) + a simple "Done ✓" button (no location buttons, no rawatib)

5. **Progress row** — Duha circle uses `todayCompleted.has('duha')` for completed state, shows ☀ emoji or check icon, time label = Sunrise time

6. **Countdown for Duha** — show minutes remaining until Dhuhr (end of Duha window)

### Files Modified
1. `src/components/dashboard/DashboardPrayerWidget.tsx` — all changes above

