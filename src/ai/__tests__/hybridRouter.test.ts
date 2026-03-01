/**
 * Tests for Hybrid Provider Router (PR-AI-INT-01C)
 *
 * Mirrors the pure scoring/EWMA logic from hybridRouter.ts
 * (edge function uses Deno imports, so we replicate the algorithms here).
 */

import { describe, it, expect } from 'vitest';

// ── Replicated types & logic (mirrors hybridRouter.ts) ──────────

type HybridProvider = 'openai' | 'gemini' | 'anthropic';

interface MetricsRow {
  scope: 'global' | 'tenant';
  provider: string;
  model: string;
  ewma_latency_ms: number;
  ewma_quality: number;
  ewma_cost_per_1k: number;
  ewma_success_rate: number;
  sample_count: number;
}

interface ScoredCandidate {
  provider: string;
  model: string;
  finalScore: number;
  globalScore: number;
  tenantScore: number;
}

const SCORE_WEIGHTS = { wq: 0.40, ws: 0.30, wl: 0.20, wc: 0.10 };
const LATENCY_CAP_MS = 5000;
const COST_CAP = 0.01;
const EWMA_LAMBDA = 0.2;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function computeAlphaBeta(tenantSamples: number): { alpha: number; beta: number } {
  if (tenantSamples < 20) return { alpha: 0.85, beta: 0.15 };
  if (tenantSamples <= 100) return { alpha: 0.60, beta: 0.40 };
  return { alpha: 0.35, beta: 0.65 };
}

function computeEpsilon(tenantSamples: number): number {
  if (tenantSamples < 20) return 0.20;
  if (tenantSamples <= 100) return 0.10;
  return 0.05;
}

function computeScore(m: MetricsRow | null): number {
  if (!m || m.sample_count === 0) return 0.5;
  const latencyScore = clamp01(1 - m.ewma_latency_ms / LATENCY_CAP_MS);
  const costScore = clamp01(1 - m.ewma_cost_per_1k / COST_CAP);
  const successScore = clamp01(m.ewma_success_rate);
  const qualityScore = clamp01(m.ewma_quality / 100);
  return SCORE_WEIGHTS.wq * qualityScore + SCORE_WEIGHTS.ws * successScore + SCORE_WEIGHTS.wl * latencyScore + SCORE_WEIGHTS.wc * costScore;
}

function computeEwmaUpdate(
  existing: { ewma_latency_ms: number; ewma_quality: number; ewma_cost_per_1k: number; ewma_success_rate: number; sample_count: number } | null,
  params: { latencyMs: number; costPer1k: number; qualityAvg: number; success: boolean },
) {
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
    ewma_latency_ms: EWMA_LAMBDA * params.latencyMs + (1 - EWMA_LAMBDA) * existing.ewma_latency_ms,
    ewma_quality: EWMA_LAMBDA * params.qualityAvg + (1 - EWMA_LAMBDA) * existing.ewma_quality,
    ewma_cost_per_1k: EWMA_LAMBDA * params.costPer1k + (1 - EWMA_LAMBDA) * existing.ewma_cost_per_1k,
    ewma_success_rate: EWMA_LAMBDA * successVal + (1 - EWMA_LAMBDA) * existing.ewma_success_rate,
    sample_count: existing.sample_count + 1,
  };
}

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

interface ProviderCandidate {
  provider: HybridProvider;
  model: string;
}

