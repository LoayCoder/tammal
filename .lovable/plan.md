
# PR-AI-INT-02: Cost-Aware Routing Layer

## Overview

Upgrade the hybrid provider routing system from quality-based to multi-objective cost-aware intelligent routing. The new system optimizes across quality, latency, stability, cost, and confidence -- with tenant-aware routing modes, budget enforcement, SLA penalties, confidence decay, and diversity protection.

## Part 1 -- Database Migration

Create a single migration file adding four new objects and extending one:

### 1.1 Extend `ai_provider_metrics_agg`
Add columns:
- `cost_ewma numeric default 0` -- EWMA-smoothed cost tracking
- `last_call_at timestamptz` -- for confidence decay calculation

(Note: `avg_cost_per_1k_tokens` is unnecessary since `ewma_cost_per_1k` already exists and `cost_ewma` supersedes it. `last_cost_update` is also redundant with `last_call_at`.)

### 1.2 Create `tenant_ai_budget_config`
```text
tenant_id uuid PK references tenants(id)
monthly_budget numeric not null default 100
soft_limit_percentage numeric default 0.8
routing_mode text default 'balanced' (validated via trigger: 'performance'|'balanced'|'cost_saver')
current_month_usage numeric default 0
usage_month text (e.g. '2026-03')
updated_at timestamptz default now()
```
RLS: tenant-scoped read; tenant_admin write.

### 1.3 Create `ai_provider_penalties`
```text
id uuid PK
provider text not null
feature text not null
penalty_multiplier numeric default 0.7
penalty_expires_at timestamptz not null
created_at timestamptz default now()
unique(provider, feature)
```
RLS: service-role only write.

### 1.4 Create `ai_provider_usage_24h`
```text
provider text PK
calls_last_24h int default 0
usage_percentage numeric default 0
last_updated timestamptz default now()
```
RLS: service-role only write; no client access.

## Part 2 -- Cost-Aware Router Module

Create `supabase/functions/generate-questions/costAwareRouter.ts` as a new module that wraps and extends `hybridRouter.ts`.

### 2.1 New Scoring Formula

Replace the old `computeScore` with multi-objective scoring:

```text
FinalScore =
  w_quality   * QualityScore +
  w_latency   * LatencyScore +
  w_stability * StabilityScore +
  w_cost      * CostScore +
  w_confidence * ConfidenceScore
```

**Score definitions:**
- `QualityScore` = `clamp01(ewma_quality / 100)`
- `LatencyScore` = `1 - (providerLatency / maxLatencyAmongCandidates)` (relative normalization)
- `StabilityScore` = `clamp01(ewma_success_rate)` (1 - error rate)
- `CostScore` = `1 - (providerCost / maxCostAmongCandidates)` (relative normalization)
- `ConfidenceScore` = `min(sample_count / 100, 1) * exp(-daysSinceLastCall / 30)`

### 2.2 Routing Modes (Tenant-Aware Weights)

Read `tenant_ai_budget_config.routing_mode` per tenant:

| Mode | w_quality | w_latency | w_stability | w_cost | w_confidence |
|------|-----------|-----------|-------------|--------|-------------|
| performance | 0.45 | 0.20 | 0.20 | 0.05 | 0.10 |
| balanced | 0.20 | 0.20 | 0.20 | 0.20 | 0.20 |
| cost_saver | 0.25 | 0.15 | 0.10 | 0.40 | 0.10 |

### 2.3 Budget-Aware Adjustment

- If `current_month_usage / monthly_budget > soft_limit_percentage`: multiply `w_cost` by 1.5x, renormalize weights to sum to 1.
- If `current_month_usage >= monthly_budget`: force `routing_mode = cost_saver`.

### 2.4 Confidence Decay

Applied per-candidate: `AdjustedFinalScore = FinalScore * exp(-daysSinceLastCall / 30)`.
If `last_call_at` is null, use a conservative default decay factor (0.5).

### 2.5 SLA-Aware Penalization

Query `ai_provider_penalties` for active (non-expired) penalties per provider+feature.
Multiply the candidate's final score by `penalty_multiplier` (default 0.7).
Penalties auto-expire by timestamp comparison -- no EWMA contamination.

### 2.6 Diversity Guard

Query `ai_provider_usage_24h`. If any provider has `usage_percentage > 95%`, set `epsilon = max(epsilon, 0.15)` to force exploration.

### 2.7 Exported API

