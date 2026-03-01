/**
 * Hybrid Provider Router — PR-AI-INT-01C
 *
 * Ranks AI provider candidates using blended global+tenant EWMA metrics.
 * Supports OpenAI, Gemini, Anthropic.
 *
 * FinalScore = alpha * GlobalScore + beta * TenantScore
 * alpha/beta depend on tenant (feature,purpose) sample_count.
 *
 * No PII or prompt content is logged.
 */

// ── Types ───────────────────────────────────────────────────────

export type HybridProvider = 'openai' | 'gemini' | 'anthropic';

export interface ProviderCandidate {
  provider: HybridProvider;
  model: string;
}

export interface MetricsRow {
  scope: 'global' | 'tenant';
  provider: string;
  model: string;
  ewma_latency_ms: number;
  ewma_quality: number;
  ewma_cost_per_1k: number;
  ewma_success_rate: number;
  sample_count: number;
}

export interface RoutingResult {
  ranked: ProviderCandidate[];
  selected: ProviderCandidate;
  mode: 'explore' | 'exploit';
  alpha: number;
  beta: number;
  epsilon: number;
  tenantFpSamples: number;
  scores: ScoredCandidate[];
}

export interface ScoredCandidate {
  provider: string;
  model: string;
  finalScore: number;
  globalScore: number;
  tenantScore: number;
}

// ── Constants ───────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  wq: 0.40, // quality
  ws: 0.30, // success
  wl: 0.20, // latency (inverted — lower is better)
  wc: 0.10, // cost (inverted — lower is better)
};

const LATENCY_CAP_MS = 5000;
const COST_CAP = 0.01;

/** EWMA smoothing factor */
export const EWMA_LAMBDA = 0.2;

// ── Helpers ─────────────────────────────────────────────────────

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Compute alpha/beta based on tenant (feature,purpose) sample count */
export function computeAlphaBeta(tenantSamples: number): { alpha: number; beta: number } {
  if (tenantSamples < 20) return { alpha: 0.85, beta: 0.15 };
  if (tenantSamples <= 100) return { alpha: 0.60, beta: 0.40 };
  return { alpha: 0.35, beta: 0.65 };
}

/** Compute exploration epsilon based on tenant (feature,purpose) sample count */
export function computeEpsilon(tenantSamples: number): number {
  if (tenantSamples < 20) return 0.20;
  if (tenantSamples <= 100) return 0.10;
  return 0.05;
}

/** Score a single metrics row into a 0-1 composite */
export function computeScore(m: MetricsRow | null): number {
  if (!m || m.sample_count === 0) return 0.5; // neutral default

  const latencyScore = clamp01(1 - m.ewma_latency_ms / LATENCY_CAP_MS);
  const costScore = clamp01(1 - m.ewma_cost_per_1k / COST_CAP);
  const successScore = clamp01(m.ewma_success_rate);
  // quality is 0..100 in DB
  const qualityScore = clamp01(m.ewma_quality / 100);

  return (
    SCORE_WEIGHTS.wq * qualityScore +
    SCORE_WEIGHTS.ws * successScore +
    SCORE_WEIGHTS.wl * latencyScore +
    SCORE_WEIGHTS.wc * costScore
  );
}

/** Deterministic seeded random for testing (xorshift32) */
export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

// ── EWMA Update ─────────────────────────────────────────────────

