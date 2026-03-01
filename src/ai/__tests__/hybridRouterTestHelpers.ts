/**
 * Test helpers re-exporting pure functions from hybridRouter
 * for Vitest (no Deno dependency).
 */

const SCORE_WEIGHTS = {
  wq: 0.40,
  ws: 0.30,
  wl: 0.20,
  wc: 0.10,
};

const LATENCY_CAP_MS = 5000;
const COST_CAP = 0.01;
const EWMA_LAMBDA = 0.2;

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeAlphaBeta(tenantSamples: number): { alpha: number; beta: number } {
  if (tenantSamples < 20) return { alpha: 0.85, beta: 0.15 };
  if (tenantSamples <= 100) return { alpha: 0.60, beta: 0.40 };
  return { alpha: 0.35, beta: 0.65 };
}

export function computeEpsilon(tenantSamples: number): number {
  if (tenantSamples < 20) return 0.20;
  if (tenantSamples <= 100) return 0.10;
  return 0.05;
}

interface MetricsRow {
  ewma_latency_ms: number;
  ewma_quality: number;
  ewma_cost_per_1k: number;
  ewma_success_rate: number;
  sample_count: number;
}

export function computeScore(m: MetricsRow | null): number {
  if (!m || m.sample_count === 0) return 0.5;

  const latencyScore = clamp01(1 - m.ewma_latency_ms / LATENCY_CAP_MS);
  const costScore = clamp01(1 - m.ewma_cost_per_1k / COST_CAP);
  const successScore = clamp01(m.ewma_success_rate);
  const qualityScore = clamp01(m.ewma_quality / 100);

  return (
    SCORE_WEIGHTS.wq * qualityScore +
    SCORE_WEIGHTS.ws * successScore +
    SCORE_WEIGHTS.wl * latencyScore +
    SCORE_WEIGHTS.wc * costScore
  );
}

export function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
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
