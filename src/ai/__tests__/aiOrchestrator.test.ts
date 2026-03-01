/**
 * Tests for AI Provider Orchestrator:
 *   - Default ranking with empty scores
 *   - Dynamic ranking after failures
 *   - Schema invalid penalties
 *   - Timeout penalties
 *   - Max 2 attempts
 *   - Model resolution crossover
 */

import { describe, it, expect, beforeEach } from 'vitest';

// We test the orchestrator logic via a mirrored pure-TS implementation
// since the edge function module uses Deno imports.
// The ranking formula and types are replicated here to validate the algorithm.

// ── Replicated types & logic (mirrors orchestrator.ts) ──────────

type ProviderName = 'gemini' | 'openai';

interface ProviderScore {
  provider: ProviderName;
  totalCalls: number;
  successes: number;
  schemaInvalids: number;
  timeouts: number;
  failures: number;
  p95LatencyMs: number;
  recentLatencies: number[];
  lastUpdated: number;
}

type OutcomeType = 'success' | 'schema_invalid' | 'timeout' | 'provider_error';

const ALL_PROVIDERS: ProviderName[] = ['gemini', 'openai'];
let scoreStore: Map<ProviderName, ProviderScore>;

function getOrCreateScore(provider: ProviderName): ProviderScore {
  let score = scoreStore.get(provider);
  if (!score) {
    score = {
      provider,
      totalCalls: 0,
      successes: 0,
      schemaInvalids: 0,
      timeouts: 0,
      failures: 0,
      p95LatencyMs: 1200,
      recentLatencies: [],
      lastUpdated: Date.now(),
    };
    scoreStore.set(provider, score);
  }
  return score;
}

function computeRank(score: ProviderScore): number {
  if (score.totalCalls === 0) return 0.9;
  const successRate = score.successes / score.totalCalls;
  const schemaInvalidRate = score.schemaInvalids / score.totalCalls;
  const timeoutRate = score.timeouts / score.totalCalls;
  const latencyPenalty = Math.min(1.0, Math.max(0, (score.p95LatencyMs - 2000) / 8000));
  return successRate * 0.60 - schemaInvalidRate * 0.25 - timeoutRate * 0.10 - latencyPenalty * 0.05;
}

function pickRankedProviders(): ProviderName[] {
  return ALL_PROVIDERS
    .map((p) => ({ provider: p, rank: computeRank(getOrCreateScore(p)) }))
    .sort((a, b) => b.rank - a.rank)
    .map((r) => r.provider);
}

