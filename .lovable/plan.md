

# Three-Layer Intelligence Comparison Engine

## Overview

Transform the existing Comparison tab from a simple org-unit bar chart into a three-layer intelligence dashboard: Check-In Pulse Analytics, Survey Structural Analytics, and a Synthesis Engine that computes divergence between the two.

All computation happens client-side from existing data already fetched by `useOrgAnalytics`. No new database tables or edge functions are needed for Phase 1 -- the synthesis engine is a pure TypeScript utility that consumes processed analytics from the two separate pipelines. Workflow separation remains intact: no raw table joins between `mood_entries` and `employee_responses`.

---

## Architecture

```text
mood_entries (Check-In)          employee_responses (Survey)
       |                                    |
useOrgAnalytics hook             useOrgAnalytics hook
(entries array)                  (catResponses, categoryScores)
       |                                    |
  checkinPulse()                   surveyStructural()
       |                                    |
       +----------> synthesisEngine() <-----+
                         |
              BAI Score, Divergence,
              Risk Classification,
              Alerts, Trend Overlay
```

No raw data crosses between pipelines. The synthesis engine only receives pre-computed summary metrics.

---

## What Gets Built

### Layer 1: Check-In Pulse Card (KPI Card)
Displays four metrics computed from `mood_entries`:
- **Mood Volatility Index**: Standard deviation of daily average mood scores over the last 14 days
- **Participation Stability**: Coefficient of variation of daily check-in counts (low = stable)
- **Energy Trend**: Direction arrow comparing last 7 days avg mood vs previous 7 days
- **Top Emotion Cluster**: Most frequent mood_level in the period

### Layer 2: Survey Structural Card (KPI Card)
Displays four metrics computed from `employee_responses` + `question_categories`:
- **Category Health Score**: Weighted average across all category scores
- **Lowest Performing Category**: Category with lowest avgScore
- **Survey Participation Quality**: Response rate (already computed as `surveyResponseRate`)
- **Risk Category Count**: Number of categories in "critical" or "watch" status

### Layer 3: Synthesis Engine Card
Computes cross-layer intelligence:
- **Behavioral Alignment Index (BAI)**: `1 - abs(normalize(checkinAvg) - normalize(surveyAvg))` where both are normalized to 0-1 scale
- **Divergence Level**: High Alignment (>0.75), Moderate (0.5-0.75), Significant (<0.5)
- **Risk Classification Badge**: Color-coded (Green/Yellow/Orange/Red)
- **Confidence Score**: Based on sample size and participation rates
- **Recommended Action**: Text suggestion based on divergence pattern

### Divergence Heatmap
Department-level grid showing BAI scores per department with color coding:
- Green: BAI > 0.75
- Yellow: 0.5-0.75
- Orange: 0.3-0.5
- Red: < 0.3

Privacy guard: departments with < 5 employees show "Insufficient Data"

### Alerts Panel
Pattern detection rules:
1. High check-in volatility + low survey safety score = "Sentiment-Structure Misalignment"
2. Dropping check-in participation + stable survey engagement = "Participation Fatigue"
3. Good check-in mood + poor survey scores = "Surface Positivity Risk"

Each alert shows: pattern name, description, confidence %, suggested intervention.

### Trend Overlay Chart
Dual-axis line chart overlaying:
- Check-in daily mood average (left axis, 1-5)
- Survey category average (right axis, 1-5)
Both on the same time axis to visually spot divergence.

---