export interface UpdateParams {
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

export function computeEwmaUpdate(
  existing: { ewma_latency_ms: number; ewma_quality: number; ewma_cost_per_1k: number; ewma_success_rate: number; sample_count: number } | null,
  params: { latencyMs: number; costPer1k: number; qualityAvg: number; success: boolean },
): { ewma_latency_ms: number; ewma_quality: number; ewma_cost_per_1k: number; ewma_success_rate: number; sample_count: number } {
  const lambda = EWMA_LAMBDA;
  const successVal = params.success ? 1 : 0;

  if (!existing || existing.sample_count === 0) {
    return {
      ewma_latency_ms: params.latencyMs,
      ewma_quality: params.qualityAvg,
      ewma_cost_per_1k: params.costPer1k,
      ewma_success_rate: successVal,
      sample_count: 1,
    };
  }

  return {
    ewma_latency_ms: lambda * params.latencyMs + (1 - lambda) * existing.ewma_latency_ms,
    ewma_quality: lambda * params.qualityAvg + (1 - lambda) * existing.ewma_quality,
    ewma_cost_per_1k: lambda * params.costPer1k + (1 - lambda) * existing.ewma_cost_per_1k,
    ewma_success_rate: lambda * successVal + (1 - lambda) * existing.ewma_success_rate,
    sample_count: existing.sample_count + 1,
  };
}

// ── Main Ranking Function ───────────────────────────────────────

export interface RankParams {
  tenantId: string | null;
  feature: string;
  purpose: string;
  candidates: ProviderCandidate[];
  /** Override for testing */
  _randomFn?: () => number;
}

/**
 * Rank providers using hybrid global+tenant scoring.
 * Fetches metrics from DB via supabase service client.
 */
export async function rankProvidersHybrid(
  supabase: any,
  params: RankParams,
): Promise<RoutingResult> {
  const { tenantId, feature, purpose, candidates, _randomFn } = params;

  // Fetch global + tenant metrics in parallel
  const globalQuery = supabase
    .from('ai_provider_metrics_agg')
    .select('scope, provider, model, ewma_latency_ms, ewma_quality, ewma_cost_per_1k, ewma_success_rate, sample_count')
    .eq('scope', 'global')
    .eq('feature', feature)
    .eq('purpose', purpose);

  const tenantQuery = tenantId
    ? supabase
        .from('ai_provider_metrics_agg')
        .select('scope, provider, model, ewma_latency_ms, ewma_quality, ewma_cost_per_1k, ewma_success_rate, sample_count')
        .eq('scope', 'tenant')
        .eq('tenant_id', tenantId)
        .eq('feature', feature)
        .eq('purpose', purpose)
    : Promise.resolve({ data: [] });

  const [globalRes, tenantRes] = await Promise.all([globalQuery, tenantQuery]);
  const globalRows: MetricsRow[] = globalRes.data || [];
  const tenantRows: MetricsRow[] = tenantRes.data || [];

  // Build lookup maps
  const globalMap = new Map<string, MetricsRow>();
  for (const r of globalRows) globalMap.set(`${r.provider}::${r.model}`, r);

  const tenantMap = new Map<string, MetricsRow>();
  for (const r of tenantRows) tenantMap.set(`${r.provider}::${r.model}`, r);

  // Compute tenant (feature,purpose) total sample count
  const tenantFpSamples = tenantRows.reduce((sum, r) => sum + r.sample_count, 0);
  const { alpha, beta } = computeAlphaBeta(tenantFpSamples);
  const epsilon = computeEpsilon(tenantFpSamples);

  // Score each candidate
  const scored: ScoredCandidate[] = candidates.map(c => {
    const key = `${c.provider}::${c.model}`;
    const globalScore = computeScore(globalMap.get(key) ?? null);
    const tenantScore = computeScore(tenantMap.get(key) ?? null);
    const finalScore = alpha * globalScore + beta * tenantScore;
    return { provider: c.provider, model: c.model, finalScore, globalScore, tenantScore };
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
    alpha,
    beta,
    epsilon,
    tenantFpSamples,
    scores: scored.slice(0, 3), // telemetry: top 3 only
  };
}

/**
 * Update EWMA metrics for a provider after a call completes.
 * Fail-open: logs warning on error, never throws.
 */
export async function updateProviderAgg(
  supabase: any,
  params: UpdateParams,
): Promise<void> {
  try {
    const { scope, tenantId, feature, purpose, provider, model, latencyMs, costPer1k, qualityAvg, success } = params;

    // Fetch existing row
    let query = supabase
      .from('ai_provider_metrics_agg')
      .select('ewma_latency_ms, ewma_quality, ewma_cost_per_1k, ewma_success_rate, sample_count')
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

    if (existing) {
      // Update existing row
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
      // Insert new row
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
          last_updated: new Date().toISOString(),
        });
    }

    // Also insert raw event (fire-and-forget)
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
    console.warn('updateProviderAgg failed (fail-open):', err instanceof Error ? err.message : 'unknown');
  }
}
