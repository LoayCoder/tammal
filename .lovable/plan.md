
# PR-AI-INT-05: Multi-Tier AI Governance Dashboard

## Overview

Build a read-only, role-aware dashboard at `/admin/ai-governance` that surfaces AI routing behavior, Thompson confidence, budget/forecast state, SLA health, and provider dominance from existing backend tables. Includes super-admin control actions (strategy switch, posterior reset, penalty management) with full audit logging.

## Part 1 -- Database Migration

### 1.1 Create `ai_governance_audit_log`
Tracks all control actions taken through the governance dashboard.

```text
id uuid PK default gen_random_uuid()
tenant_id uuid references tenants(id)
user_id uuid not null
action text not null (e.g. 'switch_strategy', 'reset_posterior', 'apply_penalty', 'toggle_auto_adjust')
target_entity text (e.g. 'openai', 'global', 'tenant:xxx')
previous_value jsonb
new_value jsonb
created_at timestamptz default now()
```
RLS: super_admin + tenant_admin read; service-role write.

### 1.2 Create materialized view `ai_governance_summary`
Pre-aggregated read-optimized view joining forecast state, metrics, and usage data. Refreshed daily via cron and on-demand via edge function.

```sql
CREATE MATERIALIZED VIEW ai_governance_summary AS
SELECT
  f.tenant_id, f.feature,
  f.projected_monthly_cost, f.burn_rate,
  f.sla_risk_level, f.performance_drift_score,
  f.last_updated as forecast_updated,
  -- Provider metrics (pivoted per-provider)
  m.provider, m.model, m.scope,
  m.ewma_latency_ms, m.ewma_quality, m.ewma_success_rate,
  m.ewma_cost_per_1k, m.cost_ewma, m.sample_count,
  m.ts_alpha, m.ts_beta, m.last_call_at,
  -- Usage
  u.calls_last_24h, u.usage_percentage
FROM ai_forecast_state f
LEFT JOIN ai_provider_metrics_agg m
  ON m.feature = f.feature AND (m.tenant_id = f.tenant_id OR m.scope = 'global')
LEFT JOIN ai_provider_usage_24h u
  ON u.provider = m.provider;

CREATE UNIQUE INDEX ON ai_governance_summary (tenant_id, feature, provider, model, scope);
```

### 1.3 RLS policies
- `ai_governance_audit_log`: super_admin read all; tenant_admin read own tenant rows.
- Materialized view: accessed via edge function (service-role), not directly from client.

## Part 2 -- Edge Function: `ai-governance`

Create `supabase/functions/ai-governance/index.ts` to serve as the backend API for the dashboard. Endpoints (via action param):

| Action | Access | Description |
|--------|--------|-------------|
| `get_summary` | All governance roles | Returns materialized view data filtered by tenant |
| `get_routing_logs` | engineering_admin, super_admin | Last N routing decisions from ai_generation_logs |
| `get_cost_breakdown` | finance_admin, super_admin | Cost daily agg data for charts |
| `get_performance_trend` | risk_admin, super_admin | Performance daily agg for SLA charts |
| `get_penalties` | risk_admin, super_admin | Active penalties |
| `get_budget_config` | finance_admin, super_admin | Tenant budget config |
| `switch_strategy` | super_admin | Update routing_strategy globally or per-tenant |
| `reset_posterior` | super_admin | Reset Thompson priors to (1,1) |
| `apply_penalty` | super_admin, risk_admin | Insert penalty row |
| `clear_penalty` | super_admin, risk_admin | Delete penalty row |
| `update_budget` | super_admin, finance_admin | Update tenant_ai_budget_config |
| `refresh_summary` | super_admin | Refresh materialized view |

Role checks: Query `user_roles` for the calling user to verify access. Uses existing `has_role` and permission patterns.

**Role mapping approach**: Rather than creating new database roles, map governance access to existing roles + permissions:
- `super_admin` role: full access (all sections)
- `tenant_admin` role with `ai_governance.view` permission: executive view
- Custom roles with specific permissions: `ai_governance.engineering`, `ai_governance.finance`, `ai_governance.risk`

These permissions will be seeded into the `permissions` table.

## Part 3 -- Frontend Structure

### 3.1 Route and Guard
Add route: `/admin/ai-governance` guarded by `AdminRoute` (super_admin or tenant_admin).

### 3.2 Page: `src/pages/admin/AIGovernance.tsx`
Tab-based layout using existing Tabs component. Tabs shown based on user permissions:

- **Overview** (all admin roles): KPI cards -- strategy, projected cost, budget risk, SLA risk, provider dominance %, uptime
- **Engineering** (super_admin or `ai_governance.engineering`): Thompson visualizer, routing breakdown table, exploration monitor
- **Finance** (super_admin or `ai_governance.finance`): Burn rate, budget utilization, cost per provider/feature charts, budget controls
- **Risk** (super_admin or `ai_governance.risk`): SLA drift, error/latency trends, active penalties, penalty controls
- **Inspector** (super_admin): Per-request routing detail viewer querying ai_generation_logs

### 3.3 Component Breakdown

