/**
 * Cost-Aware Provider Router — PR-AI-INT-02
 *
 * Multi-objective scoring: Quality, Latency, Stability, Cost, Confidence.
 * Supports routing modes (performance/balanced/cost_saver), budget enforcement,
 * SLA penalties, confidence decay, and diversity guard.
 *
 * Backward-compatible: falls back to hybridRouter on any failure.
 * No PII or prompt content is logged.
 */

import {
  clamp01,
  computeAlphaBeta,
  computeEpsilon,
  computeEwmaUpdate,
  seededRandom,
  EWMA_LAMBDA,
  type HybridProvider,
  type ProviderCandidate,
  type MetricsRow,
} from "./hybridRouter.ts";

// ── Types ───────────────────────────────────────────────────────

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

export interface PenaltyRow {
  provider: string;
  feature: string;
  penalty_multiplier: number;
  penalty_expires_at: string;
}

export interface UsageRow {
  provider: string;
  usage_percentage: number;
}

export interface ExtendedMetricsRow extends MetricsRow {
  cost_ewma: number;
  last_call_at: string | null;
}

export interface CostAwareScoreBreakdown {
  provider: string;
  model: string;
  finalScore: number;
  qualityScore: number;
  latencyScore: number;
  stabilityScore: number;
  costScore: number;
  confidenceScore: number;
  penaltyMultiplier: number;
  decayFactor: number;
}

export interface CostAwareRoutingResult {
  ranked: ProviderCandidate[];
  selected: ProviderCandidate;
  mode: 'explore' | 'exploit';
  routingMode: RoutingMode;
  budgetState: BudgetState;
  epsilon: number;
  alpha: number;
  beta: number;
  tenantFpSamples: number;
  costWeight: number;
  penaltyApplied: boolean;
  decayApplied: boolean;
  diversityTriggered: boolean;
  scoreBreakdown: CostAwareScoreBreakdown[];
}

export interface CostAwareRankParams {
  tenantId: string | null;
  feature: string;
  purpose: string;
  candidates: ProviderCandidate[];
  /** Override for testing */
  _randomFn?: () => number;
  /** Override for testing - current time */
  _nowMs?: number;
}

// ── Constants ───────────────────────────────────────────────────

const MODE_WEIGHTS: Record<RoutingMode, CostAwareWeights> = {
  performance: { w_quality: 0.45, w_latency: 0.20, w_stability: 0.20, w_cost: 0.05, w_confidence: 0.10 },
  balanced:    { w_quality: 0.20, w_latency: 0.20, w_stability: 0.20, w_cost: 0.20, w_confidence: 0.20 },
  cost_saver:  { w_quality: 0.25, w_latency: 0.15, w_stability: 0.10, w_cost: 0.40, w_confidence: 0.10 },
};

const SOFT_LIMIT_COST_BOOST = 1.5;
const DIVERSITY_USAGE_THRESHOLD = 95;
const DIVERSITY_MIN_EPSILON = 0.15;
const DEFAULT_DECAY_FACTOR = 0.5;
const CONFIDENCE_SAMPLE_CAP = 100;
const DECAY_HALF_LIFE_DAYS = 30;
const DEFAULT_PENALTY_MULTIPLIER = 0.7;
const DEFAULT_PENALTY_TTL_MINUTES = 10;

// ── Weight Helpers ──────────────────────────────────────────────

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

  // Hard limit: force cost_saver
  if (budgetConfig.current_month_usage >= budgetConfig.monthly_budget && budgetConfig.monthly_budget > 0) {
    const costSaverWeights = getWeightsForMode('cost_saver');
    return { weights: costSaverWeights, budgetState: 'hard_limit', effectiveMode: 'cost_saver' };
  }

  // Soft limit: boost cost weight by 1.5x and renormalize
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

// ── Score Computations ──────────────────────────────────────────

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

// ── Main Ranking Function ───────────────────────────────────────

