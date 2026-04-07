

# Improve "Send Check-in Reminder" — Bulk Action for Managers

## Problem
Currently, "Send Check-in Reminder" just navigates to the Team Pulse card where the manager must click "Check-in" on each team member one by one. This is tedious and not what a manager expects from a recommendation labeled "Send Check-in Reminder."

## Solution
Make the recommendation trigger a **bulk check-in reminder** that sends notifications to all direct reports who haven't checked in today, with a confirmation toast showing how many were sent.

## Implementation

### 1. Create a Bulk Check-in Action Component
**New file:** `src/features/team-pulse/components/BulkCheckinReminder.tsx`

- A small dialog/sheet that appears when the deep link includes `&action=bulk-checkin`
- Shows list of direct reports who haven't checked in today
- "Send to All" button that inserts `engagement_notifications` for each member
- Success toast: "Sent check-in reminders to 5 team members"

### 2. Update TeamPulseCard Deep Link Handling
**File:** `src/features/team-pulse/components/TeamPulseCard.tsx`

- Detect `action=bulk-checkin` URL param
- Auto-open the BulkCheckinReminder dialog after scrolling into view
- Clean URL params after processing

### 3. Update Edge Function Route
**File:** `supabase/functions/wellness-copilot/index.ts`

- Change `team_checkin` route to: `/dashboard?focus=team-pulse&mode=team&action=bulk-checkin`

### 4. Update Client-Side Normalization
**File:** `src/features/wellness-copilot/hooks/useCopilotInsight.ts`

- Map `team_checkin` key to the new route with `&action=bulk-checkin`

### 5. Clear Stale Cache
- Delete team-mode cached insights so new route takes effect immediately

## Flow After Fix
1. Manager clicks "Send Check-in Reminder" in Copilot
2. Dashboard opens → Team Pulse scrolls into view in team mode
3. A confirmation dialog appears listing team members who haven't checked in
4. Manager clicks "Send to All" → reminders sent → success toast
5. One-click workflow instead of clicking each member individually

## Technical Details
- Reuses existing `handleCheckIn` logic from `TeamMemberActions.tsx`
- Filters out team members who already checked in today (query `mood_entries` for `entry_date = today`)
- Batch insert into `engagement_notifications`
- Logs action via `useEngagementActionLog`

