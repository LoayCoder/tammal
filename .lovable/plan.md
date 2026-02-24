

# Fix: Add Date Context to Wellness (Burnout) Indicator

## Problem

The Burnout Indicator card on the Employee Home page does not display any date or date range. It shows the wellness zone (Thriving/Watch/At Risk) and the 7-day average score, but the user has no way to know what time period this data covers. This is a UX gap, not a data bug -- the underlying data is loading and calculating correctly.

## Solution

Add a subtitle to the Burnout Indicator card showing the date range it covers (last 7 days), similar to how the Mood History chart already shows "Last 14 days".

## Changes

### 1. Update `src/pages/EmployeeHome.tsx`

Add a descriptive subtitle under the "Burnout" card title showing the evaluated date range:

```text
Burnout Indicator
Based on Feb 17 - Feb 24  (or use translation key: "home.burnoutPeriod")
```

Specifically:
- Add a `<p>` tag after the `<CardTitle>` inside the Burnout card, styled as `text-muted-foreground text-xs`
- Display a computed date range string: from 7 days ago to today (formatted as `dd MMM - dd MMM`)
- Add the translation key `home.burnoutPeriod` (e.g., "Based on last 7 days") to both `en.json` and `ar.json`

### 2. Update `src/locales/en.json`

Add:
```json
"home.burnoutPeriod": "Based on last 7 days"
```

### 3. Update `src/locales/ar.json`

Add:
```json
"home.burnoutPeriod": "بناءً على آخر 7 أيام"
```

## Scope

- 3 files modified
- No logic changes, no database changes
- Pure UI/UX improvement

