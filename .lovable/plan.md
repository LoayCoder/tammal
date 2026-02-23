

# Enhanced Organization Wellness Analytics Dashboard

## Overview

Transform the existing Organization Wellness module from a basic metrics display into a strategic intelligence platform with advanced analytics, AI-powered insights, cross-dimensional analysis, and executive decision-support tools.

## Current State

The dashboard currently has:
- 6 KPI cards (Active Employees, Wellness Score, Participation, Survey Response, Risk, Streak)
- Engagement Trend (dual-axis: mood avg + response volume)
- Risk Trend with threshold line
- Category Health (horizontal bars)
- Subcategory Deep Dive (horizontal bars)
- Affective State Distribution (donut chart)
- Org Comparison (Branch/Division/Department/Section tabs)
- Top Engagers leaderboard
- Response Heatmap (day-of-week)
- Filtering by org unit + time range

## What Will Be Added

### Section 1: Executive Summary Panel (New Component)

A collapsible top section with:
- **Overall Health Score**: Weighted composite of mood, participation, and risk (0-100 scale with color-coded gauge)
- **Period-over-Period Comparison**: Delta arrows showing improvement/decline vs previous period
- **Top 3 Critical Alerts**: Auto-generated from risk scoring algorithm (e.g., "Burnout Indicators in Engineering declining 15% over 2 weeks")
- **AI-Powered Recommendations**: 3-5 actionable items generated via Lovable AI (using gemini-2.5-flash) based on current data patterns

### Section 2: Category x Mood Cross-Analysis (New Component)

A **heatmap matrix** showing:
- Rows = Categories (e.g., Burnout Indicators, Job Satisfaction)
- Columns = Mood levels (Great, Good, Okay, Struggling, Need Help)
- Cell values = Response count or avg score, color-coded by intensity
- Click a cell to drill down into subcategory details for that Category+Mood intersection

### Section 3: Category Trend Analysis (New Component)

- **Sparkline cards per category**: Each category gets a mini trend line showing score trajectory over the selected period
- **Risk Score per Category**: Computed as weighted combination of (avg score inversion + decline rate + volume of negative responses)
- **Priority ranking**: Categories sorted by risk score, with badges: "Critical", "Watch", "Stable", "Improving"

### Section 4: Subcategory Risk Matrix (New Component)

- **Bubble chart**: X-axis = avg score, Y-axis = response volume, bubble size = decline rate
- Subcategories in the "high volume + low score + declining" quadrant are flagged
- Color-coded by parent category

### Section 5: Mood Trend by Category (Enhanced)

- **Stacked area chart**: Shows mood distribution breakdown over time per selected category
- Dropdown selector to pick a category and see how mood composition changes daily/weekly

### Section 6: Early Warning Indicators (New Component)

Algorithm-driven alerts that detect:
- **Consecutive decline**: 3+ consecutive days of declining avg score in any category
- **Spike detection**: Sudden increase in "Struggling" or "Need Help" entries (>2x standard deviation)
- **Participation drop**: Department participation falling below 30%
- **Pattern recurrence**: Same category flagged as critical in 2+ consecutive periods

Each alert shows: severity badge, affected area, trend mini-chart, and suggested action.

### Section 7: AI Strategic Insights (New Edge Function + Component)

A dedicated card that calls an edge function `generate-wellness-insights` which:
- Takes the aggregated analytics data as input
- Uses Lovable AI (gemini-2.5-flash) to generate:
  - Natural language executive summary
  - Priority-ranked intervention recommendations
  - Predicted risk areas for next period
  - Suggested team-level actions
- Results are cached per tenant per day to avoid repeated API calls

### Section 8: Enhanced Existing Charts

- **Category Health**: Add trend arrows (up/down) comparing to previous period
- **Org Comparison**: Add a "highlight below average" toggle that visually flags underperforming units
- **Response Heatmap**: Expand to full week x hour grid (7 days x time-of-day buckets)

---

## Technical Implementation Plan

### Step 1: Extend the Analytics Hook (`useOrgAnalytics.ts`)

Add new computed fields to `OrgAnalyticsData`:
- `categoryTrends`: Per-category daily trend data (date, category_id, avgScore, count)
- `categoryMoodMatrix`: Cross-tabulation of category x mood level (category_id, mood_level, count, avgScore)
- `categoryRiskScores`: Risk score per category (id, name, riskScore, trend, status)
- `subcategoryRiskMatrix`: Bubble data (id, name, avgScore, responseCount, declineRate, categoryColor)
- `earlyWarnings`: Array of detected warning objects
- `periodComparison`: Delta values comparing current period vs previous equivalent period
- `compositeHealthScore`: Single 0-100 number

The additional queries will:
- Fetch mood_entries grouped by category (via question_id -> questions -> category_id) for mood pathway answers stored in `answer_value.pathway`
- Compute previous-period equivalents for delta calculations
- Run early warning detection algorithms client-side on the fetched data

### Step 2: Create New Dashboard Components