function rankCandidates(
  candidates: ProviderCandidate[],
  globalRows: MetricsRow[],
  tenantRows: MetricsRow[],
  randomFn: () => number = Math.random,
): { scored: ScoredCandidate[]; selected: ProviderCandidate; mode: 'explore' | 'exploit'; alpha: number; beta: number; epsilon: number; tenantFpSamples: number } {
  const globalMap = new Map<string, MetricsRow>();
  for (const r of globalRows) globalMap.set(`${r.provider}::${r.model}`, r);
  const tenantMap = new Map<string, MetricsRow>();
  for (const r of tenantRows) tenantMap.set(`${r.provider}::${r.model}`, r);

  const tenantFpSamples = tenantRows.reduce((sum, r) => sum + r.sample_count, 0);
  const { alpha, beta } = computeAlphaBeta(tenantFpSamples);
  const epsilon = computeEpsilon(tenantFpSamples);

  const scored: ScoredCandidate[] = candidates.map(c => {
    const key = `${c.provider}::${c.model}`;
    const globalScore = computeScore(globalMap.get(key) ?? null);
    const tenantScore = computeScore(tenantMap.get(key) ?? null);
    const finalScore = alpha * globalScore + beta * tenantScore;
    return { provider: c.provider, model: c.model, finalScore, globalScore, tenantScore };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);

  const isExplore = randomFn() < epsilon;
  let selected: ProviderCandidate;
  if (isExplore && scored.length > 1) {
    const top3 = scored.slice(0, Math.min(3, scored.length));
    const idx = Math.floor(randomFn() * top3.length);
    selected = { provider: top3[idx].provider as HybridProvider, model: top3[idx].model };
  } else {
    selected = { provider: scored[0].provider as HybridProvider, model: scored[0].model };
  }

  return { scored, selected, mode: isExplore ? 'explore' : 'exploit', alpha, beta, epsilon, tenantFpSamples };
}

// ── Tests ───────────────────────────────────────────────────────

describe('hybridRouter', () => {
  const candidates: ProviderCandidate[] = [
    { provider: 'gemini', model: 'google/gemini-3-flash-preview' },
    { provider: 'openai', model: 'openai/gpt-5-mini' },
    { provider: 'anthropic', model: 'anthropic/claude-sonnet' },
  ];

  describe('alpha/beta selection', () => {
    it('returns alpha=0.85 beta=0.15 for <20 tenant samples', () => {
      const { alpha, beta } = computeAlphaBeta(5);
      expect(alpha).toBe(0.85);
      expect(beta).toBe(0.15);
    });

    it('returns alpha=0.60 beta=0.40 for 20-100 tenant samples', () => {
      const { alpha, beta } = computeAlphaBeta(50);
      expect(alpha).toBe(0.60);
      expect(beta).toBe(0.40);
    });

    it('returns alpha=0.35 beta=0.65 for >100 tenant samples', () => {
      const { alpha, beta } = computeAlphaBeta(200);
      expect(alpha).toBe(0.35);
      expect(beta).toBe(0.65);
    });

    it('boundary: 20 samples uses mid-tier', () => {
      expect(computeAlphaBeta(20).alpha).toBe(0.60);
    });

    it('boundary: 100 samples uses mid-tier', () => {
      expect(computeAlphaBeta(100).alpha).toBe(0.60);
    });

    it('boundary: 101 samples uses high-tenant tier', () => {
      expect(computeAlphaBeta(101).alpha).toBe(0.35);
    });
  });

  describe('epsilon selection', () => {
    it('<20 samples => epsilon=0.20', () => expect(computeEpsilon(0)).toBe(0.20));
    it('50 samples => epsilon=0.10', () => expect(computeEpsilon(50)).toBe(0.10));
    it('>100 samples => epsilon=0.05', () => expect(computeEpsilon(200)).toBe(0.05));
  });

  describe('deterministic ranking (epsilon=0)', () => {
    it('ranks by score with no metrics (all neutral)', () => {
      const result = rankCandidates(candidates, [], [], () => 1); // rng always > epsilon
      expect(result.scored).toHaveLength(3);
      expect(result.mode).toBe('exploit');
      // All should have same neutral score
      expect(result.scored[0].finalScore).toBeCloseTo(result.scored[1].finalScore, 5);
    });

    it('ranks gemini first when gemini has best global metrics', () => {
      const globalRows: MetricsRow[] = [
        { scope: 'global', provider: 'gemini', model: 'google/gemini-3-flash-preview', ewma_latency_ms: 500, ewma_quality: 90, ewma_cost_per_1k: 0.001, ewma_success_rate: 0.99, sample_count: 100 },
        { scope: 'global', provider: 'openai', model: 'openai/gpt-5-mini', ewma_latency_ms: 2000, ewma_quality: 70, ewma_cost_per_1k: 0.005, ewma_success_rate: 0.85, sample_count: 80 },
        { scope: 'global', provider: 'anthropic', model: 'anthropic/claude-sonnet', ewma_latency_ms: 3000, ewma_quality: 60, ewma_cost_per_1k: 0.008, ewma_success_rate: 0.80, sample_count: 50 },
      ];
      const result = rankCandidates(candidates, globalRows, [], () => 1);
      expect(result.scored[0].provider).toBe('gemini');
      expect(result.selected.provider).toBe('gemini');
    });

    it('ranks openai first when openai has best tenant metrics (high tenant samples)', () => {
      const globalRows: MetricsRow[] = [
        { scope: 'global', provider: 'gemini', model: 'google/gemini-3-flash-preview', ewma_latency_ms: 500, ewma_quality: 90, ewma_cost_per_1k: 0.001, ewma_success_rate: 0.99, sample_count: 100 },
        { scope: 'global', provider: 'openai', model: 'openai/gpt-5-mini', ewma_latency_ms: 2000, ewma_quality: 70, ewma_cost_per_1k: 0.005, ewma_success_rate: 0.85, sample_count: 80 },
      ];
      // Tenant has 200 samples — high tenant weight (alpha=0.35, beta=0.65)
      const tenantRows: MetricsRow[] = [
        { scope: 'tenant', provider: 'gemini', model: 'google/gemini-3-flash-preview', ewma_latency_ms: 4500, ewma_quality: 30, ewma_cost_per_1k: 0.009, ewma_success_rate: 0.50, sample_count: 100 },
        { scope: 'tenant', provider: 'openai', model: 'openai/gpt-5-mini', ewma_latency_ms: 500, ewma_quality: 95, ewma_cost_per_1k: 0.001, ewma_success_rate: 0.99, sample_count: 100 },
      ];
      const result = rankCandidates(candidates, globalRows, tenantRows, () => 1);
      expect(result.scored[0].provider).toBe('openai');
    });
  });

  describe('exploration', () => {
    it('chooses among top-3 when epsilon=1 (forced explore)', () => {
      const globalRows: MetricsRow[] = [
        { scope: 'global', provider: 'gemini', model: 'google/gemini-3-flash-preview', ewma_latency_ms: 500, ewma_quality: 90, ewma_cost_per_1k: 0.001, ewma_success_rate: 0.99, sample_count: 100 },
        { scope: 'global', provider: 'openai', model: 'openai/gpt-5-mini', ewma_latency_ms: 1000, ewma_quality: 80, ewma_cost_per_1k: 0.003, ewma_success_rate: 0.95, sample_count: 80 },
        { scope: 'global', provider: 'anthropic', model: 'anthropic/claude-sonnet', ewma_latency_ms: 1500, ewma_quality: 70, ewma_cost_per_1k: 0.005, ewma_success_rate: 0.90, sample_count: 50 },
      ];

      // Use seeded RNG: first call < epsilon (0) => explore, second call picks index
      const rng = seededRandom(42);
      // Force epsilon to trigger: override computeEpsilon by using 0 samples (epsilon=0.20)
      const result = rankCandidates(candidates, globalRows, [], rng);
      expect(result.mode).toBe('explore');
      // Selected must be one of the top 3
      const topProviders = result.scored.slice(0, 3).map(s => s.provider);
      expect(topProviders).toContain(result.selected.provider);
    });

    it('exploit always picks best when rng > epsilon', () => {
      const globalRows: MetricsRow[] = [
        { scope: 'global', provider: 'gemini', model: 'google/gemini-3-flash-preview', ewma_latency_ms: 500, ewma_quality: 90, ewma_cost_per_1k: 0.001, ewma_success_rate: 0.99, sample_count: 100 },
      ];
      const result = rankCandidates(candidates, globalRows, [], () => 0.99); // always > epsilon
      expect(result.mode).toBe('exploit');
      expect(result.selected.provider).toBe('gemini');
    });
  });

  describe('missing metrics (neutral defaults)', () => {
    it('does not crash with empty global and tenant metrics', () => {
      const result = rankCandidates(candidates, [], []);
      expect(result.scored).toHaveLength(3);
      expect(result.selected).toBeDefined();
      // All should have neutral score = 0.5
      for (const s of result.scored) {
        expect(s.globalScore).toBe(0.5);
        expect(s.tenantScore).toBe(0.5);
      }
    });

    it('handles partial metrics (only one provider has data)', () => {
      const globalRows: MetricsRow[] = [
        { scope: 'global', provider: 'openai', model: 'openai/gpt-5-mini', ewma_latency_ms: 500, ewma_quality: 95, ewma_cost_per_1k: 0.001, ewma_success_rate: 0.99, sample_count: 50 },
      ];
      const result = rankCandidates(candidates, globalRows, [], () => 1);
      expect(result.scored[0].provider).toBe('openai');
      // Others should have neutral globalScore
      const others = result.scored.filter(s => s.provider !== 'openai');
      for (const o of others) {
        expect(o.globalScore).toBe(0.5);
      }
    });
  });

  describe('EWMA update math', () => {
    it('first update sets raw values (no smoothing)', () => {
      const result = computeEwmaUpdate(null, { latencyMs: 1000, costPer1k: 0.005, qualityAvg: 80, success: true });
      expect(result.ewma_latency_ms).toBe(1000);
      expect(result.ewma_quality).toBe(80);
      expect(result.ewma_cost_per_1k).toBe(0.005);
      expect(result.ewma_success_rate).toBe(1);
      expect(result.sample_count).toBe(1);
    });

    it('second update applies EWMA smoothing (lambda=0.2)', () => {
      const existing = { ewma_latency_ms: 1000, ewma_quality: 80, ewma_cost_per_1k: 0.005, ewma_success_rate: 1, sample_count: 1 };
      const result = computeEwmaUpdate(existing, { latencyMs: 2000, costPer1k: 0.010, qualityAvg: 60, success: false });

      // EWMA: 0.2 * new + 0.8 * old
      expect(result.ewma_latency_ms).toBeCloseTo(0.2 * 2000 + 0.8 * 1000, 5); // 1200
      expect(result.ewma_quality).toBeCloseTo(0.2 * 60 + 0.8 * 80, 5); // 76
      expect(result.ewma_cost_per_1k).toBeCloseTo(0.2 * 0.010 + 0.8 * 0.005, 5); // 0.006
      expect(result.ewma_success_rate).toBeCloseTo(0.2 * 0 + 0.8 * 1, 5); // 0.8
      expect(result.sample_count).toBe(2);
    });

    it('increments sample_count correctly after multiple updates', () => {
      let state = computeEwmaUpdate(null, { latencyMs: 1000, costPer1k: 0.005, qualityAvg: 80, success: true });
      state = computeEwmaUpdate(state, { latencyMs: 1500, costPer1k: 0.007, qualityAvg: 85, success: true });
      state = computeEwmaUpdate(state, { latencyMs: 800, costPer1k: 0.003, qualityAvg: 90, success: true });
      expect(state.sample_count).toBe(3);
    });

    it('handles zero sample_count existing as fresh start', () => {
      const existing = { ewma_latency_ms: 0, ewma_quality: 0, ewma_cost_per_1k: 0, ewma_success_rate: 0, sample_count: 0 };
      const result = computeEwmaUpdate(existing, { latencyMs: 500, costPer1k: 0.002, qualityAvg: 95, success: true });
      expect(result.ewma_latency_ms).toBe(500);
      expect(result.sample_count).toBe(1);
    });
  });

  describe('computeScore', () => {
    it('returns 0.5 for null metrics', () => {
      expect(computeScore(null)).toBe(0.5);
    });

    it('returns 0.5 for zero sample_count', () => {
      const m: MetricsRow = { scope: 'global', provider: 'gemini', model: 'x', ewma_latency_ms: 100, ewma_quality: 90, ewma_cost_per_1k: 0.001, ewma_success_rate: 0.99, sample_count: 0 };
      expect(computeScore(m)).toBe(0.5);
    });

    it('computes correct score for perfect metrics', () => {
      const m: MetricsRow = { scope: 'global', provider: 'gemini', model: 'x', ewma_latency_ms: 0, ewma_quality: 100, ewma_cost_per_1k: 0, ewma_success_rate: 1, sample_count: 10 };
      // quality=1*0.4 + success=1*0.3 + latency=1*0.2 + cost=1*0.1 = 1.0
      expect(computeScore(m)).toBeCloseTo(1.0, 5);
    });

    it('penalizes high latency', () => {
      const fast: MetricsRow = { scope: 'global', provider: 'gemini', model: 'x', ewma_latency_ms: 500, ewma_quality: 80, ewma_cost_per_1k: 0.005, ewma_success_rate: 0.9, sample_count: 10 };
      const slow: MetricsRow = { ...fast, ewma_latency_ms: 4500 };
      expect(computeScore(fast)).toBeGreaterThan(computeScore(slow));
    });
  });
});
