

## Merge Islamic Calendar into Prayer Tracker Widget

### What Changes
The `DashboardIslamicCalendarWidget` will be **removed as a standalone widget** and its content (Islamic events + fasting badges) will be **integrated into the Prayer Tracker widget** (`DashboardPrayerWidget`), creating a single unified spiritual widget with a premium, minimal design.

### Layout Inside Prayer Tracker

```text
┌─────────────────────────────────────────┐
│ 🕌 Prayer Tracker          [More →]    │
│     16 Shawwāl 1447 AH  (already there)│
├─────────────────────────────────────────┤
│ ┌─ Event banner (if any) ────────────┐  │
│ │ 🌟 Event name + fasting badges     │  │
│ └────────────────────────────────────┘  │
├─────────────────────────────────────────┤
│ [Active prayer card — unchanged]        │
├─────────────────────────────────────────┤
│ ○ ○ ○ ○ ○ ○  Progress row — unchanged  │
│ 3/6 completed                           │
└─────────────────────────────────────────┘
```

The Hijri date is already displayed in the Prayer Tracker header — no duplication. The event + fasting badges slot in as a compact inline section between the header and the active prayer card.

### Files Modified

1. **`src/components/dashboard/DashboardPrayerWidget.tsx`**
   - Import `ISLAMIC_EVENTS`, `isWhiteDay`, `isSunnahFastingDay` from `useHijriCalendar`
   - Use the existing `hijri` data from `prayerData.date.hijri` (already available)
   - Add a compact event banner + fasting badge row between the header and active prayer card
   - Use semantic tokens (`--islamic-accent`, `--state-completed`) — no hardcoded colors
   - Style: subtle `bg-primary/[0.04]` rounded-lg for event, inline pill badges for fasting indicators

2. **`src/components/dashboard/DashboardIslamicCalendarWidget.tsx`** — Delete file

3. **`src/pages/EmployeeHome.tsx`** — Remove `DashboardIslamicCalendarWidget` import and usage (line 20, 125)

### Design Principles
- No new standalone card — everything inside the existing Prayer Tracker card
- Minimal: event shown only when one exists; badges only when relevant
- Premium: consistent with existing `cardVariants.premiumVip` styling
- Calendar link preserved via a small inline "View calendar →" text link on the event banner

