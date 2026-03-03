
# Add Countdown Timer + Auto-Miss Logic to Prayer Tracker

## Overview
Add a live countdown timer to each prayer card showing time remaining before it's auto-marked as "missed" (1 hour after prayer time). Users can still modify the status anytime before end of day (midnight).

## How It Works

1. **Countdown Display**: Each unlogged prayer card shows a live countdown (e.g., "47:23 remaining") starting from the prayer's Adhan time. The 1-hour window counts down in real-time.
2. **Auto-Miss**: When the 1-hour window expires and the prayer is still unlogged, it is automatically marked as "missed" (client-side -- no server cron needed). This happens via a `useEffect` timer that checks every minute.
3. **Edit Until Midnight**: Even after auto-miss, users can tap the card to change status (mosque/home/work) until the end of the day. A small "Edit" button appears on missed cards.

## Changes

### 1. New hook: `src/hooks/spiritual/usePrayerCountdown.ts`
A lightweight hook that:
- Takes the prayer time string (e.g., "05:23") and returns:
  - `minutesLeft`: minutes remaining in the 1-hour window (null if prayer time hasn't arrived yet, 0 if expired)
  - `isExpired`: true if more than 60 minutes have passed since prayer time
  - `isPrayerTime`: true if the current time is past the prayer's Adhan time
- Uses `useState` + `useEffect` with a 30-second interval to update the countdown
- Pure client-side, no DB calls

### 2. Update `PrayerCard` component
**File:** `src/components/spiritual/PrayerCard.tsx`

Add new props:
- `nextPrayerTime?: string` -- optional, not used for logic but available
- `countdownMinutes?: number | null` -- minutes left in the 1-hour window
- `isExpired?: boolean` -- whether the 1-hour window has passed
- `onAutoMiss?: () => void` -- callback when auto-miss triggers

Visual changes:
- **Before prayer time**: Show prayer time, no countdown (card looks normal, buttons available)
- **During 1-hour window** (prayer time has passed, < 60 min): Show a countdown badge like "⏱ 47m left" in amber/warning color. Action buttons remain visible.
- **After 1-hour window** (expired, no log): Card auto-triggers `onAutoMiss()`. Shows "Missed" status with a red style. An "Edit" button appears to allow changing status.
- **Already logged**: No countdown shown (current behavior, status badge visible). An "Edit" button allows changing until end of day.

### 3. Update `PrayerTracker` page
**File:** `src/pages/spiritual/PrayerTracker.tsx`

- Import and use `usePrayerCountdown` for each of the 5 prayers
- Pass countdown data to each `PrayerCard`
- Handle `onAutoMiss` callback: calls `logPrayer.mutate({ prayer_name, prayer_date: today, status: 'missed' })`
- Add an "Edit" button on logged cards that resets the log (re-upserts with new status)

### 4. Allow editing logged prayers
**File:** `src/components/spiritual/PrayerCard.tsx`

When a prayer is already logged:
- Show the current status badge (existing)
- Add a small "Edit" / "تعديل" button below the status
- Clicking it reveals the action buttons (mosque/home/work/missed) again, allowing re-selection
- The upsert in `usePrayerLogs` already handles overwriting the same `(user_id, prayer_name, prayer_date)` row

### 5. Localization
**Files:** `src/locales/en.json`, `src/locales/ar.json`

New keys:
- `spiritual.prayer.timeLeft`: "{{minutes}}m left" / "{{minutes}}د متبقية"
- `spiritual.prayer.autoMissed`: "Auto-marked as missed" / "تم تسجيلها كفائتة تلقائياً"
- `spiritual.prayer.edit`: "Edit" / "تعديل"
- `spiritual.prayer.upcoming`: "Upcoming" / "قادمة"

## Technical Details

### Countdown Logic (client-side only)
```text
Parse prayer time "HH:mm" -> convert to today's Date
deadline = prayerTime + 60 minutes
minutesLeft = max(0, (deadline - now) / 60000)
isExpired = now > deadline
```

The countdown re-renders every 30 seconds via `setInterval`. When `isExpired` becomes true and no log exists, the component calls `onAutoMiss` once (guarded by a ref to prevent duplicate calls).

### No database or migration changes needed
- The existing `logPrayer` upsert already supports overwriting status for the same prayer+date
- Auto-miss just calls the same upsert with `status: 'missed'`

## Files to create/modify
- **New:** `src/hooks/spiritual/usePrayerCountdown.ts`
- **Edit:** `src/components/spiritual/PrayerCard.tsx` (countdown display + edit button)
- **Edit:** `src/pages/spiritual/PrayerTracker.tsx` (wire countdown + auto-miss)
- **Edit:** `src/locales/en.json` (4 new keys)
- **Edit:** `src/locales/ar.json` (4 new keys)