| Component | File | Purpose |
|-----------|------|---------|
| ExecutiveSummary | `src/components/dashboard/ExecutiveSummary.tsx` | Health score gauge, deltas, alerts, AI recommendations |
| CategoryMoodMatrix | `src/components/dashboard/CategoryMoodMatrix.tsx` | Heatmap cross-analysis grid |
| CategoryTrendCards | `src/components/dashboard/CategoryTrendCards.tsx` | Sparkline cards with risk ranking |
| SubcategoryRiskBubble | `src/components/dashboard/SubcategoryRiskBubble.tsx` | Scatter/bubble chart |
| MoodByCategoryTrend | `src/components/dashboard/MoodByCategoryTrend.tsx` | Stacked area with category selector |
| EarlyWarningPanel | `src/components/dashboard/EarlyWarningPanel.tsx` | Alert cards with severity badges |
| AIInsightsCard | `src/components/dashboard/AIInsightsCard.tsx` | AI-generated strategic text |

### Step 3: Create Edge Function for AI Insights

`supabase/functions/generate-wellness-insights/index.ts`:
- Accepts aggregated stats JSON
- Calls Lovable AI (gemini-2.5-flash) with a structured prompt
- Returns executive summary, recommendations, and predictions
- Includes CORS headers and auth validation

### Step 4: Create AI Insights Cache Table

New table `wellness_insight_cache`:
- `id`, `tenant_id`, `insight_date` (date), `insight_data` (jsonb), `created_at`
- RLS: tenant isolation + super admin access
- One insight per tenant per day

### Step 5: Update OrgDashboard Layout

Reorganize `OrgDashboard.tsx` to add tabs for different analytical views:
- **Overview** tab: KPIs + Executive Summary + Engagement Trend + Risk Trend (existing + new)
- **Deep Analysis** tab: Category Trends + Category x Mood Matrix + Subcategory Risk Bubble
- **Alerts & Insights** tab: Early Warning Panel + AI Strategic Insights
- **Comparison** tab: Org Comparison + Mood Distribution + Top Engagers + Heatmap (existing)

### Step 6: Localization

Add all new translation keys to both `en.json` and `ar.json` under the `orgDashboard` namespace.

### Step 7: Risk Scoring Algorithm

Implemented client-side in a utility function:

```text
Risk Score = (5 - avgScore) * 20              // Inversion weight (0-80)
           + declineRate * 10                  // Trend penalty (0-20)  
           + (negativeRatio > 0.3 ? 10 : 0)   // High negative flag

Status mapping:
  >= 60: "Critical"
  >= 40: "Watch"  
  >= 20: "Stable"
  < 20:  "Improving"
```

### Step 8: Early Warning Detection Algorithm

```text
For each category over the time window:
  1. Compute 3-day moving average
  2. If 3+ consecutive declining points -> "Declining Trend" warning
  3. If today's negative count > mean + 2*stddev -> "Spike Detected" warning
  4. If department participation < 30% -> "Low Engagement" warning
  5. If category was "Critical" in previous period too -> "Recurring Risk" warning
```

---

## Data Flow

```text
mood_entries (mood_level, mood_score, entry_date, employee_id)
     |
     +-- mood pathway answers in answer_value.pathway[].theme (links to question text)
     |
employee_responses (question_id, answer_value, employee_id)
     |
     +-- question_id -> questions (category_id, subcategory_id, mood_levels, affective_state)
     |
     +-- category_id -> question_categories (name, color)
     |
     +-- subcategory_id -> question_subcategories (name, color, category_id)
     |
     v
useOrgAnalytics (computes all metrics client-side)
     |
     v
OrgDashboard (tabbed layout with all visualization components)
     |
     +-- generate-wellness-insights edge function (AI analysis)
```

## Files to Create
- `src/components/dashboard/ExecutiveSummary.tsx`
- `src/components/dashboard/CategoryMoodMatrix.tsx`
- `src/components/dashboard/CategoryTrendCards.tsx`
- `src/components/dashboard/SubcategoryRiskBubble.tsx`
- `src/components/dashboard/MoodByCategoryTrend.tsx`
- `src/components/dashboard/EarlyWarningPanel.tsx`
- `src/components/dashboard/AIInsightsCard.tsx`
- `src/lib/wellnessAnalytics.ts` (risk scoring + early warning algorithms)
- `src/hooks/useWellnessInsights.ts` (AI insights hook with caching)
- `supabase/functions/generate-wellness-insights/index.ts`

## Files to Modify
- `src/hooks/useOrgAnalytics.ts` (extend with new computed fields)
- `src/components/dashboard/OrgDashboard.tsx` (tabbed layout, new components)
- `src/components/dashboard/CategoryHealthChart.tsx` (add trend arrows)
- `src/components/dashboard/OrgComparisonChart.tsx` (add below-average highlighting)
- `src/locales/en.json` (new keys)
- `src/locales/ar.json` (new keys)

## Database Migration
- Create `wellness_insight_cache` table with RLS policies for tenant isolation

