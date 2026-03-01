/**
 * Test helpers that re-export pure functions from costAwareRouter
 * without Deno/edge-function dependencies.
 */

// ── Types ──
export type RoutingMode = 'performance' | 'balanced' | 'cost_saver';
export type BudgetState = 'under_limit' | 'soft_limit' | 'hard_limit' | 'no_config';

export interface CostAwareWeights {
  w_quality: number;
  w_latency: number;
  w_stability: number;
  w_cost: number;
  w_confidence: number;
}

export interface BudgetConfig {
  monthly_budget: number;
  soft_limit_percentage: number;
  routing_mode: RoutingMode;
  current_month_usage: number;
}

// ── Constants ──
const MODE_WEIGHTS: Record<RoutingMode, CostAwareWeights> = {
  performance: { w_quality: 0.45, w_latency: 0.20, w_stability: 0.20, w_cost: 0.05, w_confidence: 0.10 },
  balanced:    { w_quality: 0.20, w_latency: 0.20, w_stability: 0.20, w_cost: 0.20, w_confidence: 0.20 },
  cost_saver:  { w_quality: 0.25, w_latency: 0.15, w_stability: 0.10, w_cost: 0.40, w_confidence: 0.10 },
};

const SOFT_LIMIT_COST_BOOST = 1.5;
const DEFAULT_DECAY_FACTOR = 0.5;
const CONFIDENCE_SAMPLE_CAP = 100;
const DECAY_HALF_LIFE_DAYS = 30;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function getWeightsForMode(mode: RoutingMode): CostAwareWeights {
  return { ...(MODE_WEIGHTS[mode] || MODE_WEIGHTS.balanced) };
}

export function applyBudgetAdjustment(
  weights: CostAwareWeights,
  budgetConfig: BudgetConfig | null,
): { weights: CostAwareWeights; budgetState: BudgetState; effectiveMode: RoutingMode } {
  if (!budgetConfig) {
    return { weights, budgetState: 'no_config', effectiveMode: 'balanced' };
  }

  const usageRatio = budgetConfig.monthly_budget > 0
    ? budgetConfig.current_month_usage / budgetConfig.monthly_budget
    : 0;

  if (budgetConfig.current_month_usage >= budgetConfig.monthly_budget && budgetConfig.monthly_budget > 0) {
    const costSaverWeights = getWeightsForMode('cost_saver');
    return { weights: costSaverWeights, budgetState: 'hard_limit', effectiveMode: 'cost_saver' };
  }

  if (usageRatio > budgetConfig.soft_limit_percentage) {
    const boosted = { ...weights };
    boosted.w_cost *= SOFT_LIMIT_COST_BOOST;
    const sum = boosted.w_quality + boosted.w_latency + boosted.w_stability + boosted.w_cost + boosted.w_confidence;
    if (sum > 0) {
      boosted.w_quality /= sum;
      boosted.w_latency /= sum;
      boosted.w_stability /= sum;
      boosted.w_cost /= sum;
      boosted.w_confidence /= sum;
    }
    return { weights: boosted, budgetState: 'soft_limit', effectiveMode: budgetConfig.routing_mode };
  }

  return { weights, budgetState: 'under_limit', effectiveMode: budgetConfig.routing_mode };
}

export function normalizeWeights(w: CostAwareWeights): CostAwareWeights {
  const sum = w.w_quality + w.w_latency + w.w_stability + w.w_cost + w.w_confidence;
  if (sum <= 0) return { ...MODE_WEIGHTS.balanced };
  return {
    w_quality: w.w_quality / sum,
    w_latency: w.w_latency / sum,
    w_stability: w.w_stability / sum,
    w_cost: w.w_cost / sum,
    w_confidence: w.w_confidence / sum,
  };
}

export function computeConfidenceScore(
  sampleCount: number,
  lastCallAt: string | null,
  nowMs: number,
): number {
  const sampleFactor = Math.min(sampleCount / CONFIDENCE_SAMPLE_CAP, 1);
  if (!lastCallAt) return sampleFactor * DEFAULT_DECAY_FACTOR;

  const lastCallMs = new Date(lastCallAt).getTime();
  const daysSince = (nowMs - lastCallMs) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.exp(-daysSince / DECAY_HALF_LIFE_DAYS);
  return sampleFactor * recencyFactor;
}

export function computeDecayFactor(lastCallAt: string | null, nowMs: number): number {
  if (!lastCallAt) return DEFAULT_DECAY_FACTOR;
  const lastCallMs = new Date(lastCallAt).getTime();
  const daysSince = (nowMs - lastCallMs) / (1000 * 60 * 60 * 24);
  return Math.exp(-daysSince / DECAY_HALF_LIFE_DAYS);
}

export function computeRelativeScores(
  candidates: { latency: number; cost: number }[],
): { latencyScores: number[]; costScores: number[] } {
  if (candidates.length === 0) return { latencyScores: [], costScores: [] };

  const maxLatency = Math.max(...candidates.map(c => c.latency), 1);
  const maxCost = Math.max(...candidates.map(c => c.cost), 0.0001);

  const latencyScores = candidates.map(c => clamp01(1 - c.latency / maxLatency));
  const costScores = candidates.map(c => clamp01(1 - c.cost / maxCost));

  return { latencyScores, costScores };
}

export function computeMultiObjectiveScore(
  weights: CostAwareWeights,
  qualityScore: number,
  latencyScore: number,
  stabilityScore: number,
  costScore: number,
  confidenceScore: number,
): number {
  return (
    weights.w_quality * qualityScore +
    weights.w_latency * latencyScore +
    weights.w_stability * stabilityScore +
    weights.w_cost * costScore +
    weights.w_confidence * confidenceScore
  );
}