```typescript
export async function rankProvidersCostAware(
  supabase: any,
  params: CostAwareRankParams
): Promise<CostAwareRoutingResult>

export async function updateProviderMetricsV2(
  supabase: any,
  params: UpdateParamsV2
): Promise<void>

export async function applySlaPenalty(
  supabase: any,
  provider: string,
  feature: string,
  multiplier?: number,
  ttlMinutes?: number
): Promise<void>
```

The result type extends `RoutingResult` with additional telemetry fields: `routingMode`, `costWeight`, `budgetState`, `penaltyApplied`, `decayApplied`, `confidenceScores`, `costScores`, `diversityTriggered`, `scoreBreakdown`.

## Part 3 -- Edge Function Integration

### 3.1 Update `index.ts`

Replace the existing `rankProvidersHybrid` call block (lines 816-835) with `rankProvidersCostAware`:

- Fetch budget config for tenant
- Pass routing mode and budget state into the new router
- On SLA failures (5xx, timeout), call `applySlaPenalty` (fire-and-forget, 10-minute TTL)
- Post-call: update `cost_ewma` and `last_call_at` via `updateProviderMetricsV2`
- Post-call: increment `ai_provider_usage_24h` for the used provider

### 3.2 Backward Compatibility

- If `tenant_ai_budget_config` row is missing for a tenant, default to `balanced` mode with no budget constraint
- If the cost-aware router fails, fall back to the old `rankProvidersHybrid` (graceful degradation)
- The old `hybridRouter.ts` is preserved unchanged for fallback

### 3.3 Telemetry Additions

Add to `ai_generation_logs.settings`:
- `ai_routing_mode_v2` (performance|balanced|cost_saver)
- `ai_cost_weight`
- `ai_final_score_breakdown` (array of top-3 with per-dimension scores)
- `ai_penalty_applied` (boolean)
- `ai_decay_applied` (boolean)
- `ai_confidence_score` (of selected provider)
- `ai_cost_score` (of selected provider)
- `ai_diversity_triggered` (boolean)
- `ai_budget_state` (under_limit|soft_limit|hard_limit|no_config)

## Part 4 -- Tests

Create `src/ai/__tests__/costAwareRouter.test.ts` with 30+ tests:

**Cost normalization (4 tests):**
- Relative normalization picks cheapest provider highest
- Equal costs yield equal cost scores
- Zero cost yields perfect score
- All zeros handled gracefully

**Routing mode weight switching (4 tests):**
- Performance mode: quality weight = 0.45
- Balanced mode: equal weights
- Cost_saver mode: cost weight = 0.40
- Unknown mode defaults to balanced

**Budget soft limit (3 tests):**
- Below soft limit: no cost weight boost
- Above soft limit: cost weight increased by 1.5x (renormalized)
- Weights still sum to 1.0 after boost

**Budget hard limit (2 tests):**
- At/above monthly budget: forced to cost_saver
- No budget config: no enforcement

**SLA penalty (3 tests):**
- Active penalty reduces score by multiplier
- Expired penalty has no effect
- No penalty row: score unaffected

**Confidence decay (4 tests):**
- Recent call (1 day): minimal decay
- 30 days ago: ~37% of original (e^-1)
- 60 days ago: ~13% (e^-2)
- Null last_call_at: conservative default

**Diversity guard (3 tests):**
- Provider at 96% usage: epsilon boosted to 0.15
- Provider at 80% usage: no epsilon change
- Empty usage table: no change

**Deterministic ranking (3 tests):**
- Exploit picks best multi-objective score
- Exploration among top-3 with seeded RNG
- Same inputs produce same outputs

**No-regression from INT-01C (4 tests):**
- Alpha/beta computation unchanged
- EWMA update math unchanged
- Neutral defaults for missing metrics
- Seeded random produces same sequence

## File Summary

| File | Action |
|------|--------|
| `supabase/migrations/XXXX_cost_aware_routing.sql` | Create |
| `supabase/functions/generate-questions/costAwareRouter.ts` | Create |
| `src/ai/__tests__/costAwareRouter.test.ts` | Create |
| `supabase/functions/generate-questions/index.ts` | Edit (routing block + telemetry + post-call) |
| `supabase/functions/generate-questions/hybridRouter.ts` | Unchanged (preserved for fallback) |

## Risk Assessment

- **Risk**: Very Low (additive, fail-open, backward-compatible)
- **No breaking API changes**: Request/response shape unchanged
- **No UI changes**: Backend-only routing logic
- **Multi-tenant isolation**: Budget config is tenant-scoped with RLS
- **Graceful degradation**: Falls back to INT-01C router on any failure
