

# Phase 2 — AI-Powered Workload Intelligence

## Current State

**Already exists:**
- 4 analytics tables: `execution_velocity_metrics`, `strategic_alignment_metrics`, `workload_heatmap_metrics`, `initiative_risk_metrics`
- `workload-intelligence` edge function with `predict_delays` and `suggest_redistribution` (rule-based)
- `workload-analytics` edge function with velocity/heatmap/risk/alignment snapshots
- Executive Dashboard with KPI cards, heatmap, risk radar, burnout map
- `LOVABLE_API_KEY` secret available for Lovable AI Gateway

**Does NOT exist:**
- `burnout_predictions` table
- `redistribution_recommendations` table
- AI-powered burnout prediction (current burnout is rule-based score only)
- AI-powered completion forecasting
- AI-enhanced redistribution with reasoning
- Organizational Intelligence Score (TAMMAL Index)
- Scheduled data pipeline for AI predictions

---

## Implementation Plan

### Task 1: Create 2 New Tables (Migration)

**a) `burnout_predictions`**
- id, tenant_id, employee_id, burnout_probability_score (0-100), indicators (jsonb — utilization, escalation_frequency, late_night_work, overdue_streak), predicted_at, confidence_score, ai_reasoning (text), created_at, deleted_at
- RLS via `current_tenant_id()`

**b) `redistribution_recommendations`**
- id, tenant_id, from_employee_id, to_employee_id, action_id (nullable), reason (text), priority, capacity_diff, skill_match_score, status (pending/accepted/rejected/expired), ai_reasoning (text), created_at, updated_at, deleted_at
- RLS via `current_tenant_id()`

Both tables get composite indexes on `(tenant_id, created_at DESC)`.

### Task 2: Create `workload-ai` Edge Function

A new edge function using Lovable AI Gateway (`google/gemini-3-flash-preview`) for three AI actions:

**a) `predict_burnout`** — Gathers per-employee signals (utilization %, escalation count, off-hours sessions, overdue task count, consecutive overdue days) and asks the AI to return a structured burnout probability score with reasoning. Persists to `burnout_predictions`.

**b) `forecast_completion`** — For each active initiative, sends historical velocity data, remaining tasks, team capacity, and overdue rates. AI returns `predicted_completion_date` and `confidence_score`. Updates `initiative_risk_metrics` with the forecast.

**c) `smart_redistribute`** — Sends overloaded/underloaded employee pairs with their task lists, priorities, and estimated hours. AI suggests specific task reassignments with reasoning. Persists to `redistribution_recommendations`.

All three use structured output via tool calling (not raw JSON) for reliable parsing.

### Task 3: Compute Organizational Intelligence Score

Add a `compute_org_score` action to the existing `workload-analytics` edge function. Formula:

```
tammal_index = (alignment_score × 0.25) + (velocity_normalized × 0.25) +
               (capacity_balance × 0.25) + ((100 - avg_burnout_risk) × 0.25)
```

Persist to a new row in a lightweight `org_intelligence_scores` table (tenant_id, score, components jsonb, snapshot_date). Displayed on Executive Dashboard.

### Task 4: Create Frontend Hooks

- `useBurnoutPredictions()` — Fetches from `burnout_predictions`, returns latest predictions per employee
- `useRedistributionRecommendations()` — Fetches from `redistribution_recommendations` with accept/reject mutations
- `useOrgIntelligenceScore()` — Fetches latest TAMMAL Index for the tenant
- Add `useRunAIPredictions()` mutation to trigger AI predictions manually

### Task 5: Enhance Executive Dashboard

Add 3 new sections:

1. **TAMMAL Index** — Large gauge/radial showing the organizational intelligence score with 4 component breakdowns
2. **AI Burnout Predictions** — Cards showing employees with high predicted burnout probability, with AI reasoning tooltips
3. **Smart Redistribution** — List of AI-suggested task moves with Accept/Reject buttons and impact preview

### Task 6: Schedule AI Pipeline (pg_cron)

| Job | Frequency | Edge Function |
|-----|-----------|--------------|
| Workload analytics | Hourly | `workload-analytics` (all 4 actions) |
| Risk scoring | Hourly | `workload-analytics` → `compute_initiative_risk` |
| AI predictions | Daily (2 AM) | `workload-ai` → `predict_burnout` + `forecast_completion` + `smart_redistribute` |
| Org score | Daily (3 AM) | `workload-analytics` → `compute_org_score` |

### Task 7: i18n Keys

Add translation keys for burnout predictions, redistribution recommendations, TAMMAL Index, AI reasoning labels in both `en.json` and `ar.json`.

---

## Execution Order

1. Migration: Create `burnout_predictions`, `redistribution_recommendations`, `org_intelligence_scores` tables with RLS
2. Edge function: `workload-ai` with 3 AI actions using Lovable AI Gateway
3. Extend `workload-analytics` with `compute_org_score` action
4. Frontend hooks: 4 new hooks
5. UI: Executive Dashboard enhancements
6. Cron: Schedule AI pipeline jobs
7. i18n: Add translation keys

