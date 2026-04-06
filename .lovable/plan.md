

## Analysis: Prayer Tracker Auto-Miss Bug

### Root Cause — TWO bugs found

**Bug 1: Auto-miss fires on page load (not on countdown expiry)**

In `PrayerCard.tsx` (lines 62-67), the auto-miss `useEffect` runs:
```
if (isExpired && !isLogged && !autoMissedRef.current && onAutoMiss) → log as missed
```

This fires **immediately on mount** for any prayer whose 60-minute window has already passed. So if you open the Prayer Tracker at 2 PM, Fajr (expired at ~6:30 AM) instantly gets auto-logged as "missed" — even though you may have prayed and just hadn't opened the app yet.

**Bug 2: Race condition — logs haven't loaded yet**

`todayLogs` comes from a Supabase query (`usePrayerLogs`). On initial render, it's an empty object while the query is in-flight. The countdown hook returns `isExpired: true` immediately (pure time calculation). So the `useEffect` sees `isExpired=true` + `isLogged=false` (because data hasn't arrived) and fires `onAutoMiss()` — logging a prayer as "missed" even if the user had already logged it earlier.

**Bug 3: Witr is expired all day**

`useWitrCountdown` returns `isExpired: true` between Fajr and 10 PM (line 58). Combined with Bug 1, Witr gets auto-missed every time the page opens during daytime.

### Note
The **Dashboard widget** is correct — it has an explicit comment: `// NO auto-miss useEffect — prayers are visual-only until user acts` and uses visual-only "expired" states (red X icon) without auto-logging.

---

### Fix Plan

**File: `src/components/spiritual/PrayerCard.tsx`**

Remove the auto-miss `useEffect` entirely (lines 62-67). The auto-miss pattern is fundamentally flawed because:
- It can't distinguish "timer expired while user was watching" from "timer was already expired on mount"
- It races with data loading
- It removes user agency (users should decide if they missed or not)

Instead, keep the visual expired state (red countdown badge, expired styling) which already works correctly. The user can still manually tap "Missed" or log a completion retroactively — exactly how the dashboard widget works.

**File: `src/pages/spiritual/PrayerTracker.tsx`**

Remove all `onAutoMiss` props from the `PrayerCard` renders (lines 123, 143). These callbacks become unnecessary.

**File: `src/hooks/spiritual/usePrayerCountdown.ts`**

No changes needed — the countdown logic itself is correct.

### Summary of changes
| File | Change |
|------|--------|
| `PrayerCard.tsx` | Remove auto-miss `useEffect` (lines 62-67), remove `autoMissedRef` reset effect (lines 69-71), remove `onAutoMiss` from props interface |
| `PrayerTracker.tsx` | Remove `onAutoMiss` prop from all `PrayerCard` renders |

This makes the Prayer Tracker page behave identically to the Dashboard widget: expired prayers show a visual "expired" indicator but remain interactive for the user to log at their discretion.

