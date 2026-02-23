

# Deep Analysis for Daily Check-in Entries

## Problem
The "Deep Analysis" tab currently only shows survey-based analytics (from `employee_responses` + `questions`). Since there are 0 survey responses but 2+ check-in entries in `mood_entries`, the entire tab appears empty. Daily check-in data needs its own deep analysis visualizations.

## Solution
Add a **Check-in Analysis** sub-tab within the Deep Analysis tab, using data already available in `mood_entries` (mood_level, mood_score, support_actions, streak_count, entry_date, employee_id).

## New Visualizations

### 1. Mood Distribution Over Time (Stacked Area)
- Daily stacked area chart showing count of each mood level (great/good/okay/struggling/need_help) over time
- Shows emotional pulse of the organization day by day

### 2. Support Actions Analysis (Horizontal Bar)
- Aggregates `support_actions` JSONB array from mood_entries
- Shows which support types employees request most (e.g., "talk_to_someone", "resources", "time_off")
- Helps management understand what employees need

### 3. Streak & Engagement Depth (Distribution Bar)
- Histogram of streak lengths across employees
- Shows how many employees have 1-day, 2-3 day, 4-7 day, 7+ day streaks
- Measures engagement depth beyond simple participation rate

### 4. Mood Score by Org Unit (Grouped Bar)
- Average check-in mood score broken down by department/branch
- Identifies which org units are struggling vs thriving based on daily mood data

### 5. Check-in Completion Heatmap
- Day-of-week x time-of-day heatmap for when check-ins happen
- Already partially exists in the Comparison tab but will be scoped to check-in only

## Architecture

### Data Layer Changes (`src/hooks/useOrgAnalytics.ts`)
- Add new fields to `OrgAnalyticsData` interface:
  - `checkinMoodOverTime`: daily mood level counts for stacked chart
  - `supportActionCounts`: aggregated support action frequencies
  - `streakDistribution`: histogram of streak buckets
  - `checkinByOrgUnit`: mood scores per department/branch from mood_entries
- Compute these from the already-fetched `entries` array (no extra queries needed for most)
- `support_actions` requires fetching the JSONB column (one additional select field)

### New Components
- `src/components/dashboard/CheckinMoodOverTime.tsx` -- Stacked area chart
- `src/components/dashboard/SupportActionsChart.tsx` -- Horizontal bar chart  
- `src/components/dashboard/StreakDistribution.tsx` -- Histogram bar chart
- `src/components/dashboard/CheckinByOrgUnit.tsx` -- Grouped bar comparing departments

### Dashboard Layout (`src/components/dashboard/OrgDashboard.tsx`)
- Split the Deep Analysis tab into two sub-tabs using nested Tabs:
  - **Survey Analysis** -- existing survey-driven components (CategoryTrendCards, CategoryMoodMatrix, SubcategoryRiskBubble, MoodByCategoryTrend, SubcategoryChart)
  - **Check-in Analysis** -- new check-in components (CheckinMoodOverTime, SupportActionsChart, StreakDistribution, CheckinByOrgUnit)

### Localization (`src/locales/en.json` and `src/locales/ar.json`)
- Add keys under `orgDashboard`:
  - `tabs.surveyAnalysis` / `tabs.checkinAnalysis`
  - `checkinMoodOverTime`, `supportActions`, `streakDistribution`, `checkinByOrgUnit`
  - Support action labels (e.g., `supportAction.talk_to_someone`, etc.)
  - Streak bucket labels

## Technical Details

### Data Computation (in useOrgAnalytics.ts)

**Mood Over Time** -- computed from existing `entries` array:
```text
Group entries by entry_date + mood_level -> daily counts per mood level
```

**Support Actions** -- requires adding `support_actions` to the mood_entries select:
```text
Flatten all support_actions arrays -> count frequency of each action key
```

**Streak Distribution** -- computed from existing streak calculation:
```text
Bucket employee streaks into: 0, 1-2, 3-5, 6-10, 11+ -> count per bucket
```

**Check-in by Org Unit** -- join entries with employees (already fetched in orgComparison):
```text
Group entries by employee department/branch -> avg mood_score per unit
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/dashboard/CheckinMoodOverTime.tsx` | Stacked area chart of mood levels over time |
| `src/components/dashboard/SupportActionsChart.tsx` | Horizontal bar of support action frequencies |
| `src/components/dashboard/StreakDistribution.tsx` | Histogram of streak lengths |
| `src/components/dashboard/CheckinByOrgUnit.tsx` | Avg mood by department/branch bars |

### Files to Modify
| File | Change |
|------|--------|
| `src/hooks/useOrgAnalytics.ts` | Add support_actions to query, compute 4 new data fields |
| `src/components/dashboard/OrgDashboard.tsx` | Split Deep Analysis into Survey/Check-in sub-tabs |
| `src/locales/en.json` | Add ~15 new translation keys |
| `src/locales/ar.json` | Add ~15 new Arabic translation keys |

