

## Fix: "Day Done" State for Prayer Tracker Widget

### Problem
Currently the widget only shows a completion state when all 7 prayers are logged as `completed_*`. When the day ends (all prayer windows expired) but some prayers were missed or unlogged, the widget shows nothing meaningful — no summary, no way to navigate to the details page.

### Plan

**File: `src/components/dashboard/DashboardPrayerWidget.tsx`**

1. **Add `isDayDone` detection**: Check if all prayer windows have expired (Isha + 60 min passed, Witr expired, Duha window passed). This is separate from `allCompleted`.

2. **Add a "Day Done" UI state** (between the `allCompleted` celebration and the `unloggedPrayers` section):
   - When `isDayDone && !allCompleted`: Show a summary card with:
     - Completion ratio (e.g., "5/7 prayers completed")
     - Visual indicator of completed vs missed
     - Motivational message based on ratio
     - **"View Details"** button linking to `/spiritual/prayer`
   - When `allCompleted`: Keep existing celebration UI, but also add the "View Details" button

3. **Logic for `isDayDone`**:
   ```
   isDayDone = Isha window expired AND Witr expired AND Duha window passed
   ```
   Uses existing `isWindowExpired()` and `witrCountdown.isExpired`.

4. **Hide action buttons when day is done**: No need to show Mosque/Home/Work for expired prayers at end of day — show the summary instead.

### Expected Result
- End of day: clean summary showing how many prayers were completed, with a button to the full prayer tracker page
- All completed: celebration + details button
- Partial completion: summary with stats + encouragement + details button

