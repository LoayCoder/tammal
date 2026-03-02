
# PR-AI-OPS-01: Production Hardening & Chaos Engineering Validation

## Overview

Add a comprehensive chaos testing and production hardening layer with toggleable failure injection flags, stress tests, cascade failure simulations, and data integrity validation. All chaos logic is test-only -- no production code paths are modified for chaos injection.

---

## Part 1 -- Chaos Injection Framework

### 1.1 Chaos Configuration Module

Create `src/ai/__tests__/chaos/chaosConfig.ts` -- a centralized chaos flag registry.

```text
CHAOS_PROVIDER_FAILURE    -- Simulates 100%/50%/intermittent provider failures
CHAOS_COST_SPIKE          -- Simulates 10x cost spike / corrupted cost entries
CHAOS_LATENCY_SPIKE       -- Simulates 5x latency increase
CHAOS_FORECAST_FAILURE    -- Simulates empty forecast / NaN burn rate / div-by-zero
CHAOS_THOMPSON_CORRUPTION -- Simulates ts_alpha=0, ts_beta=0, negative variance
```

Safety: All flags default to `false`. Flags only exist in test code. No production code references them. A `CHAOS_PRODUCTION_GUARD` constant validates the test environment before any flag can activate.

### 1.2 Mock Providers

Create `src/ai/__tests__/chaos/mockProviders.ts` -- injectable mock implementations for:
- Supabase client (returns configurable data/errors)
- AI gateway (returns configurable responses/timeouts/5xx)
- Forecast state (returns NaN/null/empty)
- Thompson posteriors (returns corrupted alpha/beta/variance)

---

## Part 2 -- Failure Mode Test Suite

Create `src/ai/__tests__/chaos/providerFailures.test.ts` (25+ tests):

### Provider Failures
- 100% timeout: all providers time out, `callWithFallback` exhausts chain and throws
- 50% 5xx: half of providers return 500, fallback selects healthy provider
- 5x latency spike: routing detects via EWMA, Thompson rebalances on next cycle
- Partial degradation: one provider slow, others normal -- confirm ranking drops degraded provider
- Random intermittent failures: verify no crash, SLA penalty applied after threshold
- Verify `applySlaPenalty` inserts penalty with TTL after 5xx
- Verify Thompson posterior updates `ts_beta += 1` on failure
- Verify forecast detects latency drift when spike persists for 7 days
- Verify no infinite retry loop (max attempts = providers.length)
- Verify fail-open: routing returns a result even if all metrics queries fail

### Cost Explosion
- 10x cost spike: cost normalization still produces values in [0,1]
- Corrupted cost entry (negative): EWMA floors at 0, no negative propagation
- Budget table unavailable: `budgetConfig = null`, defaults to `balanced/no_config`
- Budget hard limit: forces `cost_saver` mode, verify `effectiveMode` change
- Autonomous adjustment frozen when budget in hard limit

### Forecast Engine Failure
- Cron not running: forecast_state stale but `getForecastAdjustments` returns neutral
- Forecast table empty: returns `{ costWeightMultiplier: 1.0, providerPenalty: 1.0, ... }`
- Division by zero in burn rate: `previous_cost = 0`, verify no crash
- NaN burn rate: `projected_monthly_cost = NaN`, verify clamped/defaulted
- Missing performance history: `computeSlaTrend` returns low risk

### Thompson Failure
- `ts_alpha = 0`: clamped to floor (1), sampling proceeds
- `ts_beta = 0`: clamped to floor (1), sampling proceeds
- Negative variance: floored at `0.01` (latency) / `0.0001` (cost)
- Sampling exception (mock gamma throw): falls back to `cost_aware` strategy
- Posterior corruption (both alpha/beta = NaN): defaults to uniform prior (1,1)

---

## Part 3 -- Multi-Tenant Isolation Tests

Create `src/ai/__tests__/chaos/tenantIsolation.test.ts` (12+ tests):

- Tenant A weights cannot be read by Tenant B query (mock RLS filter)
- Tenant A forecast state isolated from Tenant B
- Governance action with Tenant A token cannot modify Tenant B state
- Autonomous optimizer only processes states matching tenant_id
- Sandbox evaluations scoped to tenant
- Audit log entries tagged with correct tenant_id
- Materialized view `ai_governance_summary` filters by tenant
- Cross-tenant penalty cannot affect unrelated tenant
- Direct query to `ai_autonomous_state` blocked by RLS (no policy for anon/authenticated)
- Governance edge function validates tenant_id from profile lookup (not from request body)
- Usage24h is global by design -- verify it contains no tenant-specific data
- Budget config queries always include tenant_id filter

---

## Part 4 -- Cascade Failure Simulation

Create `src/ai/__tests__/chaos/cascadeFailure.test.ts` (10+ tests):

Simulate the full cascade sequence:
1. Provider starts failing (5xx) -- SLA penalty applied
2. Forecast detects drift -- `sla_risk_level` rises to medium/high
3. Forecast adjustment boosts cost weight -- routing shifts to cheaper provider
4. Autonomous optimizer detects anomaly -- freezes adjustments for 24h
5. Budget approaches hard limit -- `cost_saver` mode activated
6. Governance super admin applies manual override

