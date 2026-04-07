

# Reorder Dashboard Cards: Move Copilot & Pulse Below My Workload

## Current Order (lines 164–233 in `src/pages/EmployeeHome.tsx`)
1. Wellness Copilot (line 165)
2. Copilot Insight History (line 168)
3. Team Pulse (line 171)
4. Quick Appreciation
5. Appreciation Activity
6. Pending Endorsements
7. Shortlist Widget
8. Voting Widget
9. Pending Surveys
10. Prayer Widget
11. To-Do Widget
12. **My Workload** (line 233)

## New Order
Move **Wellness Copilot**, **Copilot Insight History**, and **Team Pulse** to appear right after the **My Workload** widget:

1. Quick Appreciation
2. Appreciation Activity
3. Pending Endorsements
4. Shortlist Widget
5. Voting Widget
6. Pending Surveys
7. Prayer Widget
8. To-Do Widget
9. **My Workload**
10. **Wellness Copilot** ← moved
11. **Copilot Insight History** ← moved
12. **Team Pulse** ← moved

## Change
**File:** `src/pages/EmployeeHome.tsx`
- Remove the 3 blocks (Wellness Copilot, Copilot History, Team Pulse) from their current position (after Support Hub, lines 164–171)
- Re-insert them immediately after the `DashboardWorkloadWidget` block (after line 233)

