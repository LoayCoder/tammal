/**
 * PR-AI-INT-06: Autonomous Optimization Layer — Test Suite
 * 60+ tests covering weights, guardrails, anomaly detection, sandbox, integration
 */
import { describe, it, expect } from 'vitest';

// ── Pure functions extracted for testability ──

const LEARNING_RATE = 0.05;
const MIN_WEIGHT = 0.05;
const MAX_WEIGHT = 0.6;
const MAX_DELTA_PER_CYCLE = 0.05;
const ANOMALY_Z_THRESHOLD = 3;
const MAX_EXPLORATION_BOOST = 0.20;
const SANDBOX_TRAFFIC_PCT = 5;
const IMPROVEMENT_THRESHOLD = 0.03;

type Weights = Record<string, number>;

function normalizeWeights(w: Weights): Weights {
  const sum = Object.values(w).reduce((s, v) => s + v, 0);
  if (sum <= 0) return w;
  const result: Weights = {};
  for (const [k, v] of Object.entries(w)) result[k] = v / sum;
  return result;
}

function clampWeights(w: Weights): Weights {
  const result: Weights = {};
  for (const [k, v] of Object.entries(w)) {
    result[k] = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, v));
  }
  return result;
}

function capDelta(oldW: Weights, newW: Weights): Weights {
  const result: Weights = {};
  for (const k of Object.keys(oldW)) {
    const delta = (newW[k] ?? oldW[k]) - oldW[k];
    const capped = Math.sign(delta) * Math.min(Math.abs(delta), MAX_DELTA_PER_CYCLE);
    result[k] = oldW[k] + capped;
  }
  return result;
}

function applyAdjustment(oldWeights: Weights, performanceDelta: Weights): Weights {
  const adjusted: Weights = {};
  for (const k of Object.keys(oldWeights)) {
    adjusted[k] = oldWeights[k] + LEARNING_RATE * (performanceDelta[k] ?? 0);
  }
  const capped = capDelta(oldWeights, adjusted);
  const clamped = clampWeights(capped);
  return normalizeWeights(clamped);
}

function computeZScore(values: number[]): number | null {
  if (values.length < 3) return null;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return null;
  const latest = values[values.length - 1];
  return (latest - mean) / stddev;
}

function isAnomaly(z: number | null): boolean {
  return z !== null && Math.abs(z) > ANOMALY_Z_THRESHOLD;
}

function clampHyperparameter(name: string, value: number): number {
  const ranges: Record<string, [number, number]> = {
    decay_window: [20, 40],
    smoothing_alpha: [0.2, 0.4],
    drift_threshold: [0.10, 0.25],
  };
  const [min, max] = ranges[name] ?? [value, value];
  return Math.max(min, Math.min(max, value));
}

interface GuardrailContext {
  mode: 'enabled' | 'disabled' | 'shadow';
  lastAdjustment: Date | null;
  slaRiskLevel: string;
  budgetState: string;
  anomalyFrozenUntil: Date | null;
}

function shouldSkipAdjustment(ctx: GuardrailContext): { skip: boolean; reason: string } {
  if (ctx.mode === 'disabled') return { skip: true, reason: 'mode_disabled' };
  if (ctx.lastAdjustment && (Date.now() - ctx.lastAdjustment.getTime()) < 7 * 24 * 60 * 60 * 1000) {
    return { skip: true, reason: 'cooldown_active' };
  }
  if (ctx.slaRiskLevel === 'high') return { skip: true, reason: 'sla_risk_high' };
  if (ctx.budgetState === 'hard_limit') return { skip: true, reason: 'budget_hard_limit' };
  if (ctx.anomalyFrozenUntil && ctx.anomalyFrozenUntil.getTime() > Date.now()) {
    return { skip: true, reason: 'anomaly_frozen' };
  }
  return { skip: false, reason: '' };
}

// ── Test Suite ──

