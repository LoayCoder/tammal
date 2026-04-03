

## Improve Prayer Progress Row — Clarity & Real-Time Data

**Problem**: The prayer progress row at the bottom of the widget truncates names to 3 characters (e.g. "Faj", "Dhu", "Mag"), making them hard to read. It also doesn't show the actual prayer time next to each indicator, so there's no at-a-glance connection between prayer name, time, and status.

### Changes (single file: `src/components/dashboard/DashboardPrayerWidget.tsx`)

**1. Show full prayer names instead of truncated 3-char abbreviations**
- Line 263-264: Replace `.slice(0, 3)` with the full translated name
- Increase text size from `text-2xs` to `text-[10px]` for readability

**2. Show each prayer's time below the name**
- Add a second line under each prayer name showing the actual adhan time (e.g. "5:12", "12:30")
- For Witr, show "Witr" label without a specific time (since it's a range)
- Strip timezone suffixes like `(EET)` for clean display

**3. Increase indicator circle size for better visibility**
- Bump circle from `h-6 w-6` to `h-7 w-7` for easier tapping and reading

**4. Highlight active prayer more prominently**
- Add a subtle `animate-pulse` to the active prayer's ring so it stands out as "current"

### Technical Detail

```
Progress row layout (per prayer):

  [ ● ]       ← status circle (h-7 w-7)
  Fajr        ← full translated name
  5:12        ← actual prayer time from API
```

The times come from `timings[name]` which is already available. Each indicator maps `todayLogs[name]` for status (green check / red X / active timer / grey pending).

No new files, hooks, or database changes needed — purely presentational improvements within the existing component.

