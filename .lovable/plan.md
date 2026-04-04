
Problem found:
- The screen you are on is `/employee/wellness`, but the Prayer dashboard widget is rendered on the home dashboard, not on that route. So part of what you are seeing is the wrong page for this widget.
- There are also real logic issues in the prayer widget:
  1. Date handling uses `new Date().toISOString().split('T')[0]`, which is UTC-based and can mark today’s logs incorrectly for users in local timezones.
  2. The widget treats any existing log as “logged” for prayer flow, even when the timing logic and next/active logic should still be stricter.
  3. `activePrayer` fallback returns the next unlogged prayer without checking whether its prayer time has started, which can make the widget feel wrong.
  4. Duha translations already exist now, so the current Duha issue is not missing locale text anymore.
  5. The agreed compact layout/progress row exists in `DashboardPrayerWidget.tsx`, but it only appears on the dashboard page, not the wellness page.

What to build:
1. Fix local-date handling everywhere in spiritual hooks
- Replace UTC date generation with a shared local-date helper.
- Apply it in:
  - `usePrayerLogs`
  - `useSunnahLogs`
  - `PrayerTracker`
  - `DashboardPrayerWidget`
- This should stop prayers appearing completed/missed on the wrong day.

2. Correct dashboard prayer-state logic
- Refine `activePrayer` so it only becomes active when its valid time window has actually started.
- Do not fall back to a future prayer as active just because it is the next unlogged item.
- Keep Duha visible only in its correct window and keep Witr handled separately.

3. Make completion state accurate
- Use one consistent rule for:
  - active prayer
  - completed count
  - all-completed message
  - progress bar
- Obligatory prayers + Witr should count from prayer logs with `status.startsWith('completed')`.
- Duha should count only from `todayCompleted.has('duha')`.
- “Missed” must never be treated as completed.

4. Verify Duha visibility behavior
- Ensure Duha appears in the 7-item progress row at all times.
- Ensure the Duha action appears only when appropriate for its time window, but its indicator still remains in the layout.
- Keep the agreed count as 7 items total.

5. Align routes so the user sees the right UI
- Confirm whether you want this prayer widget:
  - only on the dashboard `/`
  - or also inside `/employee/wellness`
- If it should also appear on wellness, add/reuse the same widget there rather than expecting the dashboard version to appear automatically.

Technical details:
- Main file with the current logic: `src/components/dashboard/DashboardPrayerWidget.tsx`
- Related hooks:
  - `src/hooks/spiritual/usePrayerLogs.ts`
  - `src/hooks/spiritual/useSunnahLogs.ts`
  - `src/hooks/spiritual/usePrayerTimes.ts`
  - `src/hooks/spiritual/usePrayerCountdown.ts`
  - `src/hooks/spiritual/useWitrCountdown.ts`
- Translation keys for Duha already exist in:
  - `src/locales/en.json`
  - `src/locales/ar.json`

Expected result after implementation:
- Isha will not appear completed unless it was actually logged completed for the correct local day.
- Duha will be available and counted correctly.
- The 7-item count and percentage will match the agreed layout.
- The widget behavior will feel consistent with prayer times.
- You will see the correct UI on the correct page.

One clarification needed before implementation:
- Should I keep the full prayer widget only on the dashboard home, or also place the same widget inside `/employee/wellness` so you can see it there too?
