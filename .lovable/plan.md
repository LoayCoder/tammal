
# PR-AI-INT-06: Autonomous Optimization Layer (Semi-Autonomous, Guarded)

## Overview

Add a closed-loop adaptive optimization layer that conservatively recalibrates routing weights, tunes hyperparameters via offline replay, detects anomalies using Z-score analysis, and evaluates new providers in sandbox mode. All adjustments are bounded, reversible, auditable, and fail-open.

---

## Part 1 -- Database Migration

### 1.1 Create `ai_autonomous_state`

Stores per-tenant/feature autonomous optimization state including current weights, adjustment history, and mode control.

```text
tenant_id uuid PK (composite)
feature text PK (composite)
current_weights jsonb (default: balanced mode weights)
previous_weights_history jsonb[] (last 3 states for rollback)
last_adjustment timestamptz
adjustment_score numeric
mode text CHECK (mode IN ('enabled','disabled','shadow')) DEFAULT 'disabled'
exploration_boost numeric DEFAULT 0
anomaly_frozen_until timestamptz
hyperparams jsonb (decay_window, smoothing_alpha, drift_threshold)
```

RLS: super_admin full read/write; tenant_admin read own tenant.

### 1.2 Create `ai_autonomous_audit_log`

Records every autonomous adjustment with full before/after state for auditability and rollback.

```text
id uuid PK DEFAULT gen_random_uuid()
tenant_id uuid
feature text
previous_weights jsonb
new_weights jsonb
adjustment_reason text
adjustment_magnitude numeric
anomaly_detected boolean DEFAULT false
hyperparameter_tuned boolean DEFAULT false
sandbox_event text
created_at timestamptz DEFAULT now()
```

RLS: super_admin full read; tenant_admin read own tenant. No public access.

### 1.3 Create `ai_sandbox_evaluations`

Tracks sandbox provider evaluation lifecycle.

```text
id uuid PK DEFAULT gen_random_uuid()
tenant_id uuid
feature text
provider text
model text
status text CHECK (status IN ('active','promoted','disabled','expired')) DEFAULT 'active'
traffic_percentage numeric DEFAULT 5
started_at timestamptz DEFAULT now()
expires_at timestamptz (started_at + 7 days)
calls_total int DEFAULT 0
calls_success int DEFAULT 0
avg_latency numeric
avg_cost numeric
median_quality numeric
created_at timestamptz DEFAULT now()
```

RLS: super_admin full; tenant_admin read own.

---

## Part 2 -- Edge Function: `autonomous-optimizer`

Create `supabase/functions/autonomous-optimizer/index.ts` -- scheduled weekly via pg_cron.

### 2.1 Weight Recalibration Engine

**Trigger**: Runs every 7 days per tenant+feature combination.

**Inputs** (from existing tables):
- SLA stability score (from `ai_forecast_state.sla_risk_level`)
- Cost efficiency (from `ai_forecast_state.burn_rate` vs budget)
- Thompson convergence rate (from `ai_provider_metrics_agg.ts_alpha + ts_beta`)
- Exploration ratio (from `ai_provider_usage_24h`)
- Budget risk frequency (from `ai_cost_daily_agg`)

**Algorithm**:
```text
learning_rate = 0.05
performance_delta = compute from 7-day metrics comparison

new_weight[dim] = old_weight[dim] + learning_rate * performance_delta[dim]
normalize(new_weights) so sum = 1.0
clamp each weight between 0.05 and 0.6
cap per-cycle change at 5% per dimension
```

**Hard Guardrails**:
- Skip if `ai_autonomous_state.mode = 'disabled'`
- Skip if last_adjustment < 7 days ago
- Skip if `ai_forecast_state.sla_risk_level = 'high'`
- Skip if budget in hard_limit state
- Skip if `anomaly_frozen_until > now()`
- In `shadow` mode: compute but don't apply; log only

### 2.2 Hyperparameter Self-Tuning

**Eligible parameters** (clamped ranges):
- Decay window: 20-40 days (currently 30)
- Smoothing alpha: 0.2-0.4 (currently 0.3)
- Drift threshold: 10-25% (currently 15%)

**Method**: Offline replay simulation
- Replay last 30 days of `ai_provider_events` under candidate parameter
- Compare routing performance (quality-weighted cost) vs actual
- Accept only if improvement > 3%
- Store tuned values in `ai_autonomous_state.hyperparams`

### 2.3 Anomaly Detection

**Z-Score Detection** on 7-day windows:
```text
z = (current_value - rolling_mean) / rolling_stddev
```