function updateScores(outcome: { provider: ProviderName; outcome: OutcomeType; latencyMs: number }): void {
  const score = getOrCreateScore(outcome.provider);
  score.totalCalls++;
  score.lastUpdated = Date.now();
  switch (outcome.outcome) {
    case 'success': score.successes++; break;
    case 'schema_invalid': score.schemaInvalids++; break;
    case 'timeout': score.timeouts++; break;
    case 'provider_error': score.failures++; break;
  }
  score.recentLatencies.push(outcome.latencyMs);
  if (score.recentLatencies.length > 20) score.recentLatencies.shift();
  if (score.recentLatencies.length >= 3) {
    const sorted = [...score.recentLatencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    score.p95LatencyMs = sorted[Math.min(p95Index, sorted.length - 1)];
  }
}

function resolveModelForProvider(provider: ProviderName, requestedModel: string): string {
  const MODEL_CROSSOVER: Record<string, string> = {
    'google/gemini-3-flash-preview': 'openai/gpt-5-mini',
    'google/gemini-2.5-pro': 'openai/gpt-5',
    'openai/gpt-5': 'google/gemini-2.5-pro',
    'openai/gpt-5-mini': 'google/gemini-2.5-flash',
  };
  const DEFAULT_MODELS: Record<ProviderName, string> = {
    gemini: 'google/gemini-3-flash-preview',
    openai: 'openai/gpt-5-mini',
  };
  const requestedProvider = requestedModel.startsWith('openai/') ? 'openai' : 'gemini';
  if (provider === requestedProvider) return requestedModel;
  return MODEL_CROSSOVER[requestedModel] || DEFAULT_MODELS[provider];
}

// ── Tests ───────────────────────────────────────────────────────

describe('aiOrchestrator', () => {
  beforeEach(() => {
    scoreStore = new Map();
  });

  it('picks default order [gemini, openai] with empty scores', () => {
    const ranked = pickRankedProviders();
    expect(ranked).toHaveLength(2);
    // Both have same default rank, gemini first by array order
    expect(ranked[0]).toBe('gemini');
    expect(ranked[1]).toBe('openai');
  });

  it('always returns exactly 2 providers', () => {
    const ranked = pickRankedProviders();
    expect(ranked).toHaveLength(2);
  });

  it('promotes openai after repeated gemini failures', () => {
    // Simulate 10 gemini failures
    for (let i = 0; i < 10; i++) {
      updateScores({ provider: 'gemini', outcome: 'provider_error', latencyMs: 1000 });
    }
    // Simulate 10 openai successes
    for (let i = 0; i < 10; i++) {
      updateScores({ provider: 'openai', outcome: 'success', latencyMs: 1000 });
    }

    const ranked = pickRankedProviders();
    expect(ranked[0]).toBe('openai');
    expect(ranked[1]).toBe('gemini');
  });

  it('penalizes provider for schema_invalid outcomes', () => {
    // Both have some calls but gemini has schema invalids
    for (let i = 0; i < 10; i++) {
      updateScores({ provider: 'gemini', outcome: 'schema_invalid', latencyMs: 1000 });
      updateScores({ provider: 'openai', outcome: 'success', latencyMs: 1000 });
    }

    const ranked = pickRankedProviders();
    expect(ranked[0]).toBe('openai');
  });

  it('penalizes provider for timeout outcomes', () => {
    for (let i = 0; i < 10; i++) {
      updateScores({ provider: 'gemini', outcome: 'timeout', latencyMs: 5000 });
      updateScores({ provider: 'openai', outcome: 'success', latencyMs: 1000 });
    }

    const ranked = pickRankedProviders();
    expect(ranked[0]).toBe('openai');
  });

  it('never exceeds 2 attempts (max = provider count)', () => {
    const ranked = pickRankedProviders();
    expect(ranked.length).toBeLessThanOrEqual(2);
  });

  it('computes correct rank for mixed outcomes', () => {
    // 8 successes, 2 schema_invalids for gemini
    for (let i = 0; i < 8; i++) {
      updateScores({ provider: 'gemini', outcome: 'success', latencyMs: 1000 });
    }
    for (let i = 0; i < 2; i++) {
      updateScores({ provider: 'gemini', outcome: 'schema_invalid', latencyMs: 1000 });
    }

    const score = getOrCreateScore('gemini');
    const rank = computeRank(score);
    // successRate=0.8, schemaInvalidRate=0.2, timeout=0, latency<2000 so penalty=0
    // 0.8*0.6 - 0.2*0.25 - 0 - 0 = 0.48 - 0.05 = 0.43
    expect(rank).toBeCloseTo(0.43, 1);
  });

  it('resolves model for same provider (no crossover)', () => {
    const model = resolveModelForProvider('gemini', 'google/gemini-3-flash-preview');
    expect(model).toBe('google/gemini-3-flash-preview');
  });

  it('resolves model for cross-provider fallback', () => {
    const model = resolveModelForProvider('openai', 'google/gemini-3-flash-preview');
    expect(model).toBe('openai/gpt-5-mini');
  });

  it('resolves model from openai to gemini', () => {
    const model = resolveModelForProvider('gemini', 'openai/gpt-5');
    expect(model).toBe('google/gemini-2.5-pro');
  });

  it('updates p95 latency from recent calls', () => {
    // Add 5 calls with increasing latency
    for (let i = 1; i <= 5; i++) {
      updateScores({ provider: 'gemini', outcome: 'success', latencyMs: i * 1000 });
    }
    const score = getOrCreateScore('gemini');
    // p95 of [1000,2000,3000,4000,5000] → index 4 → 5000
    expect(score.p95LatencyMs).toBe(5000);
  });
});
