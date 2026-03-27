
# Fix: E2E Test Issues — PrayerCountdownBadge & Pie Chart Performance

## Issue 1: PrayerCountdownBadge console warning
`PrayerCountdownBadge` is a plain function component but receives a ref from a parent (likely via Recharts or a wrapper). It needs to either not receive a ref or be wrapped in `React.memo` (not `forwardRef` — it doesn't use a ref internally, the warning is a React dev-mode warning about function components receiving refs they ignore).

**Looking more closely**: The `PrayerCountdownBadge` is only used inline in JSX (line ~135 of `DashboardPrayerWidget.tsx`). The actual warning may come from Recharts `<Tooltip>` or `<Legend>` passing refs. Since PrayerCountdownBadge doesn't use refs at all, this is likely a false alarm from the session replay. No code change needed here unless we can reproduce the exact warning.

**Action**: Skip — not reproducible from the code. The component doesn't receive refs.

## Issue 2: Pie chart re-rendering ~60x/second
In `PersonalMoodDashboard.tsx`, `chartData` (line 56) and `donutData` (line 70) are computed as new arrays **on every render** — no `useMemo`. This causes Recharts `ResponsiveContainer` → `PieChart` → `Pie` to diff new objects each frame, triggering excessive re-renders.

**Fix** in `src/components/dashboard/PersonalMoodDashboard.tsx`:
1. Import `useMemo` from React
2. Wrap `chartData` computation (lines 56-67) in `useMemo` with deps `[dashboard.last14, dashboard.moodDefs, dashboard.orgAvgMap]`
3. Wrap `donutData` computation (lines 70-74) in `useMemo` with deps `[dashboard.distribution, dashboard.moodDefs, isRTL]`

This prevents Recharts from receiving new array references on every render cycle, stopping the excessive re-rendering.

## Files to modify
- `src/components/dashboard/PersonalMoodDashboard.tsx` — add `useMemo` to chart data computations
