

## Add Employee Engagement Rank Badge to Personal Dashboard

### What We're Building
A premium motivational widget on the employee's personal dashboard showing their engagement rank within the organization — e.g., "Rank #3 out of 142 employees" — with a visually distinct medal/trophy icon for top 3, and a clean badge for others.

### How It Works

**1. New Hook: `useEmployeeEngagementRank`**
- **File**: `src/hooks/wellness/useEmployeeEngagementRank.ts`
- Query the same data source as `computeTopEngagers` but scoped to the current employee
- Steps:
  1. Fetch all mood entries for the tenant in the last 30 days
  2. Compute streak per employee (reuse `computeStreak` logic)
  3. Sort all employees by streak desc, then response count desc
  4. Find the current employee's position in the sorted list
  5. Return `{ rank: number, totalEmployees: number, isLoading: boolean }`
- Cache with React Query key `['engagement-rank', tenantId, employeeId]`, `staleTime: 5min`

**2. New Component: `EngagementRankBadge`**
- **File**: `src/components/dashboard/EngagementRankBadge.tsx`
- Premium VIP card design showing:
  - Medal icon for top 3 (gold/silver/bronze using semantic rank tokens) or a `Trophy` icon for others
  - Large bold rank number: "#3"
  - Context line: "out of 142 employees" (localized AR/EN)
  - Subtle motivational text for top 3: "You're a top performer!" / for others: "Keep engaging to climb the ranks!"
- Design: `premium-card` surface, `rounded-2xl`, smooth hover state, compact layout fitting the greeting area or as a standalone widget
- Full AR translation support

**3. Integration into Employee Dashboard**
- **File**: `src/pages/EmployeeHome.tsx`
- Place the rank badge in the greeting header area, next to the existing streak/points chips — or as a small standalone card right after the greeting section
- Only show when rank data is available (not loading, employee has entries)

**4. Localization**
- **Files**: `src/locales/en.json`, `src/locales/ar.json`
- Keys: `home.engagementRank`, `home.outOfEmployees`, `home.topPerformer`, `home.keepEngaging`, `home.yourRank`

### Files Summary

| File | Change |
|------|--------|
| `src/hooks/wellness/useEmployeeEngagementRank.ts` | **New** — fetch employee's rank position |
| `src/components/dashboard/EngagementRankBadge.tsx` | **New** — premium rank badge component |
| `src/pages/EmployeeHome.tsx` | Add rank badge to dashboard |
| `src/locales/en.json` | Add rank translation keys |
| `src/locales/ar.json` | Add rank translation keys |

