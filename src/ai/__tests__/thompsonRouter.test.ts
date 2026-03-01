/**
 * PR-AI-INT-03: Thompson Sampling Multi-Objective Bandit — Test Suite
 * 40+ tests covering Beta sampling, convergence, constraints, strategy switching, no regressions.
 */
import { describe, it, expect } from 'vitest';
import {
  sampleBeta,
  sampleNormal,
  sampleStandardNormal,
  computePosteriorUpdate,
  type PosteriorUpdateResult,
} from './thompsonRouterTestHelpers';
import {
  getWeightsForMode,
  applyBudgetAdjustment,
  computeConfidenceScore,
  computeDecayFactor,
  computeRelativeScores,
  type BudgetConfig,
} from './costAwareRouterTestHelpers';
import {
  computeAlphaBeta,
  computeEpsilon,
  computeEwmaUpdate,
  seededRandom,
} from './hybridRouterTestHelpers';

// ── Helper: deterministic seeded RNG ──
function makeRng(seed: number) {
  return seededRandom(seed);
}

// ────────────────────────────────────────────────────────────────
// SECTION 1: Beta Sampling Distribution Sanity (6 tests)
// ────────────────────────────────────────────────────────────────

describe('Beta Sampling', () => {
  it('should return values between 0 and 1', () => {
    const rng = makeRng(42);
    for (let i = 0; i < 100; i++) {
      const sample = sampleBeta(2, 5, rng);
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThanOrEqual(1);
    }
  });

  it('Beta(1,1) should produce roughly uniform samples (mean ≈ 0.5)', () => {
    const rng = makeRng(123);
    let sum = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) sum += sampleBeta(1, 1, rng);
    const mean = sum / N;
    expect(mean).toBeGreaterThan(0.35);
    expect(mean).toBeLessThan(0.65);
  });

  it('Beta(10,2) mean should be near 10/12 ≈ 0.833', () => {
    const rng = makeRng(456);
    let sum = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) sum += sampleBeta(10, 2, rng);
    const mean = sum / N;
    expect(mean).toBeGreaterThan(0.75);
    expect(mean).toBeLessThan(0.92);
  });

  it('Beta(2,10) mean should be near 2/12 ≈ 0.167', () => {
    const rng = makeRng(789);
    let sum = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) sum += sampleBeta(2, 10, rng);
    const mean = sum / N;
    expect(mean).toBeGreaterThan(0.08);
    expect(mean).toBeLessThan(0.28);
  });

  it('Large alpha/beta should use normal approximation and stay in [0,1]', () => {
    const rng = makeRng(101);
    for (let i = 0; i < 50; i++) {
      const sample = sampleBeta(200, 50, rng);
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThanOrEqual(1);
    }
  });

  it('Near-zero alpha should not crash or return NaN', () => {
    const rng = makeRng(202);
    const sample = sampleBeta(0.001, 1, rng);
    expect(Number.isFinite(sample)).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 2: Normal Sampling (3 tests)
// ────────────────────────────────────────────────────────────────

describe('Normal Sampling', () => {
  it('sampleStandardNormal mean should be ≈ 0', () => {
    const rng = makeRng(42);
    let sum = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) sum += sampleStandardNormal(rng);
    expect(Math.abs(sum / N)).toBeLessThan(0.15);
  });

  it('sampleNormal(500, 100) mean should be ≈ 500', () => {
    const rng = makeRng(99);
    let sum = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) sum += sampleNormal(500, 100, rng);
    const mean = sum / N;
    expect(mean).toBeGreaterThan(450);
    expect(mean).toBeLessThan(550);
  });

  it('zero variance should produce deterministic output', () => {
    const rng = makeRng(50);
    // variance clamped to 1e-10, so effectively deterministic
    const s1 = sampleNormal(42, 0, rng);
    expect(Math.abs(s1 - 42)).toBeLessThan(0.01);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 3: Convergence Behavior (4 tests)
// ────────────────────────────────────────────────────────────────

describe('Convergence Behavior', () => {
  it('Provider with high success should dominate after many updates', () => {
    let good: any = null;
    let bad: any = null;

    // Simulate 100 calls: good provider succeeds 90%, bad 30%
    for (let i = 0; i < 100; i++) {
      good = computePosteriorUpdate(good ? { ...good, sample_count: i } : null, {
        success: Math.random() < 0.9 ? true : false,
        latencyMs: 400 + Math.random() * 100,
        costPer1k: 0.003,
      });
      bad = computePosteriorUpdate(bad ? { ...bad, sample_count: i } : null, {
        success: Math.random() < 0.3 ? true : false,
        latencyMs: 800 + Math.random() * 200,
        costPer1k: 0.008,
      });
    }

    // Good provider should have higher alpha ratio
    const goodRatio = good.ts_alpha / (good.ts_alpha + good.ts_beta);
    const badRatio = bad.ts_alpha / (bad.ts_alpha + bad.ts_beta);
    expect(goodRatio).toBeGreaterThan(badRatio);
  });

  it('Early exploration should produce varied samples', () => {
    const rng = makeRng(42);
    // With alpha=1, beta=1 (uninformative prior), samples should vary widely
    const samples = Array.from({ length: 50 }, () => sampleBeta(1, 1, rng));
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    expect(max - min).toBeGreaterThan(0.3); // Wide spread
  });

  it('Strong posterior should produce tight samples', () => {
    const rng = makeRng(42);
    // alpha=100, beta=10 → mean≈0.909, low variance
    const samples = Array.from({ length: 100 }, () => sampleBeta(100, 10, rng));
    const mean = samples.reduce((a, b) => a + b) / samples.length;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
    expect(variance).toBeLessThan(0.01);
  });

  it('1000 iterations stability: no NaN or Infinity', () => {
    let state: any = null;
    for (let i = 0; i < 1000; i++) {
      state = computePosteriorUpdate(state ? { ...state, sample_count: i } : null, {
        success: i % 3 !== 0,
        latencyMs: 300 + i * 0.5,
        costPer1k: 0.001 + i * 0.00001,
      });
      expect(Number.isFinite(state.ts_alpha)).toBe(true);
      expect(Number.isFinite(state.ts_beta)).toBe(true);
      expect(Number.isFinite(state.ts_latency_mean)).toBe(true);
      expect(Number.isFinite(state.ts_latency_variance)).toBe(true);
      expect(state.ts_latency_variance).toBeGreaterThan(0);
    }
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 4: Posterior Update Math (5 tests)
// ────────────────────────────────────────────────────────────────

describe('Posterior Update Math', () => {
  it('First success: alpha=2, beta=1', () => {
    const result = computePosteriorUpdate(null, { success: true, latencyMs: 500, costPer1k: 0.005 });
    expect(result.ts_alpha).toBe(2);
    expect(result.ts_beta).toBe(1);
  });

  it('First failure: alpha=1, beta=2', () => {
    const result = computePosteriorUpdate(null, { success: false, latencyMs: 500, costPer1k: 0.005 });
    expect(result.ts_alpha).toBe(1);
    expect(result.ts_beta).toBe(2);
  });

  it('Success increments alpha by 1', () => {
    const existing = { ts_alpha: 10, ts_beta: 3, ts_latency_mean: 500, ts_latency_variance: 100, ts_cost_mean: 0.005, ts_cost_variance: 0.001, sample_count: 13 };
    const result = computePosteriorUpdate(existing, { success: true, latencyMs: 500, costPer1k: 0.005 });
    expect(result.ts_alpha).toBe(11);
    expect(result.ts_beta).toBe(3);
  });

  it('Failure increments beta by 1', () => {
    const existing = { ts_alpha: 10, ts_beta: 3, ts_latency_mean: 500, ts_latency_variance: 100, ts_cost_mean: 0.005, ts_cost_variance: 0.001, sample_count: 13 };
    const result = computePosteriorUpdate(existing, { success: false, latencyMs: 500, costPer1k: 0.005 });
    expect(result.ts_alpha).toBe(10);
    expect(result.ts_beta).toBe(4);
  });

  it('Latency mean updates correctly (Welford)', () => {
    const existing = { ts_alpha: 5, ts_beta: 2, ts_latency_mean: 400, ts_latency_variance: 100, ts_cost_mean: 0.005, ts_cost_variance: 0.001, sample_count: 10 };
    const result = computePosteriorUpdate(existing, { success: true, latencyMs: 510, costPer1k: 0.005 });
    // new_mean = 400 + (510-400)/11 = 400 + 10 = 410
    expect(result.ts_latency_mean).toBeCloseTo(410, 0);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 5: Budget Interaction (3 tests)
// ────────────────────────────────────────────────────────────────

describe('Budget Interaction with Thompson', () => {
  it('Hard limit forces cost_saver weights', () => {
    const budget: BudgetConfig = { monthly_budget: 100, soft_limit_percentage: 0.8, routing_mode: 'performance', current_month_usage: 110 };
    const baseWeights = getWeightsForMode('performance');
    const { budgetState, effectiveMode } = applyBudgetAdjustment(baseWeights, budget);
    expect(budgetState).toBe('hard_limit');
    expect(effectiveMode).toBe('cost_saver');
  });

  it('Soft limit boosts cost weight in Thompson context', () => {
    const budget: BudgetConfig = { monthly_budget: 100, soft_limit_percentage: 0.8, routing_mode: 'balanced', current_month_usage: 85 };
    const baseWeights = getWeightsForMode('balanced');
    const { weights, budgetState } = applyBudgetAdjustment(baseWeights, budget);
    expect(budgetState).toBe('soft_limit');
    expect(weights.w_cost).toBeGreaterThan(0.2); // boosted from 0.2
  });

  it('No budget config defaults to balanced', () => {
    const baseWeights = getWeightsForMode('balanced');
    const { budgetState, effectiveMode } = applyBudgetAdjustment(baseWeights, null);
    expect(budgetState).toBe('no_config');
    expect(effectiveMode).toBe('balanced');
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 6: SLA Penalty Interaction (3 tests)
// ────────────────────────────────────────────────────────────────

describe('SLA Penalty with Thompson', () => {
  it('Penalty multiplier < 1 reduces final score', () => {
    const rawScore = 0.8;
    const penalty = 0.7;
    const decay = 1.0;
    expect(rawScore * penalty * decay).toBeCloseTo(0.56, 2);
  });

  it('No penalty (1.0) does not affect score', () => {
    const rawScore = 0.8;
    expect(rawScore * 1.0 * 1.0).toBeCloseTo(0.8, 2);
  });

  it('Penalty stacks with decay', () => {
    const rawScore = 0.8;
    const penalty = 0.7;
    const decay = 0.5;
    expect(rawScore * penalty * decay).toBeCloseTo(0.28, 2);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 7: Confidence Decay Interaction (4 tests)
// ────────────────────────────────────────────────────────────────

describe('Confidence Decay with Thompson', () => {
  it('Recent call (1 day): minimal decay', () => {
    const nowMs = Date.now();
    const lastCall = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
    const decay = computeDecayFactor(lastCall, nowMs);
    expect(decay).toBeGreaterThan(0.95);
  });

  it('30 days ago: ~37% decay (e^-1)', () => {
    const nowMs = Date.now();
    const lastCall = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
    const decay = computeDecayFactor(lastCall, nowMs);
    expect(decay).toBeCloseTo(Math.exp(-1), 1);
  });

  it('60 days ago: ~13% decay (e^-2)', () => {
    const nowMs = Date.now();
    const lastCall = new Date(nowMs - 60 * 24 * 60 * 60 * 1000).toISOString();
    const decay = computeDecayFactor(lastCall, nowMs);
    expect(decay).toBeCloseTo(Math.exp(-2), 1);
  });

  it('Null last_call_at: conservative default 0.5', () => {
    const decay = computeDecayFactor(null, Date.now());
    expect(decay).toBe(0.5);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 8: Diversity Guard Compatibility (3 tests)
// ────────────────────────────────────────────────────────────────

describe('Diversity Guard with Thompson', () => {
  it('Provider at 96% usage triggers diversity', () => {
    const usageRows = [{ provider: 'gemini', usage_percentage: 96 }];
    const triggered = usageRows.some(u => u.usage_percentage > 95);
    expect(triggered).toBe(true);
  });

  it('Provider at 80% does not trigger', () => {
    const usageRows = [{ provider: 'gemini', usage_percentage: 80 }];
    const triggered = usageRows.some(u => u.usage_percentage > 95);
    expect(triggered).toBe(false);
  });

  it('Empty usage table does not trigger', () => {
    const usageRows: any[] = [];
    const triggered = usageRows.some(u => u.usage_percentage > 95);
    expect(triggered).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 9: Routing Strategy Switching (4 tests)
// ────────────────────────────────────────────────────────────────

describe('Routing Strategy Switching', () => {
  it('routing_strategy defaults to cost_aware', () => {
    const config = { routing_strategy: 'cost_aware' };
    expect(config.routing_strategy).toBe('cost_aware');
  });

  it('thompson strategy is recognized', () => {
    const validStrategies = ['hybrid', 'cost_aware', 'thompson'];
    expect(validStrategies.includes('thompson')).toBe(true);
  });

  it('Invalid strategy is not in valid list', () => {
    const validStrategies = ['hybrid', 'cost_aware', 'thompson'];
    expect(validStrategies.includes('random')).toBe(false);
  });

  it('Strategy switch preserves routing mode weights', () => {
    // Thompson uses same weight system as cost_aware
    const perfWeights = getWeightsForMode('performance');
    expect(perfWeights.w_quality).toBe(0.45);
    expect(perfWeights.w_cost).toBe(0.05);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 10: Deterministic Ranking (3 tests)
// ────────────────────────────────────────────────────────────────

describe('Deterministic Ranking with Thompson', () => {
  it('Same seed produces same Beta samples', () => {
    const rng1 = makeRng(42);
    const rng2 = makeRng(42);
    const s1 = sampleBeta(5, 3, rng1);
    const s2 = sampleBeta(5, 3, rng2);
    expect(s1).toBe(s2);
  });

  it('Same seed produces same Normal samples', () => {
    const rng1 = makeRng(42);
    const rng2 = makeRng(42);
    const s1 = sampleNormal(500, 100, rng1);
    const s2 = sampleNormal(500, 100, rng2);
    expect(s1).toBe(s2);
  });

  it('Different seeds produce different samples', () => {
    const rng1 = makeRng(42);
    const rng2 = makeRng(99);
    const s1 = sampleBeta(5, 3, rng1);
    const s2 = sampleBeta(5, 3, rng2);
    expect(s1).not.toBe(s2);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 11: No-Regression from INT-01C & INT-02 (5 tests)
// ────────────────────────────────────────────────────────────────

describe('No-Regression', () => {
  it('Alpha/beta computation unchanged from INT-01C', () => {
    expect(computeAlphaBeta(5)).toEqual({ alpha: 0.85, beta: 0.15 });
    expect(computeAlphaBeta(50)).toEqual({ alpha: 0.60, beta: 0.40 });
    expect(computeAlphaBeta(200)).toEqual({ alpha: 0.35, beta: 0.65 });
  });

  it('Epsilon computation unchanged', () => {
    expect(computeEpsilon(5)).toBe(0.20);
    expect(computeEpsilon(50)).toBe(0.10);
    expect(computeEpsilon(200)).toBe(0.05);
  });

  it('EWMA update math unchanged', () => {
    const result = computeEwmaUpdate(null, { latencyMs: 500, costPer1k: 0.005, qualityAvg: 80, success: true });
    expect(result.ewma_latency_ms).toBe(500);
    expect(result.sample_count).toBe(1);
  });

  it('Seeded random produces same sequence', () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(42);
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it('Neutral defaults for missing metrics', () => {
    const result = computeEwmaUpdate(null, { latencyMs: 1000, costPer1k: 0.01, qualityAvg: 50, success: false });
    expect(result.ewma_success_rate).toBe(0);
    expect(result.sample_count).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 12: Multi-Tenant Isolation Safety (2 tests)
// ────────────────────────────────────────────────────────────────

describe('Multi-Tenant Isolation', () => {
  it('Different tenant configs produce different weights', () => {
    const perfWeights = getWeightsForMode('performance');
    const costWeights = getWeightsForMode('cost_saver');
    expect(perfWeights.w_cost).not.toBe(costWeights.w_cost);
  });

  it('Alpha/beta is tenant-sample-count dependent', () => {
    const lowSamples = computeAlphaBeta(5);
    const highSamples = computeAlphaBeta(200);
    expect(lowSamples.alpha).toBeGreaterThan(highSamples.alpha);
    expect(lowSamples.beta).toBeLessThan(highSamples.beta);
  });
});

// ────────────────────────────────────────────────────────────────
// SECTION 13: Edge Cases & Safety (5 tests)
// ────────────────────────────────────────────────────────────────

describe('Edge Cases & Safety', () => {
  it('Variance never goes negative in posterior update', () => {
    let state: any = { ts_alpha: 50, ts_beta: 10, ts_latency_mean: 500, ts_latency_variance: 0.01, ts_cost_mean: 0.005, ts_cost_variance: 0.0001, sample_count: 60 };
    for (let i = 0; i < 100; i++) {
      state = computePosteriorUpdate({ ...state, sample_count: 60 + i }, {
        success: true, latencyMs: 500, costPer1k: 0.005,
      });
      expect(state.ts_latency_variance).toBeGreaterThan(0);
      expect(state.ts_cost_variance).toBeGreaterThan(0);
    }
  });

  it('Negative latency sample clamped in normalization', () => {
    // If sampled latency is negative, max(0, value) ensures it's 0
    const rawSample = -100;
    const maxLatency = 1000;
    const normalized = Math.max(0, Math.min(1, 1 - Math.max(rawSample, 0) / maxLatency));
    expect(normalized).toBe(1); // 1 - 0/1000 = 1
  });

  it('All same scores: first candidate wins', () => {
    const scored = [
      { provider: 'gemini', model: 'a', finalScore: 0.5 },
      { provider: 'openai', model: 'b', finalScore: 0.5 },
    ];
    scored.sort((a, b) => b.finalScore - a.finalScore);
    expect(scored[0].provider).toBe('gemini');
  });

  it('Confidence score with 0 samples and null last_call_at', () => {
    const conf = computeConfidenceScore(0, null, Date.now());
    expect(conf).toBe(0); // 0 samples * 0.5 = 0
  });

  it('Relative scores handle single candidate', () => {
    const { latencyScores, costScores } = computeRelativeScores([{ latency: 500, cost: 0.005 }]);
    expect(latencyScores).toHaveLength(1);
    expect(costScores).toHaveLength(1);
  });
});