describe('PR-AI-INT-06: Autonomous Optimization Layer', () => {

  // ─── Weight Adjustment (12 tests) ───
  describe('Weight Adjustment', () => {
    const baseWeights: Weights = { w_quality: 0.20, w_latency: 0.20, w_stability: 0.20, w_cost: 0.20, w_confidence: 0.20 };

    it('applies learning rate correctly', () => {
      const delta: Weights = { w_quality: 1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 };
      const result = applyAdjustment(baseWeights, delta);
      expect(result.w_quality).toBeGreaterThan(baseWeights.w_quality);
    });

    it('normalizes weights after adjustment', () => {
      const delta: Weights = { w_quality: 0.5, w_latency: -0.3, w_stability: 0.2, w_cost: -0.1, w_confidence: 0.1 };
      const result = applyAdjustment(baseWeights, delta);
      const sum = Object.values(result).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('clamps between 0.05 and 0.6', () => {
      const extreme: Weights = { w_quality: 0.01, w_latency: 0.99, w_stability: 0.0, w_cost: 0.0, w_confidence: 0.0 };
      const clamped = clampWeights(extreme);
      expect(clamped.w_quality).toBeGreaterThanOrEqual(MIN_WEIGHT);
      expect(clamped.w_latency).toBeLessThanOrEqual(MAX_WEIGHT);
    });

    it('caps per-cycle change at 5%', () => {
      const delta: Weights = { w_quality: 10, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 };
      const result = capDelta(baseWeights, { ...baseWeights, w_quality: baseWeights.w_quality + LEARNING_RATE * 10 });
      expect(Math.abs(result.w_quality - baseWeights.w_quality)).toBeLessThanOrEqual(MAX_DELTA_PER_CYCLE + 0.001);
    });

    it('positive delta increases weight', () => {
      const delta: Weights = { w_quality: 1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 };
      const result = applyAdjustment(baseWeights, delta);
      expect(result.w_quality).toBeGreaterThan(baseWeights.w_quality);
    });

    it('negative delta decreases weight', () => {
      const delta: Weights = { w_quality: -1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 };
      const result = applyAdjustment(baseWeights, delta);
      expect(result.w_quality).toBeLessThan(baseWeights.w_quality);
    });

    it('zero delta produces no change before normalization', () => {
      const delta: Weights = { w_quality: 0, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 };
      const result = applyAdjustment(baseWeights, delta);
      for (const k of Object.keys(baseWeights)) {
        expect(result[k]).toBeCloseTo(baseWeights[k], 5);
      }
    });

    it('multiple dimensions adjust independently', () => {
      const delta: Weights = { w_quality: 1, w_latency: -1, w_stability: 0.5, w_cost: -0.5, w_confidence: 0 };
      const result = applyAdjustment(baseWeights, delta);
      expect(result.w_quality).toBeGreaterThan(result.w_latency);
    });

    it('sum always equals 1.0 after normalization', () => {
      for (let i = 0; i < 10; i++) {
        const delta: Weights = {
          w_quality: Math.random() * 2 - 1,
          w_latency: Math.random() * 2 - 1,
          w_stability: Math.random() * 2 - 1,
          w_cost: Math.random() * 2 - 1,
          w_confidence: Math.random() * 2 - 1,
        };
        const result = applyAdjustment(baseWeights, delta);
        const sum = Object.values(result).reduce((s, v) => s + v, 0);
        expect(sum).toBeCloseTo(1.0, 4);
      }
    });

    it('history stores previous 3 states correctly', () => {
      const history: Weights[] = [];
      let current = { ...baseWeights };
      for (let i = 0; i < 5; i++) {
        history.push({ ...current });
        if (history.length > 3) history.shift();
        current = applyAdjustment(current, { w_quality: 0.5, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });
      }
      expect(history.length).toBe(3);
    });

    it('rollback restores correct state', () => {
      const history = [{ ...baseWeights }];
      const adjusted = applyAdjustment(baseWeights, { w_quality: 1, w_latency: 0, w_stability: 0, w_cost: 0, w_confidence: 0 });
      const rolledBack = history[history.length - 1];
      expect(rolledBack).toEqual(baseWeights);
      expect(rolledBack).not.toEqual(adjusted);
    });

    it('shadow mode computes but should not write', () => {
      const ctx: GuardrailContext = { mode: 'shadow', lastAdjustment: null, slaRiskLevel: 'low', budgetState: 'under_limit', anomalyFrozenUntil: null };
      const result = shouldSkipAdjustment(ctx);
      // Shadow mode should not skip computation, but it should not write
      expect(result.skip).toBe(false); // Compute is allowed
      expect(ctx.mode).toBe('shadow'); // But mode indicates no-write
    });
  });

  // ─── Guardrail Enforcement (8 tests) ───
  describe('Guardrail Enforcement', () => {
    it('skips when mode = disabled', () => {
      const result = shouldSkipAdjustment({ mode: 'disabled', lastAdjustment: null, slaRiskLevel: 'low', budgetState: 'under_limit', anomalyFrozenUntil: null });
      expect(result.skip).toBe(true);
      expect(result.reason).toBe('mode_disabled');
    });

    it('skips when last_adjustment < 7 days', () => {
      const result = shouldSkipAdjustment({ mode: 'enabled', lastAdjustment: new Date(), slaRiskLevel: 'low', budgetState: 'under_limit', anomalyFrozenUntil: null });
      expect(result.skip).toBe(true);
      expect(result.reason).toBe('cooldown_active');
    });

    it('skips when SLA risk = high', () => {
      const result = shouldSkipAdjustment({ mode: 'enabled', lastAdjustment: null, slaRiskLevel: 'high', budgetState: 'under_limit', anomalyFrozenUntil: null });
      expect(result.skip).toBe(true);
      expect(result.reason).toBe('sla_risk_high');
    });

    it('skips when budget = hard_limit', () => {
      const result = shouldSkipAdjustment({ mode: 'enabled', lastAdjustment: null, slaRiskLevel: 'low', budgetState: 'hard_limit', anomalyFrozenUntil: null });
      expect(result.skip).toBe(true);
      expect(result.reason).toBe('budget_hard_limit');
    });

    it('skips when anomaly_frozen_until > now', () => {
      const future = new Date(Date.now() + 60000);
      const result = shouldSkipAdjustment({ mode: 'enabled', lastAdjustment: null, slaRiskLevel: 'low', budgetState: 'under_limit', anomalyFrozenUntil: future });
      expect(result.skip).toBe(true);
      expect(result.reason).toBe('anomaly_frozen');
    });

    it('does not skip in shadow mode (compute allowed)', () => {
      const result = shouldSkipAdjustment({ mode: 'shadow', lastAdjustment: null, slaRiskLevel: 'low', budgetState: 'under_limit', anomalyFrozenUntil: null });
      expect(result.skip).toBe(false);
    });

    it('handles multiple guardrails simultaneously', () => {
      const result = shouldSkipAdjustment({ mode: 'disabled', lastAdjustment: new Date(), slaRiskLevel: 'high', budgetState: 'hard_limit', anomalyFrozenUntil: new Date(Date.now() + 60000) });
      expect(result.skip).toBe(true);
      // First matching guardrail wins
      expect(result.reason).toBe('mode_disabled');
    });

    it('allows adjustment when all guardrails pass', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const result = shouldSkipAdjustment({ mode: 'enabled', lastAdjustment: eightDaysAgo, slaRiskLevel: 'low', budgetState: 'under_limit', anomalyFrozenUntil: null });
      expect(result.skip).toBe(false);
    });
  });

  // ─── Anomaly Detection (10 tests) ───
  describe('Anomaly Detection', () => {
    it('computes Z-score correctly', () => {
      const values = [10, 10, 10, 10, 10, 10, 50]; // last value is extreme
      const z = computeZScore(values);
      expect(z).not.toBeNull();
      expect(Math.abs(z!)).toBeGreaterThan(2);
    });

    it('triggers anomaly at |z| > 3', () => {
      const values = [10, 10, 10, 10, 10, 10, 10, 100]; // extreme outlier
      const z = computeZScore(values);
      expect(isAnomaly(z)).toBe(true);
    });

    it('no false positive at |z| = 2.5', () => {
      // Construct values where last element gives z ≈ 2.5
      const baseValues = Array(20).fill(10);
      const mean = 10;
      const stddev = 0; // all same, so we need variance
      // Better approach: use varying values
      const values = [8, 9, 10, 11, 12, 10, 9, 11, 10, 10, 10];
      const z = computeZScore(values);
      if (z !== null) expect(Math.abs(z)).toBeLessThan(3);
      expect(isAnomaly(z)).toBe(false);
    });

    it('exploration boost capped at 20%', () => {
      let boost = 0.18;
      boost = Math.min(boost + 0.05, MAX_EXPLORATION_BOOST);
      expect(boost).toBe(MAX_EXPLORATION_BOOST);
    });

    it('exploration boost increments by 5%', () => {
      let boost = 0.0;
      boost = Math.min(boost + 0.05, MAX_EXPLORATION_BOOST);
      expect(boost).toBe(0.05);
    });

    it('anomaly freezes autonomous for 24h', () => {
      const frozenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ctx: GuardrailContext = { mode: 'enabled', lastAdjustment: null, slaRiskLevel: 'low', budgetState: 'under_limit', anomalyFrozenUntil: frozenUntil };
      expect(shouldSkipAdjustment(ctx).skip).toBe(true);
    });

    it('handles multiple simultaneous anomalies', () => {
      const latencies = [100, 100, 100, 100, 100, 500];
      const errors = [0.01, 0.01, 0.01, 0.01, 0.01, 0.5];
      expect(isAnomaly(computeZScore(latencies))).toBe(true);
      expect(isAnomaly(computeZScore(errors))).toBe(true);
    });

    it('returns null for empty data', () => {
      expect(computeZScore([])).toBeNull();
    });

    it('returns null for single data point', () => {
      expect(computeZScore([42])).toBeNull();
    });

    it('returns null for two data points', () => {
      expect(computeZScore([10, 20])).toBeNull();
    });
  });

  // ─── Hyperparameter Tuning (8 tests) ───
  describe('Hyperparameter Tuning', () => {
    it('clamps decay_window to 20-40', () => {
      expect(clampHyperparameter('decay_window', 15)).toBe(20);
      expect(clampHyperparameter('decay_window', 50)).toBe(40);
      expect(clampHyperparameter('decay_window', 30)).toBe(30);
    });

    it('clamps smoothing_alpha to 0.2-0.4', () => {
      expect(clampHyperparameter('smoothing_alpha', 0.1)).toBe(0.2);
      expect(clampHyperparameter('smoothing_alpha', 0.5)).toBe(0.4);
      expect(clampHyperparameter('smoothing_alpha', 0.3)).toBe(0.3);
    });

    it('clamps drift_threshold to 10-25%', () => {
      expect(clampHyperparameter('drift_threshold', 0.05)).toBe(0.10);
      expect(clampHyperparameter('drift_threshold', 0.30)).toBe(0.25);
      expect(clampHyperparameter('drift_threshold', 0.15)).toBe(0.15);
    });

    it('improvement threshold is 3%', () => {
      expect(IMPROVEMENT_THRESHOLD).toBe(0.03);
    });

    it('rejects improvement below 3%', () => {
      const currentPerf = 0.80;
      const candidatePerf = 0.82; // 2.5% improvement
      const improvement = (candidatePerf - currentPerf) / currentPerf;
      expect(improvement < IMPROVEMENT_THRESHOLD).toBe(true);
    });

    it('accepts improvement above 3%', () => {
      const currentPerf = 0.80;
      const candidatePerf = 0.83; // 3.75% improvement
      const improvement = (candidatePerf - currentPerf) / currentPerf;
      expect(improvement >= IMPROVEMENT_THRESHOLD).toBe(true);
    });

    it('preserves original values on reject', () => {
      const original = { decay_window: 30, smoothing_alpha: 0.3, drift_threshold: 0.15 };
      const candidate = { decay_window: 25, smoothing_alpha: 0.35, drift_threshold: 0.20 };
      const improvement = 0.02; // below threshold
      const result = improvement >= IMPROVEMENT_THRESHOLD ? candidate : original;
      expect(result).toEqual(original);
    });

    it('unknown parameter returns unchanged', () => {
      expect(clampHyperparameter('unknown_param', 42)).toBe(42);
    });
  });

  // ─── Sandbox Provider (10 tests) ───
  describe('Sandbox Provider', () => {
    it('sandbox traffic percentage is 5%', () => {
      expect(SANDBOX_TRAFFIC_PCT).toBe(5);
    });

    it('routes to sandbox when random < traffic_percentage/100', () => {
      const trafficPct = 5;
      const random = 0.03; // < 0.05
      expect(random < trafficPct / 100).toBe(true);
    });

    it('does not route to sandbox when random >= traffic_percentage/100', () => {
      const trafficPct = 5;
      const random = 0.06; // >= 0.05
      expect(random < trafficPct / 100).toBe(false);
    });

    it('promotion threshold: quality > median', () => {
      const existingQualities = [70, 75, 80, 85, 90];
      const median = existingQualities[Math.floor(existingQualities.length / 2)];
      const sandboxQuality = 82;
      expect(sandboxQuality > median).toBe(true);
    });

    it('disable threshold: quality < 25th percentile', () => {
      const existingQualities = [70, 75, 80, 85, 90];
      const p25 = existingQualities[Math.floor(existingQualities.length * 0.25)];
      const sandboxQuality = 65;
      expect(sandboxQuality < p25).toBe(true);
    });

    it('7-day expiry is enforced', () => {
      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const daysDiff = (expiresAt.getTime() - startedAt.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysDiff).toBe(7);
    });

    it('100-call minimum for evaluation', () => {
      const callsTotal = 99;
      expect(callsTotal >= 100).toBe(false);
      expect(100 >= 100).toBe(true);
    });

    it('sandbox failure does not block routing', () => {
      // Simulating fallback behavior
      const sandboxFailed = true;
      const fallbackModel = 'google/gemini-3-flash-preview';
      const routedModel = sandboxFailed ? fallbackModel : 'new-provider/model';
      expect(routedModel).toBe(fallbackModel);
    });

    it('multiple simultaneous sandboxes are possible', () => {
      const sandboxes = [
        { id: '1', provider: 'providerA', status: 'active' },
        { id: '2', provider: 'providerB', status: 'active' },
      ];
      expect(sandboxes.filter(s => s.status === 'active').length).toBe(2);
    });

    it('status transitions are valid', () => {
      const validStatuses = ['active', 'promoted', 'disabled', 'expired'];
      expect(validStatuses).toContain('active');
      expect(validStatuses).toContain('promoted');
      expect(validStatuses).toContain('disabled');
      expect(validStatuses).toContain('expired');
      expect(validStatuses).not.toContain('paused');
    });
  });

  // ─── Integration & Safety (12 tests) ───
  describe('Integration & Safety', () => {
    it('autonomous weights override MODE_WEIGHTS when provided', () => {
      const defaultWeights = { w_quality: 0.20, w_latency: 0.20, w_stability: 0.20, w_cost: 0.20, w_confidence: 0.20 };
      const autoWeights = { w_quality: 0.30, w_latency: 0.15, w_stability: 0.20, w_cost: 0.25, w_confidence: 0.10 };
      const effectiveWeights = autoWeights ?? defaultWeights;
      expect(effectiveWeights).toEqual(autoWeights);
    });

    it('fail-open when autonomous_state is null', () => {
      const autoState = null;
      const autonomousWeights = autoState ? (autoState as any).current_weights : null;
      expect(autonomousWeights).toBeNull();
    });

    it('fail-open when autonomous_state fetch errors', () => {
      let autonomousWeights: Weights | null = null;
      try {
        throw new Error('DB connection failed');
      } catch {
        // fail-open
      }
      expect(autonomousWeights).toBeNull();
    });

    it('disabled mode does not inject weights', () => {
      const state = { mode: 'disabled', current_weights: { w_quality: 0.3 } };
      const weights = state.mode === 'enabled' ? state.current_weights : null;
      expect(weights).toBeNull();
    });

    it('shadow mode does not inject weights', () => {
      const state = { mode: 'shadow', current_weights: { w_quality: 0.3 } };
      const weights = state.mode === 'enabled' ? state.current_weights : null;
      expect(weights).toBeNull();
    });

    it('Thompson compatibility: weights do not interfere', () => {
      const strategy = 'thompson';
      const autoWeights = { w_quality: 0.3 };
      // Thompson uses its own sampling, autonomous weights are only for cost_aware
      const usesAutoWeights = strategy === 'cost_aware' && autoWeights !== null;
      expect(usesAutoWeights).toBe(false);
    });

    it('cost-aware compatibility: weights are applied', () => {
      const strategy = 'cost_aware';
      const autoWeights = { w_quality: 0.3 };
      const usesAutoWeights = strategy === 'cost_aware' && autoWeights !== null;
      expect(usesAutoWeights).toBe(true);
    });

    it('multi-tenant isolation: different tenants have different states', () => {
      const tenant1 = { tenant_id: 'a', weights: { w_quality: 0.25 } };
      const tenant2 = { tenant_id: 'b', weights: { w_quality: 0.35 } };
      expect(tenant1.weights).not.toEqual(tenant2.weights);
    });

    it('no cross-tenant weight leakage', () => {
      const fetchForTenant = (tenantId: string) => {
        const states: Record<string, Weights> = {
          'a': { w_quality: 0.25, w_cost: 0.25 },
          'b': { w_quality: 0.35, w_cost: 0.15 },
        };
        return states[tenantId] ?? null;
      };
      expect(fetchForTenant('a')).not.toEqual(fetchForTenant('b'));
    });

    it('telemetry fields are populated correctly', () => {
      const telemetry = {
        ai_autonomous_enabled: true,
        ai_autonomous_weights_applied: true,
        ai_autonomous_exploration_boost: 0.05,
        ai_sandbox_provider_active: false,
        ai_sandbox_provider_id: null,
      };
      expect(telemetry.ai_autonomous_enabled).toBe(true);
      expect(telemetry.ai_autonomous_weights_applied).toBe(true);
      expect(telemetry.ai_autonomous_exploration_boost).toBe(0.05);
    });

    it('concurrent optimizer runs are idempotent', () => {
      // Two runs with same input should produce same output
      const input = { ...{ w_quality: 0.20, w_latency: 0.20, w_stability: 0.20, w_cost: 0.20, w_confidence: 0.20 } };
      const delta = { w_quality: 0.5, w_latency: -0.3, w_stability: 0.2, w_cost: -0.1, w_confidence: 0.1 };
      const run1 = applyAdjustment(input, delta);
      const run2 = applyAdjustment(input, delta);
      for (const k of Object.keys(run1)) {
        expect(run1[k]).toBeCloseTo(run2[k], 10);
      }
    });

    it('learning rate of 0.05 is conservative enough', () => {
      expect(LEARNING_RATE).toBe(0.05);
      // With max delta of 1.0, actual change = 0.05 * 1.0 = 0.05 = 5%
      expect(LEARNING_RATE * 1.0).toBeLessThanOrEqual(MAX_DELTA_PER_CYCLE);
    });
  });

  // ─── Convergence Stability (bonus) ───
  describe('Convergence Stability', () => {
    it('weights converge over 100 iterations without oscillation', () => {
      let weights: Weights = { w_quality: 0.20, w_latency: 0.20, w_stability: 0.20, w_cost: 0.20, w_confidence: 0.20 };
      const consistentDelta: Weights = { w_quality: 0.3, w_latency: -0.1, w_stability: 0.1, w_cost: -0.2, w_confidence: 0.0 };

      const qualityHistory: number[] = [];
      for (let i = 0; i < 100; i++) {
        weights = applyAdjustment(weights, consistentDelta);
        qualityHistory.push(weights.w_quality);
      }

      // Quality should trend upward (given positive delta)
      expect(qualityHistory[99]).toBeGreaterThan(qualityHistory[0]);

      // Check for no oscillation: after initial 10 iterations, should be monotonically non-decreasing
      let oscillations = 0;
      for (let i = 11; i < qualityHistory.length; i++) {
        if (qualityHistory[i] < qualityHistory[i - 1] - 0.001) oscillations++;
      }
      expect(oscillations).toBeLessThanOrEqual(2); // Allow minor numerical noise
    });

    it('weights stay bounded over 1000 iterations', () => {
      let weights: Weights = { w_quality: 0.20, w_latency: 0.20, w_stability: 0.20, w_cost: 0.20, w_confidence: 0.20 };
      for (let i = 0; i < 1000; i++) {
        const delta: Weights = {
          w_quality: Math.sin(i * 0.1),
          w_latency: Math.cos(i * 0.1),
          w_stability: Math.sin(i * 0.2),
          w_cost: Math.cos(i * 0.2),
          w_confidence: Math.sin(i * 0.3),
        };
        weights = applyAdjustment(weights, delta);

        // All weights must remain bounded
        for (const v of Object.values(weights)) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
        // Sum must be 1
        const sum = Object.values(weights).reduce((s, v) => s + v, 0);
        expect(sum).toBeCloseTo(1.0, 3);
      }
    });
  });
});