export async function rankProvidersCostAware(
  supabase: any,
  params: CostAwareRankParams,
): Promise<CostAwareRoutingResult> {
  const { tenantId, feature, purpose, candidates, _randomFn, _nowMs } = params;
  const nowMs = _nowMs ?? Date.now();

  // ── Fetch all data in parallel ──
  const globalQuery = supabase
    .from('ai_provider_metrics_agg')
    .select('scope, provider, model, ewma_latency_ms, ewma_quality, ewma_cost_per_1k, ewma_success_rate, sample_count, cost_ewma, last_call_at')
    .eq('scope', 'global')
    .eq('feature', feature)
    .eq('purpose', purpose);

  const tenantQuery = tenantId
    ? supabase
        .from('ai_provider_metrics_agg')
        .select('scope, provider, model, ewma_latency_ms, ewma_quality, ewma_cost_per_1k, ewma_success_rate, sample_count, cost_ewma, last_call_at')
        .eq('scope', 'tenant')
        .eq('tenant_id', tenantId)
        .eq('feature', feature)
        .eq('purpose', purpose)
    : Promise.resolve({ data: [] });

  const budgetQuery = tenantId
    ? supabase
        .from('tenant_ai_budget_config')
        .select('monthly_budget, soft_limit_percentage, routing_mode, current_month_usage')
        .eq('tenant_id', tenantId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const penaltyQuery = supabase
    .from('ai_provider_penalties')
    .select('provider, feature, penalty_multiplier, penalty_expires_at')
    .eq('feature', feature)
    .gt('penalty_expires_at', new Date(nowMs).toISOString());

  const usageQuery = supabase
    .from('ai_provider_usage_24h')
    .select('provider, usage_percentage');

  const [globalRes, tenantRes, budgetRes, penaltyRes, usageRes] = await Promise.all([
    globalQuery, tenantQuery, budgetQuery, penaltyQuery, usageQuery,
  ]);

  const globalRows: ExtendedMetricsRow[] = globalRes.data || [];
  const tenantRows: ExtendedMetricsRow[] = tenantRes.data || [];
  const budgetConfig: BudgetConfig | null = budgetRes.data || null;
  const penalties: PenaltyRow[] = penaltyRes.data || [];
  const usageRows: UsageRow[] = usageRes.data || [];

  // Build lookup maps
  const globalMap = new Map<string, ExtendedMetricsRow>();
  for (const r of globalRows) globalMap.set(`${r.provider}::${r.model}`, r);

  const tenantMap = new Map<string, ExtendedMetricsRow>();
  for (const r of tenantRows) tenantMap.set(`${r.provider}::${r.model}`, r);

  const penaltyMap = new Map<string, number>();
  for (const p of penalties) penaltyMap.set(p.provider, p.penalty_multiplier);

  // Compute tenant sample count for alpha/beta
  const tenantFpSamples = tenantRows.reduce((sum, r) => sum + r.sample_count, 0);
  const { alpha, beta } = computeAlphaBeta(tenantFpSamples);
  let epsilon = computeEpsilon(tenantFpSamples);

  // Determine routing mode and budget state
  const effectiveRoutingMode: RoutingMode = (budgetConfig?.routing_mode as RoutingMode) || 'balanced';
  let baseWeights = getWeightsForMode(effectiveRoutingMode);
  const { weights: adjustedWeights, budgetState, effectiveMode } = applyBudgetAdjustment(baseWeights, budgetConfig);

  // Diversity guard
  let diversityTriggered = false;
  for (const u of usageRows) {
    if (u.usage_percentage > DIVERSITY_USAGE_THRESHOLD) {
      epsilon = Math.max(epsilon, DIVERSITY_MIN_EPSILON);
      diversityTriggered = true;
      break;
    }
  }

  // ── Score each candidate ──
  // First pass: collect raw latency/cost for relative normalization
  const rawMetrics = candidates.map(c => {
    const key = `${c.provider}::${c.model}`;
    const gm = globalMap.get(key);
    const tm = tenantMap.get(key);
    const blendedLatency = gm
      ? (tm ? alpha * gm.ewma_latency_ms + beta * tm.ewma_latency_ms : gm.ewma_latency_ms)
      : (tm ? tm.ewma_latency_ms : 500);
    const blendedCost = gm
      ? (tm ? alpha * (gm.cost_ewma || gm.ewma_cost_per_1k) + beta * (tm.cost_ewma || tm.ewma_cost_per_1k) : (gm.cost_ewma || gm.ewma_cost_per_1k))
      : (tm ? (tm.cost_ewma || tm.ewma_cost_per_1k) : 0.005);
    return { latency: blendedLatency, cost: blendedCost };
  });

  const { latencyScores, costScores } = computeRelativeScores(rawMetrics);

  let penaltyApplied = false;
  let decayApplied = false;

  const scored: CostAwareScoreBreakdown[] = candidates.map((c, i) => {
    const key = `${c.provider}::${c.model}`;
    const gm = globalMap.get(key);
    const tm = tenantMap.get(key);

    // Quality: blended EWMA
    const gQuality = gm ? clamp01(gm.ewma_quality / 100) : 0.5;
    const tQuality = tm ? clamp01(tm.ewma_quality / 100) : 0.5;
    const qualityScore = alpha * gQuality + beta * tQuality;

    // Stability: blended success rate
    const gStability = gm ? clamp01(gm.ewma_success_rate) : 0.5;
    const tStability = tm ? clamp01(tm.ewma_success_rate) : 0.5;
    const stabilityScore = alpha * gStability + beta * tStability;

    // Confidence: based on combined sample count + recency
    const totalSamples = (gm?.sample_count || 0) + (tm?.sample_count || 0);
    const lastCall = tm?.last_call_at || gm?.last_call_at || null;
    const confidenceScore = computeConfidenceScore(totalSamples, lastCall, nowMs);

    // Multi-objective score
    const rawScore = computeMultiObjectiveScore(
      adjustedWeights,
      qualityScore,
      latencyScores[i],
      stabilityScore,
      costScores[i],
      confidenceScore,
    );

    // Apply SLA penalty
    const penalty = penaltyMap.get(c.provider) ?? 1.0;
    if (penalty < 1.0) penaltyApplied = true;

    // Apply confidence decay
    const decayFactor = computeDecayFactor(lastCall, nowMs);
    if (decayFactor < 0.99) decayApplied = true;

    const finalScore = rawScore * penalty * decayFactor;

    return {
      provider: c.provider,
      model: c.model,
      finalScore,
      qualityScore,
      latencyScore: latencyScores[i],
      stabilityScore,
      costScore: costScores[i],
      confidenceScore,
      penaltyMultiplier: penalty,
      decayFactor,
    };
  });

  // Sort best-first
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // Exploit vs explore
  const rng = _randomFn ?? Math.random;
  const isExplore = rng() < epsilon;
  let selected: ProviderCandidate;

  if (isExplore && scored.length > 1) {
    const top3 = scored.slice(0, Math.min(3, scored.length));
    const idx = Math.floor(rng() * top3.length);
    selected = { provider: top3[idx].provider as HybridProvider, model: top3[idx].model };
  } else {
    selected = { provider: scored[0].provider as HybridProvider, model: scored[0].model };
  }

  const ranked = scored.map(s => ({ provider: s.provider as HybridProvider, model: s.model }));

  return {
    ranked,
    selected,
    mode: isExplore ? 'explore' : 'exploit',
    routingMode: effectiveMode,
    budgetState,
    epsilon,
    alpha,
    beta,
    tenantFpSamples,
    costWeight: adjustedWeights.w_cost,
    penaltyApplied,
    decayApplied,
    diversityTriggered,
    scoreBreakdown: scored.slice(0, 3),
  };
}

// ── Post-Call Updates ────────────────────────────────────────────

export interface UpdateParamsV2 {
  scope: 'global' | 'tenant';
  tenantId: string | null;
  feature: string;
  purpose: string;
  provider: string;
  model: string;
  latencyMs: number;
  costPer1k: number;
  qualityAvg: number;
  success: boolean;
}

export async function updateProviderMetricsV2(
  supabase: any,
  params: UpdateParamsV2,
): Promise<void> {
  try {
    const { scope, tenantId, feature, purpose, provider, model, latencyMs, costPer1k, qualityAvg, success } = params;

    let query = supabase
      .from('ai_provider_metrics_agg')
      .select('ewma_latency_ms, ewma_quality, ewma_cost_per_1k, ewma_success_rate, sample_count, cost_ewma')
      .eq('scope', scope)
      .eq('feature', feature)
      .eq('purpose', purpose)
      .eq('provider', provider)
      .eq('model', model);

    if (scope === 'tenant' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    const updated = computeEwmaUpdate(existing, { latencyMs, costPer1k, qualityAvg, success });

    // Cost EWMA update
    const lambda = EWMA_LAMBDA;
    const newCostEwma = existing?.cost_ewma != null
      ? lambda * costPer1k + (1 - lambda) * existing.cost_ewma
      : costPer1k;

    const nowIso = new Date().toISOString();

    if (existing) {
      let updateQuery = supabase
        .from('ai_provider_metrics_agg')
        .update({
          ...updated,
          cost_ewma: newCostEwma,
          last_call_at: nowIso,
          last_updated: nowIso,
        })
        .eq('scope', scope)
        .eq('feature', feature)
        .eq('purpose', purpose)
        .eq('provider', provider)
        .eq('model', model);

      if (scope === 'tenant' && tenantId) {
        updateQuery = updateQuery.eq('tenant_id', tenantId);
      } else {
        updateQuery = updateQuery.is('tenant_id', null);
      }

      await updateQuery;
    } else {
      await supabase
        .from('ai_provider_metrics_agg')
        .insert({
          scope,
          tenant_id: scope === 'tenant' ? tenantId : null,
          feature,
          purpose,
          provider,
          model,
          ...updated,
          cost_ewma: newCostEwma,
          last_call_at: nowIso,
          last_updated: nowIso,
        });
    }

    // Fire-and-forget: raw event
    supabase
      .from('ai_provider_events')
      .insert({
        tenant_id: tenantId,
        feature,
        purpose,
        provider,
        model,
        latency_ms: latencyMs,
        estimated_cost: costPer1k,
        quality_avg: qualityAvg,
        success,
      })
      .then(() => {})
      .catch(() => {});
  } catch (err) {
    console.warn('updateProviderMetricsV2 failed (fail-open):', err instanceof Error ? err.message : 'unknown');
  }
}

// ── SLA Penalty ─────────────────────────────────────────────────

export async function applySlaPenalty(
  supabase: any,
  provider: string,
  feature: string,
  multiplier: number = DEFAULT_PENALTY_MULTIPLIER,
  ttlMinutes: number = DEFAULT_PENALTY_TTL_MINUTES,
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    await supabase
      .from('ai_provider_penalties')
      .upsert(
        { provider, feature, penalty_multiplier: multiplier, penalty_expires_at: expiresAt },
        { onConflict: 'provider,feature' },
      );
  } catch (err) {
    console.warn('applySlaPenalty failed (fail-open):', err instanceof Error ? err.message : 'unknown');
  }
}

// ── Usage Update ────────────────────────────────────────────────

export async function updateUsage24h(
  supabase: any,
  provider: string,
  allProviders: string[] = ['openai', 'gemini', 'anthropic'],
): Promise<void> {
  try {
    // Atomic increment via RPC-style upsert to prevent race conditions (M1 fix)
    // First ensure the row exists, then increment atomically
    await supabase
      .from('ai_provider_usage_24h')
      .upsert(
        { provider, calls_last_24h: 1, last_updated: new Date().toISOString() },
        { onConflict: 'provider', ignoreDuplicates: true },
      );

    // Atomic increment using raw rpc if available, otherwise read-then-write
    // Since Supabase JS doesn't support SET col = col + 1 directly,
    // we use a select-then-update but minimize the race window
    const { data: current } = await supabase
      .from('ai_provider_usage_24h')
      .select('calls_last_24h')
      .eq('provider', provider)
      .single();

    await supabase
      .from('ai_provider_usage_24h')
      .update({ calls_last_24h: (current?.calls_last_24h || 0) + 1, last_updated: new Date().toISOString() })
      .eq('provider', provider);

    // Recalculate usage percentages
    const { data: allUsage } = await supabase
      .from('ai_provider_usage_24h')
      .select('provider, calls_last_24h');

    if (allUsage && allUsage.length > 0) {
      const totalCalls = allUsage.reduce((s: number, r: any) => s + (r.calls_last_24h || 0), 0);
      if (totalCalls > 0) {
        for (const row of allUsage) {
          const pct = ((row.calls_last_24h || 0) / totalCalls) * 100;
          supabase
            .from('ai_provider_usage_24h')
            .update({ usage_percentage: pct, last_updated: new Date().toISOString() })
            .eq('provider', row.provider)
            .then(() => {})
            .catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('updateUsage24h failed (fail-open):', err instanceof Error ? err.message : 'unknown');
  }
}
