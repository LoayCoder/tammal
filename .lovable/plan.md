

## Unified Gamification Dashboard

### Overview
Create a new page at `/gamification` that consolidates all gamification data into a single premium view: wellness streaks, recognition points balance, engagement rank, and full achievement/transaction history.

### Data Sources (existing hooks, no new DB tables needed)
- **Wellness streaks & points**: `useGamification(employeeId)` → streak, totalPoints
- **Recognition points**: `usePoints()` → balance, expiringWithin30Days, transactions
- **Engagement rank**: `useEmployeeEngagementRank(employeeId, tenantId)` → rank, totalEmployees
- **Redemption history**: `useRedemptionRequests()` → requests

### Files to Create

**1. `src/pages/GamificationDashboard.tsx`**
- Uses `PageHeader` (flush variant) with a Trophy icon
- **Top row** — 4 `MetricCard` stats via `DashboardGrid columns={4}`:
  - Current Streak (Flame icon, streak count + "days" description)
  - Wellness Points (Star icon, totalPoints from mood entries)
  - Recognition Balance (Coins icon, balance + expiring-soon warning)
  - Engagement Rank (Medal icon, #rank / totalEmployees)
- **Middle section** — `EngagementRankBadge` component (existing premium card, reused as-is)
- **Bottom section** — `Tabs` with two tabs:
  - "Points History" → reuses `TransactionHistory` component
  - "Redemptions" → reuses redemption list from `PointsDashboard`
- Loading state: skeleton placeholders

### Files to Modify

**2. `src/App.tsx`**
- Add lazy import for `GamificationDashboard`
- Add route: `<Route path="/gamification" element={<GamificationDashboard />} />`

**3. `src/components/layout/AppSidebar.tsx`**
- Add "Gamification" nav item under the appropriate employee-facing group, pointing to `/gamification`

### Design Approach
- Reuses existing system components (`PageHeader`, `MetricCard`, `DashboardGrid`, `Tabs`) and design tokens (`cardVariants`, `typography`)
- No new database tables or migrations
- RTL-compatible using logical properties
- All data via existing hooks — no direct Supabase calls in the page