```text
src/components/ai-governance/
  GovernanceOverview.tsx        -- KPI stat cards + cost trend line chart
  ThompsonVisualizer.tsx        -- Beta distribution chart per provider (recharts)
  RoutingBreakdownTable.tsx     -- Last 100 routing decisions in DataTable
  ExplorationMonitor.tsx        -- Provider selection distribution (stacked bar)
  FinanceDashboard.tsx          -- Burn rate, budget %, cost heatmap
  BudgetControls.tsx            -- Edit monthly_budget, soft_limit, routing_mode
  RiskDashboard.tsx             -- SLA drift, error trends (line charts), penalties table
  PenaltyControls.tsx           -- Apply/clear penalties
  RoutingInspector.tsx          -- Single request detail viewer
  StrategyControls.tsx          -- Switch routing strategy, reset posteriors
  GovernanceAuditLog.tsx        -- Recent control action log
```

### 3.4 Data Hooks

```text
src/hooks/ai-governance/
  useGovernanceSummary.ts       -- Fetches materialized view via edge function
  useRoutingLogs.ts             -- Fetches recent routing decisions
  useCostBreakdown.ts           -- Fetches cost daily agg
  usePerformanceTrend.ts        -- Fetches performance daily agg
  useGovernanceActions.ts       -- Mutations for control actions
```

All hooks call `supabase.functions.invoke('ai-governance', { body: { action, params } })`.

### 3.5 Visualization Library
Uses existing `recharts` (already installed):
- Line charts: cost trends, latency trends, error rate trends
- Stacked bar: provider dominance over time
- Bar chart: cost per provider/feature
- Custom Beta distribution curve: rendered via recharts Area chart with computed PDF points
- Risk badges: Tailwind-based colored badges (green/yellow/red)

### 3.6 Mobile & Dark Mode
- Cards stack vertically on mobile (existing responsive patterns)
- All charts use CSS variable colors for dark mode compatibility
- Glass-card styling consistent with existing admin pages

## Part 4 -- Sidebar Integration

Add "AI Governance" menu item under a new "AI Platform" group in the sidebar, visible only to admin roles:

```typescript
{
  label: t('nav.aiPlatform'),
  access: 'admin',
  icon: Brain,
  items: [
    { title: t('nav.aiGovernance'), url: "/admin/ai-governance", icon: Gauge, access: 'admin' },
  ]
}
```

## Part 5 -- Tests

Create `src/ai/__tests__/aiGovernance.test.ts` with 50+ tests:

**RBAC enforcement (8 tests):**
- Super admin sees all tabs
- Tenant admin sees only Overview by default
- Engineering permission grants Engineering tab
- Finance permission grants Finance tab
- Risk permission grants Risk tab
- No permission shows only Overview
- Control actions blocked for non-super-admin
- Audit log records all mutations

**Tenant isolation (5 tests):**
- Summary data filtered by tenant_id
- Cost breakdown scoped to tenant
- Performance data scoped correctly
- Cannot access other tenant's budget config
- Audit log scoped to tenant

**Data correctness (10 tests):**
- Overview KPIs match forecast_state values
- Cost trend chart data maps correctly
- Provider dominance % calculated from usage_24h
- Thompson alpha/beta displayed correctly
- Beta PDF curve points computed accurately
- Routing inspector parses settings JSON correctly
- Penalty expiry countdown accurate
- Budget utilization percentage correct
- SLA risk badge color mapping
- Performance drift score display

**Control actions (10 tests):**
- Switch strategy updates tenant_ai_budget_config
- Reset posterior sets ts_alpha=1, ts_beta=1
- Apply penalty creates row with correct TTL
- Clear penalty removes row
- Update budget validates positive values
- Refresh summary triggers materialized view refresh
- All actions create audit log entries
- Optimistic UI updates on mutation
- Error handling on failed mutations
- Concurrent action safety

**Edge cases (7 tests):**
- Empty metrics gracefully shows "No data" state
- Missing forecast_state shows defaults
- Missing budget_config shows "No config" badge
- Zero providers renders empty chart
- Very large sample counts don't overflow
- Date formatting handles timezone correctly
- Stale data indicator when last_updated > 1 hour

**No regression (10 tests):**
- Existing routing still works without governance dashboard
- Materialized view refresh doesn't block routing
- Edge function CORS headers present
- Authentication required for all endpoints
- Invalid action returns 400
- Rate limiting on control actions
- Service role required for write operations
- JSON serialization of all telemetry fields
- Response time under 200ms for summary endpoint
- No N+1 queries in summary fetch

## Part 6 -- Localization

Add translation keys under `ai_governance` namespace in both EN and AR translation files for all labels, tooltips, and descriptions.

## File Summary

| File | Action |
|------|--------|
| `supabase/migrations/XXXX_ai_governance.sql` | Create |
| `supabase/functions/ai-governance/index.ts` | Create |
| `src/pages/admin/AIGovernance.tsx` | Create |
| `src/components/ai-governance/*.tsx` (11 files) | Create |
| `src/hooks/ai-governance/*.ts` (5 files) | Create |
| `src/ai/__tests__/aiGovernance.test.ts` | Create |
| `src/App.tsx` | Edit (add route) |
| `src/components/layout/AppSidebar.tsx` | Edit (add menu item) |

## Technical Notes

- The materialized view approach keeps dashboard queries under 200ms by pre-joining data
- No direct computation in the UI layer; all aggregation happens in the edge function or materialized view
- Control actions use optimistic updates with rollback on failure
- The edge function validates caller identity via `supabase.auth.getUser()` and checks roles server-side
- All control mutations are audit-logged before returning success
- Fail-safe rendering: every component handles null/undefined data with skeleton or "No data" states
- RTL compliance: all layout uses logical properties (ms-, me-, ps-, pe-, text-start, text-end)