Applied to: latency, cost per call, error rate.

**On anomaly (|z| > 3)**:
- Increase exploration by +5% (cap at 20%)
- Apply temporary conservative penalty (0.85 multiplier, 30 min TTL)
- Log anomaly event to `ai_autonomous_audit_log`
- Set `anomaly_frozen_until = now() + 24h` (freeze autonomous adjustments)

### 2.4 Sandbox Provider Evaluation

When a new provider is added to `ai_provider_metrics_agg` with `sample_count < 10`:
- Create `ai_sandbox_evaluations` entry
- Route 5% of traffic to sandbox provider
- After 7 days or 100+ calls:
  - If quality > median of existing providers: promote (set status='promoted')
  - If quality < 25th percentile: disable (set status='disabled')
  - Log transition to audit log

---

## Part 3 -- Integration with Routing Hot Path

### 3.1 Autonomous Weight Injection

In `generate-questions/index.ts`, after fetching `forecastAdj`, add a fail-open fetch of `ai_autonomous_state`:

```typescript
// Fetch autonomous weights (fail-open)
let autonomousWeights: CostAwareWeights | null = null;
try {
  if (resolvedTenantId) {
    const { data } = await supabase
      .from('ai_autonomous_state')
      .select('current_weights, mode, exploration_boost, anomaly_frozen_until')
      .eq('tenant_id', resolvedTenantId)
      .eq('feature', 'question-generator')
      .maybeSingle();
    if (data?.mode === 'enabled' && data?.current_weights) {
      autonomousWeights = data.current_weights;
    }
  }
} catch { /* fail-open */ }
```

Pass `autonomousWeights` to the router as an optional override. The router uses these weights instead of default `MODE_WEIGHTS` if provided.

### 3.2 Sandbox Traffic Routing

Before provider selection, check for active sandbox evaluations:
- If sandbox active and `Math.random() < 0.05`: route to sandbox provider
- Record outcome in sandbox evaluation metrics
- All fail-open: if sandbox provider fails, fallback to normal routing

### 3.3 Telemetry Additions

Add to `ai_generation_logs.settings`:
```text
ai_autonomous_enabled: boolean
ai_autonomous_adjustment_applied: boolean
ai_autonomous_adjustment_magnitude: number
ai_anomaly_detected: boolean
ai_hyperparameter_tuned: boolean
ai_sandbox_provider_active: boolean
```

---

## Part 4 -- Governance Dashboard Integration

### 4.1 New Components

```text
src/components/ai-governance/
  AutonomousStatus.tsx    -- Current mode, last adjustment, weight diff visualization
  AnomalyTimeline.tsx     -- Timeline of detected anomalies with Z-scores
  SandboxMonitor.tsx      -- Active sandbox evaluations with progress bars
```

### 4.2 Engineering Tab Extension

Add to the Engineering tab in `AIGovernance.tsx`:
- Autonomous Status card (mode toggle for super_admin)
- Weight evolution chart (current vs previous 3 states)
- Anomaly detection timeline
- Sandbox provider evaluation cards

### 4.3 Control Actions (Super Admin)

Add to `ai-governance` edge function:
- `toggle_autonomous_mode`: Switch between enabled/disabled/shadow
- `rollback_weights`: Restore from `previous_weights_history`
- `freeze_autonomous`: Set `anomaly_frozen_until` manually
- `promote_sandbox`: Manually promote sandbox provider
- `disable_sandbox`: Manually disable sandbox provider

All actions logged to `ai_governance_audit_log`.

### 4.4 Data Hooks

```text
src/hooks/ai-governance/
  useAutonomousState.ts    -- Fetch autonomous state per tenant
  useSandboxEvaluations.ts -- Fetch active sandbox evaluations
```

---

## Part 5 -- Scheduled Job

### 5.1 Weekly Optimizer Cron

Register via pg_cron (every Sunday 3 AM UTC):

```sql
select cron.schedule(
  'autonomous-optimizer-weekly',
  '0 3 * * 0',
  $$ select net.http_post(
    url:='https://eojxreaidrfmggglmspr.supabase.co/functions/v1/autonomous-optimizer',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body:='{"type":"weekly_optimize"}'::jsonb
  ) $$
);
```

### 5.2 Anomaly Detection (Piggyback on Daily Cron)

Add anomaly detection to the existing `forecast-daily-agg` edge function rather than creating a separate cron. After daily aggregation completes, run Z-score checks on the just-aggregated data.

---

## Part 6 -- Tests

Create `src/ai/__tests__/autonomousOptimizer.test.ts` with 60+ tests:

