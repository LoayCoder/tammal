

## Plan: Add Al-Witr Prayer to Prayer Tracker & Dashboard

### Overview
Add Witr (الوتر) as a voluntary night prayer with a special time window: **10:00 PM → Fajr adhan**. It will appear as a full prayer card (like the 5 obligatory prayers with mosque/home/work logging) on both the Prayer Tracker page and the Dashboard widget.

### Design Decisions
- **Tracking method**: Use the existing `spiritual_prayer_logs` table (same as obligatory prayers) — no schema changes needed since `prayer_name` is a free-text column.
- **Time window**: Unlike obligatory prayers that use a 1-hour countdown from Aladhan, Witr uses a fixed start (22:00) until the Fajr time from the API.
- **Card placement**: After Isha and before the weekly summary on the Prayer Tracker page.
- **Dashboard**: Include Witr in the active-prayer rotation logic (checked after Isha, before the "all done" state).
- **No Rawatib**: Witr has no before/after Sunnah prayers.

### Changes

**1. New hook: `src/hooks/spiritual/useWitrCountdown.ts`**
- Custom countdown hook that takes Fajr time string as input.
- Returns `isPrayerTime` = true when current time is between 22:00 and Fajr.
- `minutesLeft` counts down to Fajr (the deadline).
- `isExpired` = true after Fajr has passed (for auto-miss).

**2. Update `src/pages/spiritual/PrayerTracker.tsx`**
- Add a Witr `PrayerCard` after Isha, using `useWitrCountdown` instead of `usePrayerCountdown`.
- Display time as "10:00 PM – {Fajr}" instead of a single time.
- Include in weekly stats calculation (total possible becomes 7 × 6 = 42).

**3. Update `src/components/dashboard/DashboardPrayerWidget.tsx`**
- Add Witr to the active-prayer detection logic: after all 5 obligatory prayers are checked, also check Witr (active when time is 22:00+ or before Fajr and not logged).
- Add Witr indicator dot in the progress row (6 dots instead of 5).
- Update completion counter to show `X/6`.

**4. Update `src/hooks/spiritual/usePrayerTimes.ts`**
- Add `'Witr'` to `PRAYER_NAMES` array as an optional/extended name, OR keep it separate since Witr doesn't come from the Aladhan API.
- Better approach: keep `PRAYER_NAMES` as the 5 obligatory ones, and handle Witr separately in the components that need it.

**5. Add i18n keys** for Witr prayer name and description:
- `spiritual.prayer.names.witr` → "Al-Witr" / "الوتر"
- `spiritual.prayer.witrTimeRange` → "10:00 PM – Fajr" / dynamic

**6. Update `src/shared/status-badge/presets.ts`**
- `PRAYER_STATUS_CONFIG` already covers `completed_mosque`, `completed_home`, `completed_work`, `missed` — no changes needed since Witr uses the same statuses.

| File | Action |
|---|---|
| `src/hooks/spiritual/useWitrCountdown.ts` | **New** — countdown from 22:00 to Fajr |
| `src/pages/spiritual/PrayerTracker.tsx` | Add Witr card after Isha |
| `src/components/dashboard/DashboardPrayerWidget.tsx` | Add Witr to active-prayer logic + progress row |
| `src/components/spiritual/PrayerCard.tsx` | Minor: support optional `timeLabel` prop for range display |
| i18n translation files | Add Witr labels (en + ar) |

