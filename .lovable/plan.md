## Move Daily Check-in to Position #1

Move the Daily Check-in block (both `InlineDailyCheckin` and the completed indicator card) to be the very first widget after the greeting and engagement rank badge.

### File: `src/pages/EmployeeHome.tsx`

**Current order** (after greeting + rank badge):

1. Wellness Copilot
2. Team Pulse
3. Quick Appreciation
4. Appreciation Activity
5. Support Hub
6. Endorsement Requests → Shortlist → Voting → Surveys
7. **Daily Check-in / Completed indicator** (lines ~189-208)
8. Prayer → Workload → Mood Dashboard

**New order:**

1. **Daily Check-in / Completed indicator** (moved to top)
2. Support Hub
3. Wellness Copilot
4. Team Pulse
5. Quick Appreciation
6. Appreciation Activity
7. Everything else unchanged

Move the two JSX blocks (the `InlineDailyCheckin` conditional and the `todayEntry` completed card) from their current position to immediately after the `EngagementRankBadge` component, before `WellnessCopilotCard`.