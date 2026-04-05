

## Fix Remaining Gap: Wire Trend Indicators into Executive KPI Row

### Problem
The `useWorkloadTrends` hook and `TrendIndicator` component were created but never wired into the Executive Dashboard. The KPI cards show raw numbers without week-over-week trend arrows.

### Fix

**1. Update `ExecutiveKPIRow` to accept and render trend data**

- Add optional `trends` prop with `WorkloadTrend` type
- Render `TrendIndicator` below each KPI value showing week-over-week change
- Map: strategicProgress → currentCompletion/previousCompletion, utilization → currentUtilization/previousUtilization, burnoutRisk (higherIsBetter=false) → currentBurnoutCount/previousBurnoutCount, completionRate → currentVelocity/previousVelocity

**Files**: Edit `src/features/workload/components/executive/ExecutiveKPIRow.tsx`

**2. Wire `useWorkloadTrends` into `ExecutiveDashboard`**

- Import and call `useWorkloadTrends()` in `ExecutiveDashboard.tsx`
- Pass `trends.data` to `ExecutiveKPIRow`

**Files**: Edit `src/pages/admin/ExecutiveDashboard.tsx`

### Summary
2 files edited, 0 new files. Adds week-over-week trend arrows (↑+12%, ↓-5%) to all 4 Executive KPI cards.

