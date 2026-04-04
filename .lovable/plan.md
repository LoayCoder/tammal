
Goal: make the dashboard show all recent Prayer Tracker updates reliably, and add the missing visible progress percentage the user is asking about.

What I found
- The main Prayer Tracker widget file already includes the recent updates:
  - Duha was added
  - new icons are wired in
  - the compact layout is present
  - next-prayer countdown is present
- The dashboard route is wrapped in an ErrorBoundary, which is why you see “Section error” when this widget crashes.
- I also found 2 likely reasons the update still does not look complete:

1. Missing percentage/progress UI
- In `src/components/dashboard/DashboardPrayerWidget.tsx`, `completedCount` is computed but never shown.
- So if you expected a percent or progress indicator, it is currently not rendered.
- Also, the current count ignores Duha because it only counts prayer logs, while Duha is stored separately in sunnah logs.

2. Missing Duha translation keys
- In `src/locales/en.json` and `src/locales/ar.json`, `spiritual.prayer.names.duha` does not exist.
- The widget uses `t('spiritual.prayer.names.duha')` in several places.
- That can produce broken labels or contribute to unstable rendering/fallback behavior.

Implementation plan
1. Fix translation completeness
- Add `duha` to:
  - `src/locales/en.json`
  - `src/locales/ar.json`
- Use:
  - English: `Duha`
  - Arabic: `الضحى`

2. Add visible progress percentage to the dashboard widget
- Update `src/components/dashboard/DashboardPrayerWidget.tsx`
- Compute progress from all 7 tracked items:
  - Fajr, Duha, Dhuhr, Asr, Maghrib, Isha, Witr
- Count Duha from `todayCompleted.has('duha')`
- Count the others from prayer logs with `status.startsWith('completed')`
- Render a compact progress row similar to the app’s other widgets:
  - completed/total
  - percentage
  - slim progress bar

Example target behavior:
```text
Progress: 4/7   57%
[ slim progress bar ]
```

3. Make the percentage accurate everywhere
- Replace the current `completedCount` logic so it includes Duha
- Ensure “all completed” and percent use the same source of truth
- Keep Witr included so the total stays 7

4. Harden the widget against section crashes
- In `DashboardPrayerWidget.tsx`, make label rendering safer when a translation key is missing
- Keep fallback text for Duha/Witr names if translation resolution fails
- Avoid any UI path depending on undefined text keys

5. Verify dashboard-only rendering
- Confirm the homepage route `/` uses `Dashboard -> EmployeeHome -> DashboardPrayerWidget`
- Make sure the widget shows:
  - Duha item in the 7-icon row
  - requested icons
  - next prayer text
  - visible percentage/progress
  - no section fallback

Technical notes
- Files to update:
  - `src/components/dashboard/DashboardPrayerWidget.tsx`
  - `src/locales/en.json`
  - `src/locales/ar.json`
- No backend/schema changes needed
- This is a frontend consistency + localization fix, not a data-model issue

Expected result
- The dashboard will visibly reflect all the updates already added
- Duha will display correctly by name
- The widget will show a real percent/progress indicator
- The “Section error” risk from missing translation-dependent rendering will be reduced significantly
