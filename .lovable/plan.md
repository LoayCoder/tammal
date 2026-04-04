

## Prayer Tracker Layout Refinements

### Changes

```text
UPDATED LAYOUT:

┌─────────────────────────────────────────┐
│ 🕌 Prayer Tracker          [More →]    │
│     16 Shawwāl 1447 AH                 │
├─────────────────────────────────────────┤
│ (event banner if any)                   │
├─────────────────────────────────────────┤
│ Active: Maghrib 18:16  ⏱ 45m           │
│ [🏛 Mosque] [🏠 Home] [🏢 Work]        │
│ (rawatib toggles)                       │
├─────────────────────────────────────────┤
│  ✓    ✓    ⏱    ○    ○    ○            │
│ Fajr Dhuhr  Asr  Mgh  Isha Witr       │
│ 5:03 12:08 15:28 18:16 19:36  —        │
│  ·    ··        ··    ·               │
├─────────────────────────────────────────┤
│ Next: Isha in 32m                       │
└─────────────────────────────────────────┘
```

### What changes vs current

1. **Move Mosque/Home/Work buttons next to active prayer name** — combine into one row: prayer name + time on the left, location buttons on the right (same row)

2. **Align vertical circles consistently** — all 6 circles are already in a flex row, but some have rawatib dots and some don't, causing uneven heights. Fix: give every prayer column a fixed min-height so all align at the same baseline regardless of rawatib dots

3. **Smaller font in progress row** — reduce prayer name from `text-[10px]` to `text-[9px]`, time from `text-[9px]` to `text-[8px]`

4. **Remove "3/6 completed" text** — delete lines 387-390

5. **Add "Next prayer in Xm" countdown** — after the progress row, show a small muted badge with time until the next unstarted prayer (computed from timings)

### File Modified

**`src/components/dashboard/DashboardPrayerWidget.tsx`**
- Lines 237-277: Restructure active prayer section — move location buttons (Mosque/Home/Work) inline next to prayer name+time in a single compact row
- Lines 351-383: Add `min-h-[3.5rem]` to each prayer column so circles/names/times align vertically even when some have rawatib dots and others don't
- Lines 365-369: Reduce font sizes (`text-[9px]` for name, `text-[8px]` for time)
- Lines 387-390: Delete the "X/6 completed" paragraph
- After progress row: Add computed `nextPrayerCountdown` — find first prayer whose time is in the future and not yet logged, show "Next: [name] in [X]m" using `--prayer-countdown` token

