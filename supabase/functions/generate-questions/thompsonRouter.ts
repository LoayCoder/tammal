/**
 * Thompson Sampling Multi-Objective Bandit Router — PR-AI-INT-03
 *
 * Replaces deterministic weighted ranking with probabilistic Thompson Sampling.
 * Learns automatically, balances exploration/exploitation statistically.
 *
 * Scoring: sampleScore = w_quality*Beta(α,β) + w_latency*N(μ_l,σ²_l) + w_cost*N(μ_c,σ²_c) + w_confidence*conf
 * Then apply: SLA penalty, budget enforcement, confidence decay, diversity guard.
 *
 * Feature-flag: controlled by tenant_ai_budget_config.routing_strategy = 'thompson'.
 * Fallback: on any failure, falls back to costAwareRouter.
 *
 * No PII or prompt content is logged.
 */

import {
  clamp01,
  computeAlphaBeta,
  computeEpsilon,
  type HybridProvider,
  type ProviderCandidate,
} from "./hybridRouter.ts";

import {
  getWeightsForMode,
  applyBudgetAdjustment,
  computeConfidenceScore,
  computeDecayFactor,
  type RoutingMode,
  type BudgetState,
  type BudgetConfig,
  type CostAwareWeights,
  type ExtendedMetricsRow,
  type PenaltyRow,
  type UsageRow,
} from "./costAwareRouter.ts";

// ── Types ───────────────────────────────────────────────────────

export type RoutingStrategy = 'hybrid' | 'cost_aware' | 'thompson';

export interface ThompsonMetricsRow extends ExtendedMetricsRow {
  ts_alpha: number;
  ts_beta: number;
  ts_latency_mean: number;
  ts_latency_variance: number;
  ts_cost_mean: number;
  ts_cost_variance: number;
}

export interface ThompsonScoreBreakdown {
  provider: string;
  model: string;
  finalScore: number;
  qualitySample: number;
  latencySample: number;
  costSample: number;
  confidenceScore: number;
  penaltyMultiplier: number;
  decayFactor: number;
  tsAlpha: number;
  tsBeta: number;
}

export interface ThompsonRoutingResult {
  ranked: ProviderCandidate[];
  selected: ProviderCandidate;
  routingStrategy: RoutingStrategy;
  routingMode: RoutingMode;
  budgetState: BudgetState;
  alpha: number;
  beta: number;
  tenantFpSamples: number;
  costWeight: number;
  penaltyApplied: boolean;
  decayApplied: boolean;
  diversityTriggered: boolean;
  fallbackTriggered: boolean;
  scoreBreakdown: ThompsonScoreBreakdown[];
}

export interface ThompsonRankParams {
  tenantId: string | null;
  feature: string;
  purpose: string;
  candidates: ProviderCandidate[];
  /** Override for testing */
  _randomFn?: () => number;
  /** Override for testing - current time */
  _nowMs?: number;
}

export interface ThompsonPosteriorUpdate {
  scope: 'global' | 'tenant';
  tenantId: string | null;
  feature: string;
  purpose: string;
  provider: string;
  model: string;
  success: boolean;
  latencyMs: number;
  costPer1k: number;
}

// ── Beta Sampling ──────────────────────────────────────────────

/**
 * Sample from Beta(α, β) using the Jöhnk algorithm (simple, no external deps).
 * For large α, β this uses a normal approximation.
 */
export function sampleBeta(alpha: number, beta: number, rng: () => number): number {
  // Guard against invalid params
  const a = Math.max(alpha, 0.001);
  const b = Math.max(beta, 0.001);

  // For large params, use normal approximation
  if (a > 100 || b > 100) {
    const mean = a / (a + b);
    const variance = (a * b) / ((a + b) * (a + b) * (a + b + 1));
    const std = Math.sqrt(variance);
    const sample = mean + std * sampleStandardNormal(rng);
    return clamp01(sample);
  }

  // Gamma-based sampling: Beta(a,b) = Ga / (Ga + Gb)
  const ga = sampleGamma(a, rng);
  const gb = sampleGamma(b, rng);
  if (ga + gb === 0) return 0.5;
  return clamp01(ga / (ga + gb));
}

/**
 * Sample from Gamma(shape, 1) using Marsaglia and Tsang's method.
 */
