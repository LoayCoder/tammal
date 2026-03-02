/**
 * PR-AI-OPS-01: Mock Providers for Chaos Testing
 *
 * Injectable mock implementations for Supabase client, AI gateway,
 * forecast state, and Thompson posteriors.
 */

// ── Mock Supabase Client ────────────────────────────────────────

export interface MockQueryResult {
  data: any;
  error: any;
}

export interface MockSupabaseConfig {
  /** Default response for any table query */
  defaultData?: any;
  /** Per-table overrides: { 'ai_forecast_state': { data: ..., error: ... } } */
  tableOverrides?: Record<string, MockQueryResult>;
  /** Simulate RPC responses */
  rpcOverrides?: Record<string, MockQueryResult>;
  /** Force all queries to error */
  forceError?: boolean;
  /** Force error message */
  errorMessage?: string;
}

/**
 * Creates a mock Supabase client with configurable responses.
 * Supports chaining: .from().select().eq().maybeSingle()
 */
export function createMockSupabase(config: MockSupabaseConfig = {}) {
  const getResult = (table: string): MockQueryResult => {
    if (config.forceError) {
      return { data: null, error: { message: config.errorMessage || 'Mock error' } };
    }
    if (config.tableOverrides?.[table]) {
      return config.tableOverrides[table];
    }
    return { data: config.defaultData ?? [], error: null };
  };

  const createChain = (table: string) => {
    const result = getResult(table);
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      neq: () => chain,
      gt: () => chain,
      gte: () => chain,
      lt: () => chain,
      lte: () => chain,
      in: () => chain,
      is: () => chain,
      limit: () => chain,
      order: () => chain,
      single: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
      then: (resolve: any) => resolve(result),
      insert: (data: any) => ({
        select: () => ({ single: () => Promise.resolve({ data, error: null }) }),
        then: (resolve: any) => resolve({ data, error: null }),
      }),
      upsert: (data: any) => ({
        then: (resolve: any) => resolve({ data, error: null }),
      }),
      update: (data: any) => ({
        eq: () => ({
          then: (resolve: any) => resolve({ data, error: null }),
          eq: () => ({ then: (resolve: any) => resolve({ data, error: null }) }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          then: (resolve: any) => resolve({ data: null, error: null }),
        }),
      }),
    };
    return chain;
  };

  return {
    from: (table: string) => createChain(table),
    rpc: (name: string, params?: any) => {
      if (config.rpcOverrides?.[name]) {
        return Promise.resolve(config.rpcOverrides[name]);
      }
      return Promise.resolve({ data: null, error: null });
    },
    functions: {
      invoke: (name: string, options?: any) => {
        return Promise.resolve({ data: null, error: null });
      },
    },
  };
}

// ── Mock Provider Metrics ───────────────────────────────────────

export interface MockProviderMetrics {
  provider: string;
  model: string;
  ewma_latency_ms: number;
  ewma_quality: number;
  ewma_cost_per_1k: number;
  ewma_success_rate: number;
  sample_count: number;
  cost_ewma: number;
  last_call_at: string | null;
  ts_alpha: number;
  ts_beta: number;
  ts_latency_mean: number;
  ts_latency_variance: number;
  ts_cost_mean: number;
  ts_cost_variance: number;
  scope: string;
}

export function createMockMetrics(overrides: Partial<MockProviderMetrics> = {}): MockProviderMetrics {
  return {
    provider: 'openai',
    model: 'gpt-5',
    ewma_latency_ms: 500,
    ewma_quality: 85,
    ewma_cost_per_1k: 0.005,
    ewma_success_rate: 0.95,
    sample_count: 100,
    cost_ewma: 0.005,
    last_call_at: new Date().toISOString(),
    ts_alpha: 50,
    ts_beta: 5,
    ts_latency_mean: 500,
    ts_latency_variance: 100,
    ts_cost_mean: 0.005,
    ts_cost_variance: 0.0001,
    scope: 'global',
    ...overrides,
  };
}

export function createCorruptedMetrics(): MockProviderMetrics {
  return createMockMetrics({
    ts_alpha: 0,
    ts_beta: 0,
    ts_latency_variance: -100,
    ts_cost_variance: -0.5,
    ewma_quality: NaN,
    cost_ewma: -1,
  });
}

// ── Mock Forecast State ─────────────────────────────────────────

export interface MockForecastState {
  projected_monthly_cost: number;
  burn_rate: number;
  sla_risk_level: string;
  performance_drift_score: number;
}

export function createMockForecast(overrides: Partial<MockForecastState> = {}): MockForecastState {
  return {
    projected_monthly_cost: 100,
    burn_rate: 3.33,
    sla_risk_level: 'low',
    performance_drift_score: 0.1,
    ...overrides,
  };
}

export function createNaNForecast(): MockForecastState {
  return {
    projected_monthly_cost: NaN,
    burn_rate: NaN,
    sla_risk_level: 'low',
    performance_drift_score: NaN,
  };
}

// ── Mock Budget Config ──────────────────────────────────────────

export interface MockBudgetConfig {
  monthly_budget: number;
  soft_limit_percentage: number;
  routing_mode: string;
  current_month_usage: number;
}

export function createMockBudget(overrides: Partial<MockBudgetConfig> = {}): MockBudgetConfig {
  return {
    monthly_budget: 500,
    soft_limit_percentage: 0.8,
    routing_mode: 'balanced',
    current_month_usage: 200,
    ...overrides,
  };
}

// ── Mock Provider Candidates ────────────────────────────────────

export function createMockCandidates(count = 3) {
  const providers = [
    { provider: 'openai', model: 'gpt-5', displayName: 'GPT-5' },
    { provider: 'gemini', model: 'gemini-2.5-flash', displayName: 'Gemini Flash' },
    { provider: 'anthropic', model: 'claude-4', displayName: 'Claude 4' },
    { provider: 'openai', model: 'gpt-5-mini', displayName: 'GPT-5 Mini' },
  ];
  return providers.slice(0, count).map(p => ({
    provider: p.provider,
    model: p.model,
    displayName: p.displayName,
  }));
}

// ── Chaos-Injected AI Gateway ───────────────────────────────────

export interface ChaosGatewayConfig {
  timeoutRate: number;       // 0.0 to 1.0
  errorRate: number;         // 0.0 to 1.0
  latencyMultiplier: number; // 1.0 = normal
  costMultiplier: number;    // 1.0 = normal
}

export function createChaosGateway(config: ChaosGatewayConfig) {
  let callCount = 0;

  return {
    call: async () => {
      callCount++;
      const random = Math.random();

      if (random < config.timeoutRate) {
        throw new Error('CHAOS: Gateway timeout');
      }
      if (random < config.timeoutRate + config.errorRate) {
        return { status: 500, error: 'CHAOS: Internal server error' };
      }

      return {
        status: 200,
        latencyMs: 500 * config.latencyMultiplier,
        cost: 0.005 * config.costMultiplier,
        result: 'mock-result',
      };
    },
    getCallCount: () => callCount,
    reset: () => { callCount = 0; },
  };
}
