

# Employee Homepage

## Overview
Replace the current admin-only Dashboard at `/` with a role-aware homepage. Employees will see an attractive, colorful wellness homepage with actionable cards for daily check-ins, pending surveys, mood history charts, and burnout indicators. Admins will continue seeing the existing admin dashboard.

## What You Will See

### 1. Greeting Section
- Personalized greeting with the employee's name and a time-based message (Good morning / afternoon / evening)
- Gamification stats: streak badge and total points

### 2. Action Cards (Top Priority)
- **Daily Check-in Card**: A prominent, colorful card that appears if the employee hasn't checked in today. Tapping it navigates to `/employee/wellness`. If already done, shows a green "Completed" state with the mood emoji.
- **Pending Surveys Card**: Shows count of pending survey questions. Tapping navigates to `/employee/survey`. Hidden if no pending surveys exist.

### 3. Mood History Chart (Last 14 Days)
- A smooth area/line chart showing mood scores over time using Recharts (already installed)
- Color-coded by mood level (green for great, yellow for okay, red for struggling)

### 4. Burnout Indicator
- A visual gauge/progress bar based on the average mood score from the last 7 days
- Three zones: "Thriving" (green), "Watch" (amber), "At Risk" (red)
- Simple and non-alarming visual language

### 5. Quick Stats Row
- Total check-ins this month
- Average mood score
- Current streak

## Technical Details

### New File: `src/pages/EmployeeHome.tsx`
- A new page component containing all homepage sections
- Uses existing hooks: `useCurrentEmployee`, `useGamification`, `useScheduledQuestions`
- Fetches mood history from `mood_entries` table (last 14 days)
- Checks today's check-in status from `mood_entries` (same query as DailyCheckin page)

### New File: `src/hooks/useMoodHistory.ts`
- Fetches last 14 mood entries for the current employee
- Returns data formatted for Recharts (date, score, level)
- Computes 7-day average for burnout indicator

### Update: `src/pages/Dashboard.tsx`
- Add role detection: if the user has an employee profile (non-admin), render `EmployeeHome`; otherwise render the existing admin dashboard
- Uses `useCurrentEmployee` and `usePermissions` to determine the view

### Update: Translation files (`en.json` and `ar.json`)
Add keys under a new `home` section:
- `home.greeting`, `home.goodMorning`, `home.goodAfternoon`, `home.goodEvening`
- `home.checkinCard`, `home.checkinNow`, `home.checkinDone`
- `home.surveyCard`, `home.pendingSurveys`
- `home.moodHistory`, `home.last14Days`
- `home.burnout`, `home.thriving`, `home.watch`, `home.atRisk`
- `home.monthlyCheckins`, `home.avgMood`, `home.currentStreak`

### No Database Changes
All data already exists in `mood_entries`, `scheduled_questions`, and `employees` tables with proper RLS policies.

### Design Approach
- Uses existing Shadcn Card, Badge, and Progress components
- Recharts AreaChart for mood history (already a dependency)
- Soft gradients and rounded corners for an inviting feel
- Fully responsive (mobile-first card stack, desktop grid)
- RTL-compatible using logical properties (`ms-`, `me-`, `text-start`, etc.)
- Animations with `animate-in` classes for a polished feel
