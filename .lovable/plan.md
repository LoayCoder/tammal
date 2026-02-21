

# Enhanced Dashboard: Risk Tracking, Comparative Analysis, and Top Engagers

## Overview

Three major additions to the Organization Wellness Dashboard:

1. **Risk Trend Chart** -- A time-series line chart tracking the percentage of "at-risk" mood entries (score <= 2) over time, with a configurable threshold/limit line so management can see when risk crosses acceptable levels
2. **Comparative Analysis** -- Side-by-side bar charts comparing wellness scores, participation, and risk across Branches, Divisions, Departments, and Sections
3. **Top Engaged Employees** -- A leaderboard showing the most consistent employees by daily check-in streaks and survey response counts (anonymized by showing only first name + department, not full identity)

All three sections respect the existing time range selector (7/30/90/custom) and org filters.

---

## Section 1: Risk Trend Over Time

A dedicated line chart showing how risk evolves day-by-day:

- **Y-axis**: Risk percentage (% of mood entries with score <= 2)
- **X-axis**: Date labels (same as engagement trend)
- **Threshold line**: A horizontal reference line at a configurable value (default 20%) labeled "Limit" -- when the risk line crosses above this, it signals an organizational concern
- **Color**: Red area fill when above the threshold, green when below
- **Data source**: Already available in `mood_entries` -- group by `entry_date`, calculate `count(score<=2) / total_count * 100` per day

---

## Section 2: Comparative Org Unit Analysis

A new component that shows a grouped bar chart comparing org units side-by-side:

- **Tabs**: Branch | Division | Department | Section (user picks which dimension to compare)
- **Metrics per unit**: Average Wellness Score, Participation Rate, Risk %
- **Reference lines**: A dashed horizontal line showing the org-wide average for each metric, so management can instantly see which units are above/below average
- **Color coding**: Units below the org average are colored red/amber, above average are green/blue
- **Data source**: Query `mood_entries` joined with `employees` (which has `branch_id`, `department_id`, `section_id`), group by the selected org dimension

---

## Section 3: Top Engaged Employees Leaderboard

A compact table/card list showing the top 10 most engaged employees:

- **Columns**: Rank, Name (first name only for privacy), Department, Check-in Streak (consecutive days), Survey Responses (count), Total Points
- **Data source**: `mood_entries` grouped by `employee_id` for streak calculation, `employee_responses` count, joined with `employees` for name/department
- **Privacy note**: Shows only first name and department -- no email, no full name, no raw mood data. This is engagement recognition, not surveillance
- **Sorted by**: Longest current streak, then by total response count as tiebreaker

---

## Technical Implementation

### File: `src/hooks/useOrgAnalytics.ts`

Add three new data fields to `OrgAnalyticsData`:

```text
riskTrend: { date: string; riskPct: number; totalEntries: number }[]
orgComparison: {
  branches: { id: string; name: string; avgScore: number; participation: number; riskPct: number; employeeCount: number }[]
  divisions: { id: string; name: string; avgScore: number; participation: number; riskPct: number; employeeCount: number }[]
  departments: { id: string; name: string; avgScore: number; participation: number; riskPct: number; employeeCount: number }[]
  sections: { id: string; name: string; avgScore: number; participation: number; riskPct: number; employeeCount: number }[]
}
topEngagers: { employeeId: string; firstName: string; department: string; streak: number; responseCount: number; totalPoints: number }[]
```

**Risk Trend**: Computed from the existing `entries` array -- group by date, calculate daily risk percentage.

**Org Comparison**: Four parallel queries grouping `mood_entries` by each org dimension through the `employees` table. For each unit: avg mood score, unique participants / total employees, and % of entries with score <= 2.

**Top Engagers**: Query `mood_entries` grouped by `employee_id` with streak calculation (reuse existing streak logic), plus count from `employee_responses`. Join with `employees` for first name and department. Limit to top 10.

### File: `src/components/dashboard/RiskTrendChart.tsx` (NEW)

- Line chart with Recharts `ComposedChart`
- Area fill below the line colored with a gradient (green below threshold, red above)
- `ReferenceLine` component at the threshold value (default 20%)
- Tooltip showing date, risk %, and entry count

### File: `src/components/dashboard/OrgComparisonChart.tsx` (NEW)

- Tabbed interface (Branch/Division/Department/Section)
- Grouped vertical `BarChart` with three bars per unit (Wellness, Participation, Risk)
- `ReferenceLine` for org-wide average on each metric
- Color-coded bars: below-average units highlighted in amber/red
- Responsive: stacks to horizontal bars on mobile

### File: `src/components/dashboard/TopEngagersCard.tsx` (NEW)

- Simple table inside a Card
- Columns: Rank (with medal icons for top 3), First Name, Department, Streak, Responses
- Shows "No data" when empty
- Respects time range and org filters

### File: `src/components/dashboard/OrgDashboard.tsx`

Add the three new sections:
- Risk Trend Chart after the Engagement Trend
- Org Comparison Chart after Category Health
- Top Engagers Card in the bottom row alongside the Mood Distribution

### File: `src/locales/en.json` and `src/locales/ar.json`

New translation keys:
- `orgDashboard.riskTrend`, `orgDashboard.riskThreshold`, `orgDashboard.riskPct`
- `orgDashboard.orgComparison`, `orgDashboard.compareBy`
- `orgDashboard.compareTabs.branch`, `compareTabs.division`, `compareTabs.department`, `compareTabs.section`
- `orgDashboard.orgAverage`, `orgDashboard.wellnessScore`, `orgDashboard.belowAverage`
- `orgDashboard.topEngagers`, `orgDashboard.rank`, `orgDashboard.streak`, `orgDashboard.responses`
- `orgDashboard.limit`, `orgDashboard.aboveThreshold`

---

## Files Summary

| Action | File |
|---|---|
| Modify | `src/hooks/useOrgAnalytics.ts` -- add riskTrend, orgComparison, topEngagers data |
| New | `src/components/dashboard/RiskTrendChart.tsx` -- risk over time with threshold line |
| New | `src/components/dashboard/OrgComparisonChart.tsx` -- side-by-side org unit comparison |
| New | `src/components/dashboard/TopEngagersCard.tsx` -- top 10 engaged employees |
| Modify | `src/components/dashboard/OrgDashboard.tsx` -- wire new sections |
| Modify | `src/locales/en.json` -- new translation keys |
| Modify | `src/locales/ar.json` -- new translation keys |

---

## Privacy Safeguards

- **Top Engagers** shows only first name and department name -- no email, user ID, or mood data is exposed
- All comparative data remains aggregated (AVG, COUNT, GROUP BY) at the org-unit level
- Risk trend shows organization-wide percentages, not individual entries
- The leaderboard is strictly about engagement (participation frequency), not emotional state