## Privacy Rules
- No synthesis for groups < 5 employees
- No individual-level divergence
- All data is aggregated only
- Alert triggers are logged to existing `audit_logs` table via the `useAuditLog` hook

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/synthesisEngine.ts` | Pure functions: computeBAI, computeVolatility, detectDivergencePatterns, classifyRisk |
| `src/components/dashboard/comparison/CheckinPulseCard.tsx` | Layer 1 KPI card |
| `src/components/dashboard/comparison/SurveyStructuralCard.tsx` | Layer 2 KPI card |
| `src/components/dashboard/comparison/SynthesisCard.tsx` | Layer 3 BAI + divergence display |
| `src/components/dashboard/comparison/DivergenceHeatmap.tsx` | Department x Risk grid |
| `src/components/dashboard/comparison/AlertsPanel.tsx` | Pattern detection alerts |
| `src/components/dashboard/comparison/TrendOverlayChart.tsx` | Dual-axis check-in vs survey trend |

## Files to Modify

| File | Change |
|------|---------|
| `src/hooks/useOrgAnalytics.ts` | Add computed fields for pulse metrics (volatility, energy trend, top emotion), survey structural metrics, and per-department BAI data to the `OrgAnalyticsData` interface |
| `src/components/dashboard/OrgDashboard.tsx` | Replace the Comparison tab content with the new three-layer layout |
| `src/locales/en.json` | Add ~40 translation keys for all new components |
| `src/locales/ar.json` | Add ~40 Arabic translation keys |

---

## Technical Details

### Synthesis Engine (`src/lib/synthesisEngine.ts`)

```text
Volatility Index:
  dailyAvgs = entries grouped by date -> avg mood_score per day
  volatility = stddev(last 14 dailyAvgs)
  Flag if volatility > 1.0

BAI Calculation:
  checkinNorm = (avgMoodScore - 1) / 4   // normalize 1-5 to 0-1
  surveyNorm = (weightedCatAvg - 1) / 4  // normalize 1-5 to 0-1
  BAI = 1 - abs(checkinNorm - surveyNorm)

Confidence Score:
  factors = [
    min(checkinParticipation / 60, 1) * 0.3,
    min(surveyResponseRate / 60, 1) * 0.3,
    min(totalEntries / 30, 1) * 0.2,
    min(totalResponses / 20, 1) * 0.2,
  ]
  confidence = sum(factors) * 100

Divergence Rules (require minimumSampleSize >= 5, participationRate >= 60%):
  Rule 1: volatility > 1.0 AND lowestCatScore < 2.5
    -> "Sentiment-Structure Misalignment"
  Rule 2: participationDrop > 40% AND surveyResponseRate stable
    -> "Participation Fatigue"
  Rule 3: avgMoodScore > 3.5 AND weightedCatAvg < 2.5
    -> "Surface Positivity Risk"
```

### Data Flow in `useOrgAnalytics.ts`

New fields added to `OrgAnalyticsData`:
```text
checkinPulse: {
  volatilityIndex: number
  participationStability: number
  energyTrend: 'up' | 'down' | 'stable'
  topEmotionCluster: string
}
surveyStructural: {
  categoryHealthScore: number
  lowestCategory: { name: string, score: number } | null
  participationQuality: number
  riskCategoryCount: number
}
synthesisData: {
  baiScore: number
  divergenceLevel: 'high_alignment' | 'moderate' | 'significant'
  riskClassification: 'green' | 'yellow' | 'orange' | 'red'
  confidenceScore: number
  recommendedAction: string
  alerts: DivergenceAlert[]
  departmentBAI: DepartmentBAIItem[]
}
```

All computed from existing `entries`, `categoryScores`, `categoryRiskScores`, `orgComparison`, `surveyResponseRate`, and `participationRate` -- no additional database queries.

### Comparison Tab Layout

```text
---------------------------------------------
| Check-In Pulse   | Survey Structural       |
| (4 KPIs)         | (4 KPIs)                |
---------------------------------------------
| Synthesis Summary (BAI, Divergence, Risk,  |
| Confidence, Action)                         |
---------------------------------------------
| Divergence Heatmap (Dept x Risk Color)     |
---------------------------------------------
| Alerts Panel (Pattern + Intervention)      |
---------------------------------------------
| Trend Overlay (Check-In vs Survey lines)   |
---------------------------------------------
```

The existing `OrgComparisonChart`, `TopEngagersCard`, `ResponseHeatmap`, and mood distribution chart remain available and are moved into an "Org Breakdown" collapsible section below the new intelligence layer.

