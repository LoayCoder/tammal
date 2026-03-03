

# Add Prayer Tracker & Islamic Calendar to Employee Dashboard

## Overview
When the user has Spiritual Wellbeing enabled, show two new sections on the Employee Home dashboard:
1. **Prayer Tracking Card** — shows the current/next prayer with countdown and action buttons (mosque/home/work/missed), auto-advancing through the day
2. **Today's Islamic Calendar** — shows today's Hijri date and any Islamic events/fasting info for today

## New Component: `DashboardPrayerWidget`
**File:** `src/components/dashboard/DashboardPrayerWidget.tsx`

A compact widget that:
- Uses `useSpiritualPreferences` to check if spiritual + prayer is enabled; renders nothing if not
- Uses `usePrayerTimes` to fetch today's prayer times
- Uses `usePrayerLogs` for today's logs
- Uses `useSunnahLogs` for today's rawatib status
- Uses `usePrayerCountdown` for each prayer
- Determines the **current active prayer** (the first unlogged prayer whose time has arrived, or the next upcoming one)
- Displays a compact card showing:
  - Hijri date from the prayer times API response
  - The active prayer name, time, and countdown badge
  - Quick-action buttons (mosque/home/work/missed) for the active prayer
  - A progress row showing all 5 prayers as small status indicators (checkmark for completed, dot for pending)
- As prayers are logged, the widget auto-advances to the next prayer
- Links to the full Prayer Tracker page via a "View All" button

## New Component: `DashboardIslamicCalendarWidget`
**File:** `src/components/dashboard/DashboardIslamicCalendarWidget.tsx`

A compact widget that:
- Uses `useHijriToday` to get today's Hijri date
- Uses `ISLAMIC_EVENTS` to check if today has any Islamic event
- Uses `isWhiteDay` and `isSunnahFastingDay` to show fasting recommendations
- Displays:
  - Today's Hijri date (day, month name, year)
  - Any Islamic event for today with its description
  - Fasting recommendation badge if applicable (White Day, Monday/Thursday, special)
  - Link to full Islamic Calendar page
- Renders nothing if spiritual wellbeing is not enabled

## Dashboard Integration
**File:** `src/pages/EmployeeHome.tsx`

Add both widgets after the mood check-in section and before the Personal Mood Dashboard:
```
{/* Spiritual Wellbeing Section */}
<DashboardPrayerWidget />
<DashboardIslamicCalendarWidget />
```

No conditional wrapper needed — each widget internally checks if spiritual features are enabled and renders nothing if not.

## Files to create/modify
- **New:** `src/components/dashboard/DashboardPrayerWidget.tsx`
- **New:** `src/components/dashboard/DashboardIslamicCalendarWidget.tsx`
- **Edit:** `src/pages/EmployeeHome.tsx` — import and render both widgets

## No database or migration changes needed
All data comes from existing hooks and the Aladhan API.

