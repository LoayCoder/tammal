/**
 * Test helpers re-exporting pure functions from thompsonRouter
 * for Vitest (no Deno dependency).
 */

// ── Beta Sampling ──────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function sampleStandardNormal(rng: () => number): number {
  let u1: number;
  let u2: number;
  do {
    u1 = rng();
  } while (u1 <= 1e-10);
  u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function sampleNormal(mean: number, variance: number, rng: () => number): number {
  const safeVariance = Math.max(variance, 1e-10);
  return mean + Math.sqrt(safeVariance) * sampleStandardNormal(rng);
}

function sampleGamma(shape: number, rng: () => number): number {
  if (shape < 1) {
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

  return shape;
}

export function sampleBeta(alpha: number, beta: number, rng: () => number): number {
  const a = Math.max(alpha, 0.001);
  const b = Math.max(beta, 0.001);

  if (a > 100 || b > 100) {
    const mean = a / (a + b);
    const variance = (a * b) / ((a + b) * (a + b) * (a + b + 1));
    const std = Math.sqrt(variance);
    const sample = mean + std * sampleStandardNormal(rng);
    return clamp01(sample);
  }

  const ga = sampleGamma(a, rng);
  const gb = sampleGamma(b, rng);
  if (ga + gb === 0) return 0.5;
  return clamp01(ga / (ga + gb));
}

// ── Posterior Update ────────────────────────────────────────────

export interface PosteriorUpdateResult {
  ts_alpha: number;
  ts_beta: number;
  ts_latency_mean: number;
  ts_latency_variance: number;
  ts_cost_mean: number;
  ts_cost_variance: number;
}

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

  const newAlpha = existing.ts_alpha + (params.success ? 1 : 0);
  const newBeta = existing.ts_beta + (params.success ? 0 : 1);

  const n = existing.sample_count + 1;
  const latencyDelta = params.latencyMs - existing.ts_latency_mean;
  const newLatencyMean = existing.ts_latency_mean + latencyDelta / n;
  const latencyDelta2 = params.latencyMs - newLatencyMean;
  const oldM2 = existing.ts_latency_variance * (n - 1);
  const newM2 = oldM2 + latencyDelta * latencyDelta2;
  const newLatencyVariance = Math.max(0.01, n > 1 ? newM2 / n : 1);

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