Validate at each step:
- No oscillation between providers
- No double penalty (SLA penalty + autonomous penalty don't stack unboundedly)
- No conflicting weight adjustments (autonomous frozen during cascade)
- System stabilizes: after 24h freeze lifts, weights converge
- No infinite adjustment loop: 7-day cooldown prevents rapid recalibration
- Rollback restores previous stable weights correctly

---

## Part 5 -- Load & Scale Simulation

Create `src/ai/__tests__/chaos/loadSimulation.test.ts` (8+ tests):

These are computational simulations (not actual HTTP load tests):
- 10x traffic: simulate 10 concurrent `rankProvidersCostAware` calls, verify no shared state corruption
- Routing function is pure (no global mutable state) -- verify determinism with same inputs
- 1000 sequential routing calls: verify Thompson convergence (best provider selected >60% of time after 500+ calls)
- Atomic usage increment: simulate 100 concurrent `increment_usage_24h` calls, verify final count = 100
- Materialized view refresh is idempotent: calling `refresh_ai_governance_summary` twice produces same result
- Daily cron aggregation idempotent: running twice for same date produces same rows (upsert)
- No N+1 queries: verify `rankProvidersCostAware` issues exactly 5 parallel queries regardless of candidate count
- Weight normalization stable under floating point accumulation over 1000 iterations

---

## Part 6 -- Rollback Safety Tests

Create `src/ai/__tests__/chaos/rollbackSafety.test.ts` (8+ tests):

- Weight history stores exactly last 3 states
- Rollback pops most recent history entry and restores it as current
- After rollback, autonomous engine can resume (mode stays enabled)
- Rollback with empty history returns error (no crash)
- Partial write simulation: if DB update fails mid-adjustment, previous weights preserved
- Shadow mode never writes to `current_weights` (only logs)
- Multiple consecutive rollbacks drain history correctly
- Rollback is audited in `ai_autonomous_audit_log`

---

## Part 7 -- Data Integrity Stress Tests

Create `src/ai/__tests__/chaos/dataIntegrity.test.ts` (10+ tests):

- No NULL in critical columns: verify defaults for `ts_alpha`, `ts_beta`, `ewma_quality`, `cost_ewma`
- No negative cost: EWMA of non-negative inputs stays non-negative
- No negative variance: floor enforcement at 0.01/0.0001
- No invalid risk level: validation trigger rejects 'invalid' risk level
- No expired penalty left active: query filter `penalty_expires_at > now()` excludes stale
- Cron does not duplicate daily aggregation: upsert on composite PK verified
- Simultaneous provider metrics updates: two concurrent EWMA updates don't corrupt each other (last-write-wins acceptable for EWMA)
- Usage24h atomic increment returns correct count
- Autonomous state mode validation trigger rejects invalid values
- Sandbox status validation trigger rejects invalid values

---

## Part 8 -- Observability Validation

Create `src/ai/__tests__/chaos/observability.test.ts` (6+ tests):

- All chaos scenarios produce audit log entries
- Anomaly detection logs include Z-score values
- Governance dashboard `get_summary` returns data even if some tables are empty
- Telemetry fields populated: `ai_autonomous_enabled`, `ai_anomaly_detected`, etc.
- No silent failure: every catch block has a console.warn/error (code review assertion)
- Autonomous optimizer logs `processed`, `skipped`, `anomaliesDetected` counts

---

## File Summary

| File | Action |
|------|--------|
| `src/ai/__tests__/chaos/chaosConfig.ts` | Create |
| `src/ai/__tests__/chaos/mockProviders.ts` | Create |
| `src/ai/__tests__/chaos/providerFailures.test.ts` | Create |
| `src/ai/__tests__/chaos/tenantIsolation.test.ts` | Create |
| `src/ai/__tests__/chaos/cascadeFailure.test.ts` | Create |
| `src/ai/__tests__/chaos/loadSimulation.test.ts` | Create |
| `src/ai/__tests__/chaos/rollbackSafety.test.ts` | Create |
| `src/ai/__tests__/chaos/dataIntegrity.test.ts` | Create |
| `src/ai/__tests__/chaos/observability.test.ts` | Create |

**Total new tests: 90+** across 7 test files.

---

## Technical Notes

- All chaos tests are pure Vitest unit/integration tests using mocked Supabase clients and function imports. No production code is modified.
- No chaos flags exist in production code -- all injection is via test mocks and parameter overrides (`_randomFn`, `_nowMs`).
- The tests import pure functions directly from the edge function modules (e.g., `normalizeWeights`, `computeZScores`, `adjustWeights` from `autonomous-optimizer/index.ts`).
- For functions that require a Supabase client, mock objects with configurable `.from().select().eq()` chains are used.
- Load simulation tests are computational (in-process), not HTTP-based, since the goal is to validate algorithmic correctness under concurrency, not infrastructure throughput.
- The hardening report scores will be computed as test pass rates per category and documented in the test output.

---

## Expected Hardening Report Output

After all tests pass, the report will confirm:

| Dimension | Target | Method |
|-----------|--------|--------|
| Reliability | 10/10 | All fail-open paths verified |
| Resilience | 9/10 | Cascade recovery validated |
| Isolation | 10/10 | RLS + tenant scoping verified |
| Performance Under Load | 9/10 | Pure function benchmarks + no N+1 |
| Failure Recovery | 9/10 | Rollback + history + freeze verified |
| Cascade Stability | 9/10 | Multi-step cascade simulation |
| Chaos Survival | 10/10 | All chaos scenarios pass |
| Scalability Readiness | 5M+ users | Algorithmic O(1) routing verified |
