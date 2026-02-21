

# Enhanced Organization Wellness Dashboard

## Current State

The Wellness Dashboard currently shows only **basic mood check-in data** from the `mood_entries` table:
- 4 stat cards (active employees, wellness score, participation, check-in count)
- 2 charts (7-day engagement trend, mood distribution bar chart)

It completely **ignores** the rich survey response data from `employee_responses` which, combined with the `questions` table, carries category, subcategory, affective state, and mood score metadata -- the exact analytical fields we just built in the previous enhancement.

---

## What We Will Build

The dashboard will be restructured into a **scrollable analytics page** with the following sections:

### Section 1: Enhanced KPI Cards (Row of 6)

Keep the existing 4 cards and add 2 new ones:

| Card | Data Source | Logic |
|---|---|---|
| Active Employees | `employees` | Count where status = active (existing) |
| Team Wellness Score | `mood_entries` | Average mood_score last 30 days (extended from 7) |
| Participation Rate | `mood_entries` + `employees` | Unique participants / total active (existing) |
| Survey Response Rate | `scheduled_questions` + `employee_responses` | Answered / total delivered |
| Risk Indicator | `mood_entries` | % of entries with mood_score <= 2 (struggling + need_help) |
| Engagement Streak | `mood_entries` | Average consecutive days with check-ins per employee |

### Section 2: Time Range Selector

A simple toggle bar: **7 days / 30 days / 90 days** that controls all charts below. Default: 30 days.

### Section 3: Engagement Trend (Enhanced)

Keep the existing area chart but:
- Extend to support 7/30/90 day ranges
- Add a second line showing **daily response count** (right Y-axis) alongside the mood average (left Y-axis)
- This shows both "how employees feel" and "how many are participating" in one view

### Section 4: Category Health Radar

A **horizontal bar chart** showing the average wellness score per **main category** (e.g., Work-Life Balance, Burnout Indicators, Job Satisfaction, etc.).

- Data: JOIN `employee_responses` with `questions` and `question_categories`
- Aggregation: AVG of `answer_value` (numeric) grouped by category
- Color: Each bar uses the category's `color` field
- Sorted by score ascending (worst categories at top for quick identification)

### Section 5: Subcategory Deep Dive

A **grouped bar chart** showing average scores per **subcategory**, grouped under their parent category.

- Data: Same join as above but grouped by `subcategory_id`
- Only shown when there is subcategory data
- Provides the "drill-down" view the user requested

### Section 6: Affective State Distribution

A **stacked bar chart** (or pie chart) showing the distribution of responses across the three affective states: Positive, Neutral, Negative.

- Data: COUNT of `employee_responses` grouped by `questions.affective_state`
- Color: Green (positive), Gray (neutral), Red (negative)
- Gives management a quick read on the "emotional pulse" of the organization

### Section 7: Mood Distribution (Enhanced)

Keep the existing mood distribution bar chart but enhance it to:
- Show the selected time range (not just 7 days)
- Add percentage labels on each bar

### Section 8: Response Activity Heatmap (Simple Grid)

A compact 7-column grid (one per weekday) showing response volume by day-of-week, helping identify engagement patterns (e.g., low Sundays, peak Tuesdays).

---

## Technical Implementation

### New Hook: `useOrgAnalytics.ts`

A new hook that fetches all analytical data in parallel queries. It accepts a `timeRange` parameter (7, 30, 90 days).

```text
Queries:
1. mood_entries (filtered by date range) -- mood trend + distribution
2. employee_responses JOIN questions JOIN question_categories -- category scores
3. employee_responses JOIN questions JOIN question_subcategories -- subcategory scores
4. employee_responses JOIN questions (affective_state) -- affective distribution
5. scheduled_questions (status counts) -- survey response rate
6. employees (active count) -- baseline
```

All queries use aggregated data only (COUNT, AVG, GROUP BY) -- no individual employee data is exposed, maintaining the privacy architecture.

### Modified Component: `OrgDashboard.tsx`

Complete rewrite with the new sections. The component will:
- Import the new `useOrgAnalytics` hook
- Render the time range selector
- Render all chart sections with proper loading states
- Use existing Recharts components (AreaChart, BarChart, RadarChart)

### New Sub-Components

| Component | Purpose |
|---|---|
| `TimeRangeSelector.tsx` | 7/30/90 day toggle |
| `CategoryHealthChart.tsx` | Horizontal bar chart for category scores |
| `SubcategoryChart.tsx` | Grouped bar chart for subcategory drill-down |
| `AffectiveStateChart.tsx` | Stacked/pie chart for emotional pulse |
| `ResponseHeatmap.tsx` | Day-of-week activity grid |

### Localization

New keys in `en.json` and `ar.json` under `orgDashboard`:
- `surveyResponseRate`, `riskIndicator`, `engagementStreak`
- `timeRange.7d`, `timeRange.30d`, `timeRange.90d`
- `categoryHealth`, `subcategoryDrilldown`, `affectiveDistribution`
- `responseHeatmap`, `affective.positive`, `affective.neutral`, `affective.negative`
- `riskLevel`, `noSurveyData`

---

## Files to Create / Modify

| Action | File |
|---|---|
| New | `src/hooks/useOrgAnalytics.ts` |
| New | `src/components/dashboard/TimeRangeSelector.tsx` |
| New | `src/components/dashboard/CategoryHealthChart.tsx` |
| New | `src/components/dashboard/SubcategoryChart.tsx` |
| New | `src/components/dashboard/AffectiveStateChart.tsx` |
| New | `src/components/dashboard/ResponseHeatmap.tsx` |
| Rewrite | `src/components/dashboard/OrgDashboard.tsx` |
| Modify | `src/locales/en.json` |
| Modify | `src/locales/ar.json` |

---

## Privacy Compliance

All data remains **aggregated**. The hook only uses SQL-level `COUNT`, `AVG`, and `GROUP BY`. No individual employee names, raw answers, or specific mood entries are ever fetched -- consistent with the established privacy architecture documented in the project memory.
