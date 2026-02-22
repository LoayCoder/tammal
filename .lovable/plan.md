

# Personal Mood Analytics Dashboard

## Overview

Transform the Mood Tracker page (`/mental-toolkit/mood-tracker`) from a localStorage-based submission tool into a **read-only personal analytics dashboard** powered by real database data. The user sees their own mood history, trends, and statistics -- plus an anonymized comparison against the organization average. No submission forms on this page.

---

## What the User Will See

### Section 1: Summary KPI Cards (top row)
- **Current Streak** -- consecutive daily check-in days
- **7-Day Average Mood** -- with a burnout zone indicator (Thriving / Watch / At Risk)
- **Monthly Check-ins** -- count this month out of total days
- **Today's Mood** -- emoji + label, or "Not checked in yet"

### Section 2: Mood Trend Line Chart (14 days)
- Area chart showing the user's daily mood scores over the last 14 days
- A dashed **Organization Average** reference line so the user can compare themselves to the org norm
- Emoji tooltips showing the mood level for each day

### Section 3: Mood Distribution (Donut Chart)
- Breakdown of how often the user felt each mood level (Great, Good, Okay, Struggling, Need Help) over the selected period
- Uses the tenant's configured `mood_definitions` for labels and emojis

### Section 4: Weekly Activity Heatmap
- Small grid showing which days of the week the user typically checks in
- Highlights consistency patterns

### Section 5: Survey Response Stats
- Total questions answered
- Average response score
- Completion rate (answered vs. delivered)

---

## Data Sources (all real database data)

| Data | Source |
|---|---|
| User's mood history | `mood_entries` table via `useMoodHistory` hook (extended to 90 days) |
| Org average mood | `mood_entries` table -- aggregated across all tenant employees for the same period |
| Mood definitions (emojis, labels) | `mood_definitions` table via `useMoodDefinitions` |
| Survey responses | `employee_responses` + `scheduled_questions` via existing hooks |
| Streak and gamification | `useGamification` hook (already exists) |
| Current employee identity | `useCurrentEmployee` hook |

---

## Technical Implementation

### New Hook: `src/hooks/usePersonalMoodDashboard.ts`

A dedicated hook that fetches all data needed for this page:

- **Extended mood history**: Query `mood_entries` for the current employee over the last 90 days (not just 14)
- **Org average**: Query `mood_entries` for all employees in the same tenant, grouped by `entry_date`, computing daily average `mood_score`. Returns as `{ date: string, orgAvg: number }[]`
- **Mood distribution**: Count entries grouped by `mood_level` for the user
- **Day-of-week activity**: Count entries grouped by day of week (0-6) for the user
- **Survey stats**: Count from `employee_responses` (total answers), count from `scheduled_questions` where status = 'delivered' (total delivered), compute completion rate

All queries are scoped to the user's `employee_id` (personal data) or `tenant_id` (org average -- anonymized aggregate only).

### Rewrite: `src/pages/mental-toolkit/MoodTrackerPage.tsx`

Complete replacement of the page content. Instead of rendering `MoodTrackerTool`, it will render the dashboard sections described above using Cards and Recharts components. No import of `MoodTrackerTool` -- no submission UI at all.

Layout:
1. Page header (keep existing gradient style)
2. KPI cards row (4 cards in a responsive grid)
3. Mood Trend chart (full width, area chart with org avg reference line)
4. Two-column row: Mood Distribution (donut) + Weekly Activity (heatmap grid)
5. Survey Response Stats card

### Keep: `src/components/mental-toolkit/tools/MoodTrackerTool.tsx`

This file stays **unchanged**. It is still used on the main Mental Toolkit page (`/mental-toolkit`) as a quick-log tool inside the "Tools" tab. Only the dedicated Mood Tracker page changes.

### Localization: `src/locales/en.json` and `src/locales/ar.json`

New keys under `mentalToolkit.moodDashboard`:
- `pageTitle`, `pageSubtitle`
- `currentStreak`, `days`, `avgMood7d`, `monthlyCheckins`, `todayMood`, `notCheckedIn`
- `moodTrend`, `orgAverage`, `yourMood`
- `moodDistribution`, `weeklyActivity`, `surveyStats`
- `totalAnswered`, `avgResponseScore`, `completionRate`
- `thriving`, `watch`, `atRisk`
- `noDataYet`, `startCheckinPrompt`

---

## Files Summary

| Action | File |
|---|---|
| New | `src/hooks/usePersonalMoodDashboard.ts` -- all data fetching for the personal dashboard |
| Rewrite | `src/pages/mental-toolkit/MoodTrackerPage.tsx` -- read-only analytics dashboard |
| Modify | `src/locales/en.json` -- new translation keys |
| Modify | `src/locales/ar.json` -- new translation keys |

---

## Privacy and Security

- Personal data uses `employee_id` filter -- RLS on `mood_entries` already ensures users only see their own entries
- Org average is computed as a single aggregate number per day -- no individual employee data is exposed
- The org average query uses `.eq('tenant_id', tenantId)` which is allowed by the existing RLS policy "Users can view active mood definitions in their tenant" -- but for `mood_entries`, the RLS only allows viewing own entries. So the org average must be computed differently:
  - Option: Use the already-computed org data from `useOrgAnalytics` if the user has admin access, OR
  - Better: Fetch org average via a lightweight query that only returns aggregated scores (the RLS on `mood_entries` allows tenant-level access for admins but not regular employees)
  - **Solution**: Since regular employees cannot query other employees' mood entries due to RLS, the org average will be computed from the `useOrgAnalytics` hook data if available, or hidden for non-admin users with a note "Organization comparison available for managers"

## Design System

- Uses the Mental Toolkit calming palette (Lavender #C9B8E8, Sage Green #A8C5A0, Deep Plum #4A3F6B)
- Rounded cards with soft shadows matching the existing toolkit design
- All classes use logical properties (ms-/me-/ps-/pe-) for RTL support
- Responsive: cards stack on mobile, side-by-side on desktop

