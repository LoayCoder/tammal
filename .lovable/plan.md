

# Add Mood Tracker Dashboard to My Dashboard Page

## What Changes
Integrate the rich mood analytics content currently on `/mental-toolkit/mood-tracker` (KPI cards, 14-day trend chart with org average, mood distribution donut, weekly activity heatmap, survey stats) into the **My Dashboard** page (`EmployeeHome`), replacing the simpler mood history chart and burnout indicator currently there.

## Approach

### 1. Extract reusable dashboard sections from MoodTrackerPage

Create a new component `src/components/dashboard/PersonalMoodDashboard.tsx` that contains the visual sections from `MoodTrackerPage`:
- **4 KPI cards** (Streak, 7-Day Avg with burnout zone badge, Monthly check-ins, Today's mood)
- **14-day Mood Trend Chart** (area chart with org average reference line)
- **Two-column row**: Mood Distribution donut + Weekly Activity heatmap
- **Survey Stats** section
- **Quick links** row (Thought Reframer, Breathing, Mood Tracker full page)

This component will accept the data from the `usePersonalMoodDashboard` hook and render it, keeping it reusable.

### 2. Update EmployeeHome to use the new component

Replace the existing sections in `EmployeeHome.tsx`:
- **Remove**: The simple 3-stat cards (This Month, Avg Mood, Streak), the basic 14-day area chart, and the burnout progress bar
- **Keep**: Greeting header, gamification badges, inline daily check-in, pending surveys card, quick actions (Crisis Support, First Aider)
- **Add**: The new `PersonalMoodDashboard` component after the check-in/survey sections, using `usePersonalMoodDashboard` hook (which already powers the mood tracker page)

### 3. Layout order on My Dashboard

```text
1. Greeting + Gamification badges
2. Inline Daily Check-in (if not done) / Check-in done card
3. Pending Surveys card (if any)
4. KPI Cards row (Streak, 7d Avg, Monthly, Today)
5. 14-day Mood Trend Chart (with org avg line)
6. Distribution Donut + Weekly Activity Heatmap (side by side)
7. Survey Stats
8. Quick Actions (Crisis Support, First Aider)
9. Links to full Mood Tracker, Thought Reframer, Breathing
```

## Technical Details

- **Hook reuse**: `usePersonalMoodDashboard` already aggregates all the data needed (streak, burnout zone, distribution, day activity, survey stats, org averages). It will be called in `EmployeeHome` instead of the current `useMoodHistory` + `useGamification` combo.
- **No data duplication**: The existing `useMoodHistory` and `useGamification` hooks will still be used for the inline check-in component; the dashboard sections use `usePersonalMoodDashboard`.
- **RTL safe**: All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`) and existing glass-card/glass-stat patterns.
- **No breaking changes**: The `/mental-toolkit/mood-tracker` page remains available as the full dedicated view.

### Files to create
- `src/components/dashboard/PersonalMoodDashboard.tsx` -- extracted dashboard widget

### Files to modify
- `src/pages/EmployeeHome.tsx` -- integrate new component, remove redundant sections

