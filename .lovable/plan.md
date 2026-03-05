

# Phase 1 – Advanced Workload Analytics

## Current State

Already exists:
- `workload_metrics` table (utilization_percentage, burnout_risk_score, alignment_score per employee)
- `workload-intelligence.service.ts` with `calculateUtilization()`, `detectBurnoutRisk()`, `computeAlignmentScore()`, `computePriorityScore()`
- `useWorkloadAnalytics` hook with team load aggregation
- `ExecutiveDashboard.tsx` with KPI cards, department workload chart, burnout risk map, alignment overview
- `TeamWorkload.tsx` with quadrant view, risk alerts, task table
- `PortfolioDashboard.tsx` with objective/initiative progress, AI predictions

Does NOT exist:
- `execution_velocity_metrics` table
- `strategic_alignment_metrics` table
- `workload_heatmap_metrics` table
- `initiative_risk_metrics` table
- Execution velocity calculation
- Initiative risk scoring
- Heatmap snapshot persistence
- Velocity/alignment/risk visualizations on dashboards

## Implementation Plan

### Task 1: Create 4 New Analytics Tables (Migration)

**a) `execution_velocity_metrics`**
- id, tenant_id, department_id (nullable), initiative_id (nullable), actions_completed, period_start, period_end, velocity_score, created_at, deleted_at
- RLS using `current_tenant_id()`

**b) `strategic_alignment_metrics`**
- id, tenant_id, user_id, aligned_actions, total_actions, alignment_score, snapshot_date, created_at, deleted_at
- RLS using `current_tenant_id()`

**c) `workload_heatmap_metrics`**
- id, tenant_id, employee_id, department_id, utilization_pct, classification (underutilized/healthy/high_load/burnout_risk), snapshot_date, created_at, deleted_at
- RLS using `current_tenant_id()`

**d) `initiative_risk_metrics`**
- id, tenant_id, initiative_id, overdue_score, velocity_score, resource_score, escalation_score, risk_score (composite), snapshot_date, created_at, deleted_at
- RLS using `current_tenant_id()`

All tables get indexes on `(tenant_id, snapshot_date)` and `(tenant_id, department_id)` where applicable.

### Task 2: Extend Analytics Service

Add to `workload-intelligence.service.ts`:

- **`calculateExecutionVelocity(tenantId, periodDays)`** — Count completed actions per department/initiative over the period. Formula: `completed / periodDays`.
- **`generateWorkloadHeatmap(tenantId)`** — For each employee, compute utilization classification and persist to `workload_heatmap_metrics`.
- **`calculateInitiativeRisk(tenantId, initiativeId)`** — Weighted composite: overdue actions (40%), velocity slowdown (30%), resource overload (20%), escalations (10%). Persist to `initiative_risk_metrics`.
- **`snapshotAlignmentMetrics(tenantId)`** — Per-user alignment scores persisted to `strategic_alignment_metrics`.

### Task 3: Create Analytics Edge Function

New edge function `workload-analytics` to run heavy computations server-side:
- Actions: `compute_velocity`, `snapshot_heatmap`, `compute_initiative_risk`, `snapshot_alignment`
- Authenticated, tenant resolved server-side
- Can be triggered manually or via cron

### Task 4: Create Frontend Hooks

- **`useExecutionVelocity()`** — Fetches from `execution_velocity_metrics`, exposes velocity data by department/initiative
- **`useWorkloadHeatmap()`** — Fetches heatmap snapshots with classification distribution
- **`useInitiativeRisk()`** — Fetches initiative risk scores with factor breakdown
- **`useAlignmentMetrics()`** — Fetches per-user alignment snapshots

### Task 5: Enhance TeamWorkload Dashboard

Add 3 new sections to `/admin/workload/team`:

1. **Workload Distribution** — Horizontal bar chart showing team capacity usage with color-coded bars (underutilized=blue, healthy=green, high_load=amber, burnout_risk=red)
2. **Execution Metrics** — KPI cards for team velocity (actions/day), completion rate, overdue rate
3. **Risk Indicators** — Initiative risk cards showing composite scores and factor breakdown

### Task 6: Enhance Executive Dashboard

Add new sections to `/admin/workload/executive`:

1. **Delivery Performance** section — Execution velocity trend, on-time completion rate, SLA compliance rate
2. **Workforce Health** section — Workload heatmap grid showing all employees color-coded by classification
3. **Initiative Risk Radar** — Top at-risk initiatives with weighted factor breakdown

### Task 7: i18n Keys

Add all new translation keys to `en.json` and `ar.json` for velocity, heatmap, risk, alignment labels.

## Execution Order

1. Migration: Create 4 analytics tables with RLS + indexes
2. Service: Extend `workload-intelligence.service.ts` with velocity/heatmap/risk functions
3. Edge function: `workload-analytics` for server-side computation
4. Hooks: 4 new data-fetching hooks
5. UI: Enhance TeamWorkload + Executive dashboards
6. i18n: Add translation keys