function sampleGamma(shape: number, rng: () => number): number {
  if (shape < 1) {
    // Boost: Gamma(a) = Gamma(a+1) * U^(1/a)
    const boosted = sampleGamma(shape + 1, rng);
    return boosted * Math.pow(rng(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  for (let i = 0; i < 1000; i++) {
    let x: number;
    let v: number;
    do {
      x = sampleStandardNormal(rng);
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }

  // Shouldn't reach here, but return mean as fallback
  return shape;
}

/**
 * Sample from standard normal using Box-Muller transform.
 */
export function sampleStandardNormal(rng: () => number): number {
  let u1: number;
  let u2: number;
  do {
    u1 = rng();
  } while (u1 <= 1e-10);
  u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Sample from Normal(mean, variance).
 */
export function sampleNormal(mean: number, variance: number, rng: () => number): number {
  const safeVariance = Math.max(variance, 1e-10);
  return mean + Math.sqrt(safeVariance) * sampleStandardNormal(rng);
}

// ── Bayesian Posterior Updates ──────────────────────────────────

export interface PosteriorUpdateResult {
  ts_alpha: number;
  ts_beta: number;
  ts_latency_mean: number;
  ts_latency_variance: number;
  ts_cost_mean: number;
  ts_cost_variance: number;
}

/**
 * Compute updated Bayesian posteriors after an observation.
 * Quality: Beta conjugate update (alpha += success, beta += failure)
 * Latency/Cost: Incremental mean/variance (Welford's online algorithm)
 */
export function computePosteriorUpdate(
  existing: { ts_alpha: number; ts_beta: number; ts_latency_mean: number; ts_latency_variance: number; ts_cost_mean: number; ts_cost_variance: number; sample_count: number } | null,
  params: { success: boolean; latencyMs: number; costPer1k: number },
): PosteriorUpdateResult {
  if (!existing || existing.sample_count === 0) {
    return {
      ts_alpha: params.success ? 2 : 1,
      ts_beta: params.success ? 1 : 2,
      ts_latency_mean: params.latencyMs,
      ts_latency_variance: 1,
      ts_cost_mean: params.costPer1k,
      ts_cost_variance: 0.0001,
    };
  }

  // Quality: Beta conjugate
  const newAlpha = existing.ts_alpha + (params.success ? 1 : 0);
  const newBeta = existing.ts_beta + (params.success ? 0 : 1);

  // Latency: Welford's online update
  const n = existing.sample_count + 1;
  const latencyDelta = params.latencyMs - existing.ts_latency_mean;
  const newLatencyMean = existing.ts_latency_mean + latencyDelta / n;
  const latencyDelta2 = params.latencyMs - newLatencyMean;
  // Running variance: maintain M2 approximation
  const oldM2 = existing.ts_latency_variance * (n - 1);
  const newM2 = oldM2 + latencyDelta * latencyDelta2;
  const newLatencyVariance = Math.max(0.01, n > 1 ? newM2 / n : 1);

  // Cost: same Welford approach
  const costDelta = params.costPer1k - existing.ts_cost_mean;
  const newCostMean = existing.ts_cost_mean + costDelta / n;
  const costDelta2 = params.costPer1k - newCostMean;
  const oldCostM2 = existing.ts_cost_variance * (n - 1);
  const newCostM2 = oldCostM2 + costDelta * costDelta2;
  const newCostVariance = Math.max(0.0001, n > 1 ? newCostM2 / n : 0.0001);

  return {
    ts_alpha: newAlpha,
    ts_beta: newBeta,
    ts_latency_mean: newLatencyMean,
    ts_latency_variance: newLatencyVariance,
    ts_cost_mean: newCostMean,
    ts_cost_variance: newCostVariance,
  };
}

// ── Constants ───────────────────────────────────────────────────

const DIVERSITY_USAGE_THRESHOLD = 95;
const DIVERSITY_MIN_EPSILON = 0.15;

const TS_SELECT_FIELDS = 'scope, provider, model, ewma_latency_ms, ewma_quality, ewma_cost_per_1k, ewma_success_rate, sample_count, cost_ewma, last_call_at, ts_alpha, ts_beta, ts_latency_mean, ts_latency_variance, ts_cost_mean, ts_cost_variance';

// ── Main Ranking Function ───────────────────────────────────────

export async function rankProvidersThompson(
  supabase: any,
  params: ThompsonRankParams,
): Promise<ThompsonRoutingResult> {
  const { tenantId, feature, purpose, candidates, _randomFn, _nowMs } = params;
  const nowMs = _nowMs ?? Date.now();
  const rng = _randomFn ?? Math.random;

  // ── Fetch all data in parallel ──
  const globalQuery = supabase
    .from('ai_provider_metrics_agg')
    .select(TS_SELECT_FIELDS)
    .eq('scope', 'global')
    .eq('feature', feature)
    .eq('purpose', purpose);

  const tenantQuery = tenantId
    ? supabase
        .from('ai_provider_metrics_agg')
        .select(TS_SELECT_FIELDS)
        .eq('scope', 'tenant')
        .eq('tenant_id', tenantId)
        .eq('feature', feature)
        .eq('purpose', purpose)
    : Promise.resolve({ data: [] });

  const budgetQuery = tenantId
    ? supabase
        .from('tenant_ai_budget_config')
        .select('monthly_budget, soft_limit_percentage, routing_mode, current_month_usage, routing_strategy')
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

  const globalRows: ThompsonMetricsRow[] = globalRes.data || [];
  const tenantRows: ThompsonMetricsRow[] = tenantRes.data || [];
  const budgetConfig: (BudgetConfig & { routing_strategy?: string }) | null = budgetRes.data || null;
  const penalties: PenaltyRow[] = penaltyRes.data || [];
  const usageRows: UsageRow[] = usageRes.data || [];

  // Build lookup maps
  const globalMap = new Map<string, ThompsonMetricsRow>();
  for (const r of globalRows) globalMap.set(`${r.provider}::${r.model}`, r);

  const tenantMap = new Map<string, ThompsonMetricsRow>();
  for (const r of tenantRows) tenantMap.set(`${r.provider}::${r.model}`, r);

  const penaltyMap = new Map<string, number>();
  for (const p of penalties) penaltyMap.set(p.provider, p.penalty_multiplier);

  // Compute tenant sample count for alpha/beta blending
  const tenantFpSamples = tenantRows.reduce((sum, r) => sum + r.sample_count, 0);
  const { alpha, beta } = computeAlphaBeta(tenantFpSamples);

  // Determine routing mode and budget state
  const effectiveRoutingMode: RoutingMode = (budgetConfig?.routing_mode as RoutingMode) || 'balanced';
  const baseWeights = getWeightsForMode(effectiveRoutingMode);
  const { weights: adjustedWeights, budgetState, effectiveMode } = applyBudgetAdjustment(baseWeights, budgetConfig);

  // Diversity guard
  let diversityTriggered = false;
  for (const u of usageRows) {
    if (u.usage_percentage > DIVERSITY_USAGE_THRESHOLD) {
      diversityTriggered = true;
      break;
    }
  }

  // ── Thompson Sample each candidate ──
  let penaltyApplied = false;
  let decayApplied = false;

  const scored: ThompsonScoreBreakdown[] = candidates.map(c => {
    const key = `${c.provider}::${c.model}`;
    const gm = globalMap.get(key);
    const tm = tenantMap.get(key);

    // Blend posteriors: use alpha/beta weighting on parameters
    const blendedAlpha = gm
      ? (tm ? alpha * (gm.ts_alpha ?? 1) + beta * (tm.ts_alpha ?? 1) : (gm.ts_alpha ?? 1))
      : (tm ? (tm.ts_alpha ?? 1) : 1);
    const blendedBeta_ = gm
      ? (tm ? alpha * (gm.ts_beta ?? 1) + beta * (tm.ts_beta ?? 1) : (gm.ts_beta ?? 1))
      : (tm ? (tm.ts_beta ?? 1) : 1);

    const blendedLatencyMean = gm
      ? (tm ? alpha * (gm.ts_latency_mean ?? 500) + beta * (tm.ts_latency_mean ?? 500) : (gm.ts_latency_mean ?? 500))
      : (tm ? (tm.ts_latency_mean ?? 500) : 500);
    const blendedLatencyVar = gm
      ? (tm ? alpha * (gm.ts_latency_variance ?? 1) + beta * (tm.ts_latency_variance ?? 1) : (gm.ts_latency_variance ?? 1))
      : (tm ? (tm.ts_latency_variance ?? 1) : 1);

    const blendedCostMean = gm
      ? (tm ? alpha * (gm.ts_cost_mean ?? 0.005) + beta * (tm.ts_cost_mean ?? 0.005) : (gm.ts_cost_mean ?? 0.005))
      : (tm ? (tm.ts_cost_mean ?? 0.005) : 0.005);
    const blendedCostVar = gm
      ? (tm ? alpha * (gm.ts_cost_variance ?? 0.0001) + beta * (tm.ts_cost_variance ?? 0.0001) : (gm.ts_cost_variance ?? 0.0001))
      : (tm ? (tm.ts_cost_variance ?? 0.0001) : 0.0001);

    // Step 1: Quality sample from Beta distribution
    const qualitySample = sampleBeta(blendedAlpha, blendedBeta_, rng);

    // Step 2: Latency sample from Gaussian posterior
    const rawLatencySample = sampleNormal(blendedLatencyMean, blendedLatencyVar, rng);

    // Step 3: Cost sample from Gaussian posterior
    const rawCostSample = sampleNormal(blendedCostMean, blendedCostVar, rng);

    // Confidence score (reuses INT-02 logic)
    const totalSamples = (gm?.sample_count || 0) + (tm?.sample_count || 0);
    const lastCall = tm?.last_call_at || gm?.last_call_at || null;
    const confidenceScore = computeConfidenceScore(totalSamples, lastCall, nowMs);

    return {
      provider: c.provider,
      model: c.model,
      finalScore: 0, // computed after normalization
      qualitySample,
      latencySample: rawLatencySample,
      costSample: rawCostSample,
      confidenceScore,
      penaltyMultiplier: 1,
      decayFactor: 1,
      tsAlpha: blendedAlpha,
      tsBeta: blendedBeta_,
    };
  });

  // Normalize latency and cost samples across candidates (relative)
  const maxLatency = Math.max(...scored.map(s => Math.max(s.latencySample, 0)), 1);
  const maxCost = Math.max(...scored.map(s => Math.max(s.costSample, 0)), 0.0001);

  for (const s of scored) {
    const normalizedLatency = clamp01(1 - Math.max(s.latencySample, 0) / maxLatency);
    const normalizedCost = clamp01(1 - Math.max(s.costSample, 0) / maxCost);

    // Composite sample score
    const rawScore =
      adjustedWeights.w_quality * s.qualitySample +
      adjustedWeights.w_latency * normalizedLatency +
      adjustedWeights.w_cost * normalizedCost +
      adjustedWeights.w_confidence * s.confidenceScore +
      adjustedWeights.w_stability * s.qualitySample; // stability ≈ quality in Thompson (success rate is baked into Beta)

    // Apply SLA penalty
    const penalty = penaltyMap.get(s.provider) ?? 1.0;
    if (penalty < 1.0) penaltyApplied = true;
    s.penaltyMultiplier = penalty;

    // Apply confidence decay
    const lastCall = tenantMap.get(`${s.provider}::${s.model}`)?.last_call_at
      || globalMap.get(`${s.provider}::${s.model}`)?.last_call_at
      || null;
    const decay = computeDecayFactor(lastCall, nowMs);
    if (decay < 0.99) decayApplied = true;
    s.decayFactor = decay;

    s.finalScore = rawScore * penalty * decay;

    // Store normalized values for telemetry
    s.latencySample = normalizedLatency;
    s.costSample = normalizedCost;
  }

  // Sort best-first
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // Thompson sampling naturally explores — no epsilon-greedy needed
  // But diversity guard can inject randomization if one provider monopolizes
  let selected: ProviderCandidate;
  if (diversityTriggered && scored.length > 1) {
    // Pick randomly among top-3 to break monopoly
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
    routingStrategy: 'thompson',
    routingMode: effectiveMode,
    budgetState,
    alpha,
    beta,
    tenantFpSamples,
    costWeight: adjustedWeights.w_cost,
    penaltyApplied,
    decayApplied,
    diversityTriggered,
    fallbackTriggered: false,
    scoreBreakdown: scored.slice(0, 3),
  };
}

// ── Post-Call Bayesian Update ───────────────────────────────────

export async function updateThompsonPosteriors(
  supabase: any,
  params: ThompsonPosteriorUpdate,
): Promise<void> {
  try {
    const { scope, tenantId, feature, purpose, provider, model, success, latencyMs, costPer1k } = params;

    let query = supabase
      .from('ai_provider_metrics_agg')
      .select('ts_alpha, ts_beta, ts_latency_mean, ts_latency_variance, ts_cost_mean, ts_cost_variance, sample_count')
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
    const updated = computePosteriorUpdate(existing, { success, latencyMs, costPer1k });

    if (existing) {
      let updateQuery = supabase
        .from('ai_provider_metrics_agg')
        .update({
          ...updated,
          last_updated: new Date().toISOString(),
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
          sample_count: 1,
          ewma_latency_ms: latencyMs,
          ewma_quality: success ? 80 : 20,
          ewma_cost_per_1k: costPer1k,
          ewma_success_rate: success ? 1 : 0,
          cost_ewma: costPer1k,
          last_call_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        });
    }
  } catch (err) {
    console.warn('updateThompsonPosteriors failed (fail-open):', err instanceof Error ? err.message : 'unknown');
  }
}
