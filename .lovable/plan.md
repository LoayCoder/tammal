

## Fix Prayer Tracker: Auto-Miss Logic & Active Prayer Restoration

### Problem Summary
The prayer tracker code IS deployed and rendering, but the **auto-miss logic is too aggressive** — on every page load/refresh, it immediately marks all expired prayers as "missed" in the database before the user can log them. This means:
- Prayers like Isha get auto-missed the moment you open the page after their 60-min window
- Once auto-missed in the DB, the Mosque/Home/Work buttons never appear (no "active" prayer)
- The user loses the ability to retroactively mark a prayer as completed at Mosque/Home/Work
- The "Edit" functionality that existed in `PrayerCard.tsx` is not present in the dashboard widget

### Root Causes
1. **Auto-miss fires on mount** (lines 128-143 of `DashboardPrayerWidget.tsx`): The `useEffect` runs immediately and mutates DB records for every expired prayer, with only an in-memory `useRef` guard that resets on page refresh.
2. **No edit/override capability**: Once a prayer is logged as "missed", there's no way to change it to "completed_mosque/home/work" from the dashboard widget.
3. **Active prayer detection** (lines 81-112): Only shows a prayer as "active" if it's within its 60-min window AND not yet logged. Once auto-missed, it's logged → no active prayer → no buttons.

### Implementation Plan

#### 1. Remove automatic auto-miss on page load
**File: `src/components/dashboard/DashboardPrayerWidget.tsx`**

Remove the two `useEffect` blocks (lines 128-153) that auto-miss prayers. Instead:
- Show unlogged expired prayers as visually "missed" in the UI (red indicator) WITHOUT writing to the database
- Let the user still tap to log them as completed (Mosque/Home/Work) or explicitly mark as missed
- This means `getPrayerStatus()` needs to check if the window expired for unlogged prayers and show them as "expired/missed" visually, but still allow interaction

#### 2. Update `getPrayerStatus` to handle unlogged-expired state
Add a new visual status `'expired'` for prayers whose window has passed but have no DB log. These show the red X indicator but remain interactive.

#### 3. Show action buttons for unlogged prayers (even expired ones)
Modify the active prayer card section to show Mosque/Home/Work buttons for ANY unlogged prayer — not just the one within its 60-min window. Options:
- Show a tappable row for each unlogged prayer with inline Mosque/Home/Work buttons
- Or allow clicking on any unlogged prayer indicator to open its action buttons

#### 4. Add inline edit capability for logged prayers
When a prayer is already logged (even as "missed"), allow the user to tap the indicator or an edit icon to change the status (similar to the `PrayerCard.tsx` edit flow).

#### 5. Keep visual "missed" styling for truly unlogged prayers at end of day
Only auto-miss prayers at a safe boundary (e.g., midnight or next Fajr), not on every page load during the day.

### Technical Changes

**`src/components/dashboard/DashboardPrayerWidget.tsx`:**
- Remove auto-miss `useEffect` blocks (lines 128-153)
- Update `getPrayerStatus()` to return `'expired'` for unlogged prayers past their window
- Update `activePrayer` logic: instead of finding ONE active prayer, find ALL unlogged prayers and show action buttons for each
- Refactor the active prayer card into a list of actionable prayer rows for all unlogged prayers
- Add edit/change capability for already-logged prayers (tap indicator → show Mosque/Home/Work/Missed options)
- Keep progress calculation: only count `completed_*` statuses from DB; expired-unlogged counts as 0

### Expected Result
- Opening the page does NOT auto-miss prayers
- Unlogged expired prayers show red styling but remain interactive
- User can log any prayer at any time during the day
- User can edit/change a logged prayer's status
- Progress only counts genuinely completed prayers
- Mosque/Home/Work buttons are always accessible for unlogged prayers

