/**
 * AI Provider Orchestrator — Smart Model Switching + Fallback Ranking
 *
 * Replaces static gemini→openai fallback with a ranked orchestration policy.
 * Uses in-memory scoring (resets on cold start) for v1.
 *
 * Ranking formula:
 *   Score = (successRate * 0.60) - (schemaInvalidRate * 0.25) - (timeoutRate * 0.10) - (latencyPenalty * 0.05)
 *
 * No PII or prompt content is logged.
 */

// ── Types ───────────────────────────────────────────────────────

export type ProviderName = 'gemini' | 'openai';

export interface ProviderScore {
  provider: ProviderName;
  totalCalls: number;
  successes: number;
  schemaInvalids: number;
  timeouts: number;
  failures: number;
  /** Rolling p95 latency estimate (ms) */
  p95LatencyMs: number;
  /** Recent latencies for p95 calculation (last 20) */
  recentLatencies: number[];
  lastUpdated: number;
}

export interface OrchestratorContext {
  feature: string;
  purpose: 'survey' | 'wellness';
  strictMode: boolean;
  tenant_id?: string | null;
  retry_count: number;
}

export type OutcomeType = 'success' | 'schema_invalid' | 'timeout' | 'provider_error';

export interface CallOutcome {
  provider: ProviderName;
  outcome: OutcomeType;
  latencyMs: number;
}

// ── Default model mapping per provider ──────────────────────────

const DEFAULT_MODELS: Record<ProviderName, string> = {
  gemini: 'google/gemini-3-flash-preview',
  openai: 'openai/gpt-5-mini',
};

/** Maps a model key to its cross-provider equivalent */
const MODEL_CROSSOVER: Record<string, string> = {
  'google/gemini-3-flash-preview': 'openai/gpt-5-mini',
  'google/gemini-3-pro-preview': 'openai/gpt-5',
  'google/gemini-2.5-flash': 'openai/gpt-5-mini',
  'google/gemini-2.5-flash-lite': 'openai/gpt-5-nano',
  'google/gemini-2.5-pro': 'openai/gpt-5',
  'openai/gpt-5': 'google/gemini-2.5-pro',
  'openai/gpt-5-mini': 'google/gemini-2.5-flash',
  'openai/gpt-5-nano': 'google/gemini-2.5-flash-lite',
};

// ── In-memory score store (resets on cold start) ────────────────

const scoreStore = new Map<ProviderName, ProviderScore>();

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

// ── Scoring function ────────────────────────────────────────────

function computeRank(score: ProviderScore): number {
  if (score.totalCalls === 0) {
    // Neutral default — return high score so default order wins
    return 0.9;
  }

  const successRate = score.successes / score.totalCalls;
  const schemaInvalidRate = score.schemaInvalids / score.totalCalls;
  const timeoutRate = score.timeouts / score.totalCalls;

  // Latency penalty: 0 if ≤2000ms, scales linearly up to 1.0 at 10000ms
  const latencyPenalty = Math.min(1.0, Math.max(0, (score.p95LatencyMs - 2000) / 8000));

  return (
    successRate * 0.60 -
    schemaInvalidRate * 0.25 -
    timeoutRate * 0.10 -
    latencyPenalty * 0.05
  );
}

// ── Public API ──────────────────────────────────────────────────

const ALL_PROVIDERS: ProviderName[] = ['gemini', 'openai'];

/**
 * Returns a ranked list of providers (best first).
 * Always returns at least 2 providers if available.
 */
export function pickRankedProviders(_ctx: OrchestratorContext): ProviderName[] {
  const ranked = ALL_PROVIDERS
    .map((p) => ({ provider: p, rank: computeRank(getOrCreateScore(p)) }))
    .sort((a, b) => b.rank - a.rank);

  return ranked.map((r) => r.provider);
}

/**
 * Given a provider and the original requested model, return the actual model key to use.
 * If the provider matches the requested model's provider, use the requested model.
 * Otherwise, use the crossover model.
 */
export function resolveModelForProvider(
  provider: ProviderName,
  requestedModel: string,
): string {
  const requestedProvider = requestedModel.startsWith('openai/') ? 'openai' : 'gemini';

  if (provider === requestedProvider) {
    return requestedModel;
  }

  // Cross-provider: use the mapped equivalent
  return MODEL_CROSSOVER[requestedModel] || DEFAULT_MODELS[provider];
}

/**
 * Update provider scores based on call outcome.
 * Maintains a rolling window of 20 latencies for p95 estimation.
 */
export function updateScores(outcome: CallOutcome): void {
  const score = getOrCreateScore(outcome.provider);

  score.totalCalls++;
  score.lastUpdated = Date.now();

  switch (outcome.outcome) {
    case 'success':
      score.successes++;
      break;
    case 'schema_invalid':
      score.schemaInvalids++;
      break;
    case 'timeout':
      score.timeouts++;
      break;
    case 'provider_error':
      score.failures++;
      break;
  }

  // Update latency window
  score.recentLatencies.push(outcome.latencyMs);
  if (score.recentLatencies.length > 20) {
    score.recentLatencies.shift();
  }

  // Recalculate p95
  if (score.recentLatencies.length >= 3) {
    const sorted = [...score.recentLatencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    score.p95LatencyMs = sorted[Math.min(p95Index, sorted.length - 1)];
  }
}

/**
 * Get current scores for telemetry (no PII).
 */
export function getScoreSummary(): Record<ProviderName, { rank: number; totalCalls: number; successRate: number }> {
  const result: any = {};
  for (const p of ALL_PROVIDERS) {
    const s = getOrCreateScore(p);
    result[p] = {
      rank: Math.round(computeRank(s) * 1000) / 1000,
      totalCalls: s.totalCalls,
      successRate: s.totalCalls > 0 ? Math.round((s.successes / s.totalCalls) * 100) : 100,
    };
  }
  return result;
}

/**
 * Reset scores — used for testing only.
 */
export function _resetScores(): void {
  scoreStore.clear();
}

/**
 * Inject scores — used for testing only.
 */
export function _setScore(provider: ProviderName, partial: Partial<ProviderScore>): void {
  const score = getOrCreateScore(provider);
  Object.assign(score, partial);
}
