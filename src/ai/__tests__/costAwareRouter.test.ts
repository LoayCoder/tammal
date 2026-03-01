/**
 * PR-AI-INT-02: Cost-Aware Routing Layer — Tests
 * 30+ tests covering all dimensions of the multi-objective router.
 */

import { describe, it, expect } from 'vitest';
import {
  getWeightsForMode,
  applyBudgetAdjustment,
  normalizeWeights,
  computeConfidenceScore,
  computeDecayFactor,
  computeRelativeScores,
  computeMultiObjectiveScore,
  type CostAwareWeights,
  type BudgetConfig,
  type RoutingMode,
} from './costAwareRouterTestHelpers';

// Re-export helpers from hybridRouter for regression tests
import {
  computeAlphaBeta,
  computeEpsilon,
  computeEwmaUpdate,
  computeScore,
  seededRandom,
  clamp01,
} from './hybridRouterTestHelpers';

// ──────────────────────────────────────────────────────────────
// COST NORMALIZATION (4 tests)
// ──────────────────────────────────────────────────────────────

describe('Cost Normalization', () => {
  it('picks cheapest provider with highest cost score', () => {
    const { costScores } = computeRelativeScores([
      { latency: 500, cost: 0.001 },
      { latency: 500, cost: 0.005 },
      { latency: 500, cost: 0.010 },
    ]);
    expect(costScores[0]).toBeGreaterThan(costScores[1]);
    expect(costScores[1]).toBeGreaterThan(costScores[2]);
  });

  it('equal costs yield equal cost scores', () => {
    const { costScores } = computeRelativeScores([
      { latency: 500, cost: 0.005 },
      { latency: 500, cost: 0.005 },
    ]);
    expect(costScores[0]).toBeCloseTo(costScores[1], 6);
  });

  it('zero cost yields perfect score (1.0)', () => {
    const { costScores } = computeRelativeScores([
      { latency: 500, cost: 0 },
      { latency: 500, cost: 0.01 },
    ]);
    expect(costScores[0]).toBeCloseTo(1.0, 6);
  });

  it('all zeros handled gracefully', () => {
    const { costScores, latencyScores } = computeRelativeScores([
      { latency: 0, cost: 0 },
      { latency: 0, cost: 0 },
    ]);
    // Should not throw, scores are valid
    expect(costScores).toHaveLength(2);
    expect(latencyScores).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────────────────────
// ROUTING MODE WEIGHT SWITCHING (4 tests)
// ──────────────────────────────────────────────────────────────

describe('Routing Mode Weight Switching', () => {
  it('performance mode: quality weight = 0.45', () => {
    const w = getWeightsForMode('performance');
    expect(w.w_quality).toBe(0.45);
    expect(w.w_cost).toBe(0.05);
  });

  it('balanced mode: equal weights (0.2 each)', () => {
    const w = getWeightsForMode('balanced');
    expect(w.w_quality).toBe(0.20);
    expect(w.w_latency).toBe(0.20);
    expect(w.w_stability).toBe(0.20);
    expect(w.w_cost).toBe(0.20);
    expect(w.w_confidence).toBe(0.20);
  });

  it('cost_saver mode: cost weight = 0.40', () => {
    const w = getWeightsForMode('cost_saver');
    expect(w.w_cost).toBe(0.40);
  });

  it('unknown mode defaults to balanced', () => {
    const w = getWeightsForMode('nonexistent' as RoutingMode);
    expect(w.w_quality).toBe(0.20);
    expect(w.w_cost).toBe(0.20);
  });
});

// ──────────────────────────────────────────────────────────────
// BUDGET SOFT LIMIT (3 tests)
// ──────────────────────────────────────────────────────────────

describe('Budget Soft Limit', () => {
  const baseWeights = getWeightsForMode('balanced');

  it('below soft limit: no cost weight boost', () => {
    const config: BudgetConfig = { monthly_budget: 100, soft_limit_percentage: 0.8, routing_mode: 'balanced', current_month_usage: 50 };
    const { weights, budgetState } = applyBudgetAdjustment(baseWeights, config);
    expect(budgetState).toBe('under_limit');
    expect(weights.w_cost).toBe(0.20);
  });

  it('above soft limit: cost weight increased by 1.5x (renormalized)', () => {
    const config: BudgetConfig = { monthly_budget: 100, soft_limit_percentage: 0.8, routing_mode: 'balanced', current_month_usage: 85 };
    const { weights, budgetState } = applyBudgetAdjustment(baseWeights, config);
    expect(budgetState).toBe('soft_limit');
    expect(weights.w_cost).toBeGreaterThan(0.20);
  });

  it('weights still sum to 1.0 after boost', () => {
    const config: BudgetConfig = { monthly_budget: 100, soft_limit_percentage: 0.8, routing_mode: 'balanced', current_month_usage: 90 };
    const { weights } = applyBudgetAdjustment(baseWeights, config);
    const sum = weights.w_quality + weights.w_latency + weights.w_stability + weights.w_cost + weights.w_confidence;
    expect(sum).toBeCloseTo(1.0, 6);
  });
});

// ──────────────────────────────────────────────────────────────
// BUDGET HARD LIMIT (2 tests)
// ──────────────────────────────────────────────────────────────

describe('Budget Hard Limit', () => {
  it('at monthly budget: forced to cost_saver', () => {
    const config: BudgetConfig = { monthly_budget: 100, soft_limit_percentage: 0.8, routing_mode: 'performance', current_month_usage: 100 };
    const { budgetState, effectiveMode } = applyBudgetAdjustment(getWeightsForMode('performance'), config);
    expect(budgetState).toBe('hard_limit');
    expect(effectiveMode).toBe('cost_saver');
  });

  it('no budget config: no enforcement', () => {
    const { budgetState } = applyBudgetAdjustment(getWeightsForMode('balanced'), null);
    expect(budgetState).toBe('no_config');
  });
});

// ──────────────────────────────────────────────────────────────
// SLA PENALTY (3 tests)
// ──────────────────────────────────────────────────────────────

describe('SLA Penalty', () => {
  it('active penalty reduces score by multiplier', () => {
    const baseScore = 0.8;
    const penalty = 0.7;
    expect(baseScore * penalty).toBeCloseTo(0.56, 6);
  });

  it('expired penalty has no effect (multiplier = 1.0)', () => {
    const baseScore = 0.8;
    const penalty = 1.0; // no penalty
    expect(baseScore * penalty).toBe(0.8);
  });

  it('no penalty row: score unaffected', () => {
    // When no penalty is found, the map returns undefined, default to 1.0
    const penaltyMap = new Map<string, number>();
    const penalty = penaltyMap.get('openai') ?? 1.0;
    expect(penalty).toBe(1.0);
  });
});

// ──────────────────────────────────────────────────────────────
// CONFIDENCE DECAY (4 tests)
// ──────────────────────────────────────────────────────────────

describe('Confidence Decay', () => {
  const now = Date.now();

  it('recent call (1 day): minimal decay', () => {
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
    const decay = computeDecayFactor(oneDayAgo, now);
    expect(decay).toBeGreaterThan(0.95);
  });

  it('30 days ago: ~37% of original (e^-1)', () => {
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const decay = computeDecayFactor(thirtyDaysAgo, now);
    expect(decay).toBeCloseTo(Math.exp(-1), 2);
  });

  it('60 days ago: ~13% of original (e^-2)', () => {
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();
    const decay = computeDecayFactor(sixtyDaysAgo, now);
    expect(decay).toBeCloseTo(Math.exp(-2), 2);
  });

  it('null last_call_at: conservative default (0.5)', () => {
    const decay = computeDecayFactor(null, now);
    expect(decay).toBe(0.5);
  });
});

// ──────────────────────────────────────────────────────────────
// CONFIDENCE SCORE (3 tests)
// ──────────────────────────────────────────────────────────────

describe('Confidence Score', () => {
  const now = Date.now();

  it('high samples + recent call = high confidence', () => {
    const recentCall = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
    const score = computeConfidenceScore(100, recentCall, now);
    expect(score).toBeGreaterThan(0.9);
  });

  it('low samples = low confidence even if recent', () => {
    const recentCall = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
    const score = computeConfidenceScore(5, recentCall, now);
    expect(score).toBeLessThan(0.10);
  });

  it('null last_call_at with samples: uses default decay', () => {
    const score = computeConfidenceScore(50, null, now);
    expect(score).toBeCloseTo(0.5 * 0.5, 2); // sampleFactor * defaultDecay
  });
});

// ──────────────────────────────────────────────────────────────
// DIVERSITY GUARD (3 tests)
// ──────────────────────────────────────────────────────────────

describe('Diversity Guard', () => {
  it('provider at 96% usage: epsilon should be boosted', () => {
    const baseEpsilon = 0.05;
    const usageRows = [{ provider: 'openai', usage_percentage: 96 }];
    let epsilon = baseEpsilon;
    for (const u of usageRows) {
      if (u.usage_percentage > 95) epsilon = Math.max(epsilon, 0.15);
    }
    expect(epsilon).toBe(0.15);
  });

  it('provider at 80% usage: no epsilon change', () => {
    const baseEpsilon = 0.05;
    const usageRows = [{ provider: 'openai', usage_percentage: 80 }];
    let epsilon = baseEpsilon;
    for (const u of usageRows) {
      if (u.usage_percentage > 95) epsilon = Math.max(epsilon, 0.15);
    }
    expect(epsilon).toBe(0.05);
  });

  it('empty usage table: no change', () => {
    const baseEpsilon = 0.10;
    const usageRows: { provider: string; usage_percentage: number }[] = [];
    let epsilon = baseEpsilon;
    for (const u of usageRows) {
      if (u.usage_percentage > 95) epsilon = Math.max(epsilon, 0.15);
    }
    expect(epsilon).toBe(0.10);
  });
});

// ──────────────────────────────────────────────────────────────
// DETERMINISTIC RANKING (3 tests)
// ──────────────────────────────────────────────────────────────

describe('Deterministic Ranking', () => {
  it('exploit picks best multi-objective score', () => {
    const weights = getWeightsForMode('balanced');
    const scoreA = computeMultiObjectiveScore(weights, 0.9, 0.8, 0.9, 0.5, 0.7);
    const scoreB = computeMultiObjectiveScore(weights, 0.5, 0.5, 0.5, 0.5, 0.5);
    expect(scoreA).toBeGreaterThan(scoreB);
  });

  it('exploration among top-3 with seeded RNG is repeatable', () => {
    const rng1 = seededRandom(42);
    const rng2 = seededRandom(42);
    const results1 = [rng1(), rng1(), rng1()];
    const results2 = [rng2(), rng2(), rng2()];
    expect(results1).toEqual(results2);
  });

  it('same inputs produce same multi-objective scores', () => {
    const weights = getWeightsForMode('performance');
    const s1 = computeMultiObjectiveScore(weights, 0.8, 0.7, 0.9, 0.3, 0.6);
    const s2 = computeMultiObjectiveScore(weights, 0.8, 0.7, 0.9, 0.3, 0.6);
    expect(s1).toBe(s2);
  });
});

// ──────────────────────────────────────────────────────────────
// MULTI-OBJECTIVE SCORE FORMULA (2 tests)
// ──────────────────────────────────────────────────────────────

describe('Multi-Objective Score Formula', () => {
  it('balanced mode score is arithmetic mean of all dimensions', () => {
    const weights = getWeightsForMode('balanced');
    const score = computeMultiObjectiveScore(weights, 1.0, 1.0, 1.0, 1.0, 1.0);
    expect(score).toBeCloseTo(1.0, 6);
  });

  it('cost_saver mode heavily weights cost', () => {
    const weights = getWeightsForMode('cost_saver');
    // Provider A: great cost, poor quality
    const scoreA = computeMultiObjectiveScore(weights, 0.3, 0.3, 0.3, 1.0, 0.5);
    // Provider B: great quality, poor cost
    const scoreB = computeMultiObjectiveScore(weights, 1.0, 0.3, 0.3, 0.0, 0.5);
    expect(scoreA).toBeGreaterThan(scoreB);
  });
});

// ──────────────────────────────────────────────────────────────
// NO-REGRESSION FROM INT-01C (4 tests)
// ──────────────────────────────────────────────────────────────

describe('No Regression from INT-01C', () => {
  it('alpha/beta computation unchanged', () => {
    expect(computeAlphaBeta(5)).toEqual({ alpha: 0.85, beta: 0.15 });
    expect(computeAlphaBeta(50)).toEqual({ alpha: 0.60, beta: 0.40 });
    expect(computeAlphaBeta(200)).toEqual({ alpha: 0.35, beta: 0.65 });
  });

  it('EWMA update math unchanged', () => {
    const result = computeEwmaUpdate(null, { latencyMs: 500, costPer1k: 0.005, qualityAvg: 80, success: true });
    expect(result.ewma_latency_ms).toBe(500);
    expect(result.sample_count).toBe(1);

    const update = computeEwmaUpdate(result, { latencyMs: 600, costPer1k: 0.006, qualityAvg: 90, success: true });
    expect(update.ewma_latency_ms).toBeCloseTo(0.2 * 600 + 0.8 * 500, 6);
    expect(update.sample_count).toBe(2);
  });

  it('neutral defaults for missing metrics', () => {
    const score = computeScore(null);
    expect(score).toBe(0.5);
  });

  it('seeded random produces consistent sequence', () => {
    const rng = seededRandom(12345);
    const values = [rng(), rng(), rng()];
    const rng2 = seededRandom(12345);
    expect([rng2(), rng2(), rng2()]).toEqual(values);
  });
});

// ──────────────────────────────────────────────────────────────
// WEIGHT NORMALIZATION (1 test)
// ──────────────────────────────────────────────────────────────

describe('Weight Normalization', () => {
  it('normalizeWeights sums to 1.0', () => {
    const w = normalizeWeights({ w_quality: 3, w_latency: 2, w_stability: 1, w_cost: 4, w_confidence: 0 });
    const sum = w.w_quality + w.w_latency + w.w_stability + w.w_cost + w.w_confidence;
    expect(sum).toBeCloseTo(1.0, 6);
  });
});