**Weight Adjustment (12 tests)**:
- Learning rate application correctness
- Normalization after adjustment
- Clamping between 0.05 and 0.6
- Max 5% change per cycle enforced
- Positive performance delta increases weight
- Negative delta decreases weight
- Zero delta produces no change
- Multiple dimensions adjust independently
- Sum always equals 1.0 after normalization
- History stores previous 3 states
- Rollback restores correct state
- Shadow mode computes but does not apply

**Guardrail Enforcement (8 tests)**:
- Skip when mode = disabled
- Skip when last_adjustment < 7 days
- Skip when SLA risk = high
- Skip when budget = hard_limit
- Skip when anomaly_frozen_until > now
- Shadow mode logs but does not write weights
- Multiple guardrails simultaneously active
- Guardrail bypass impossible from API

**Anomaly Detection (10 tests)**:
- Z-score computation correctness
- Anomaly triggers at |z| > 3
- No false positive at |z| = 2.5
- Exploration boost capped at 20%
- Temporary penalty applied on anomaly
- Anomaly freezes autonomous for 24h
- Multiple simultaneous anomalies handled
- Empty data returns no anomaly
- Single data point returns no anomaly
- Anomaly logged to audit trail

**Hyperparameter Tuning (8 tests)**:
- Replay produces consistent results
- 3% improvement threshold enforced
- Decay window clamped 20-40
- Smoothing alpha clamped 0.2-0.4
- Drift threshold clamped 10-25%
- No change if improvement < 3%
- Tuned values stored correctly
- Original values preserved on reject

**Sandbox Provider (10 tests)**:
- New provider enters sandbox
- 5% traffic routing correctness
- Promotion on quality > median
- Disable on quality < 25th percentile
- 7-day expiry enforced
- 100-call minimum for evaluation
- Sandbox failure falls back to normal routing
- Multiple simultaneous sandboxes
- Manual promote via governance
- Manual disable via governance

**Integration & Safety (12 tests)**:
- Autonomous weights override MODE_WEIGHTS correctly
- Fail-open when autonomous_state table empty
- Fail-open when autonomous_state fetch errors
- No routing slowdown with autonomous layer
- Thompson compatibility maintained
- Cost-aware compatibility maintained
- Hybrid compatibility maintained
- Multi-tenant isolation of autonomous state
- No cross-tenant weight leakage
- Telemetry fields populated correctly
- Audit log captures all transitions
- Concurrent optimizer runs are idempotent

---

## Part 7 -- Localization

Add translation keys under `aiGovernance.autonomous` namespace in EN and AR:
- Mode labels (enabled/disabled/shadow)
- Anomaly detection labels
- Sandbox evaluation status labels
- Control action labels
- Weight dimension labels

---

## File Summary

| File | Action |
|------|--------|
| Migration: tables + RLS | Create |
| `supabase/functions/autonomous-optimizer/index.ts` | Create |
| `supabase/functions/forecast-daily-agg/index.ts` | Edit (add anomaly detection) |
| `supabase/functions/generate-questions/index.ts` | Edit (add autonomous weight injection + sandbox routing) |
| `supabase/functions/ai-governance/index.ts` | Edit (add autonomous control actions) |
| `src/components/ai-governance/AutonomousStatus.tsx` | Create |
| `src/components/ai-governance/AnomalyTimeline.tsx` | Create |
| `src/components/ai-governance/SandboxMonitor.tsx` | Create |
| `src/hooks/ai-governance/useAutonomousState.ts` | Create |
| `src/hooks/ai-governance/useSandboxEvaluations.ts` | Create |
| `src/pages/admin/AIGovernance.tsx` | Edit (add autonomous section) |
| `src/ai/__tests__/autonomousOptimizer.test.ts` | Create |
| `src/locales/en.json` | Edit |
| `src/locales/ar.json` | Edit |
| `supabase/config.toml` | Edit (add autonomous-optimizer function) |

## Technical Notes

- Default mode is `disabled` -- autonomous optimization is opt-in per tenant
- Shadow mode allows operators to observe what the optimizer _would_ do without applying changes
- The 3-state weight history enables instant rollback via governance dashboard
- Anomaly detection piggybacks on existing daily cron to avoid additional scheduled jobs
- All autonomous actions are logged in the existing `ai_governance_audit_log` (not a separate table -- the `ai_autonomous_audit_log` is for the optimizer's internal decisions which are more granular)
- The weekly optimizer is idempotent: re-running for the same period produces the same result
- Sandbox traffic percentage (5%) is hardcoded but stored in the evaluation row for future configurability
