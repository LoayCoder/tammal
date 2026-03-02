/**
 * PR-AI-OPS-01: Chaos Injection Configuration
 *
 * Centralized chaos flag registry. All flags default to false.
 * Flags only exist in test code — no production code references them.
 * CHAOS_PRODUCTION_GUARD validates test environment before activation.
 */

// ── Production Guard ────────────────────────────────────────────
export const CHAOS_PRODUCTION_GUARD = typeof process !== 'undefined' &&
  (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true');

// ── Chaos Flags ─────────────────────────────────────────────────
export interface ChaosFlags {
  CHAOS_PROVIDER_FAILURE: boolean;
  CHAOS_COST_SPIKE: boolean;
  CHAOS_LATENCY_SPIKE: boolean;
  CHAOS_FORECAST_FAILURE: boolean;
  CHAOS_THOMPSON_CORRUPTION: boolean;
}

const DEFAULT_FLAGS: ChaosFlags = {
  CHAOS_PROVIDER_FAILURE: false,
  CHAOS_COST_SPIKE: false,
  CHAOS_LATENCY_SPIKE: false,
  CHAOS_FORECAST_FAILURE: false,
  CHAOS_THOMPSON_CORRUPTION: false,
};

let activeFlags: ChaosFlags = { ...DEFAULT_FLAGS };

/**
 * Enable specific chaos flags. Throws if not in test environment.
 */
export function enableChaos(flags: Partial<ChaosFlags>): void {
  if (!CHAOS_PRODUCTION_GUARD) {
    throw new Error('CHAOS: Cannot enable chaos flags outside test environment');
  }
  activeFlags = { ...activeFlags, ...flags };
}

/**
 * Reset all chaos flags to defaults.
 */
export function resetChaos(): void {
  activeFlags = { ...DEFAULT_FLAGS };
}

/**
 * Get current chaos flag state.
 */
export function getChaosFlags(): Readonly<ChaosFlags> {
  return { ...activeFlags };
}

/**
 * Check if a specific chaos flag is active.
 */
export function isChaosActive(flag: keyof ChaosFlags): boolean {
  return CHAOS_PRODUCTION_GUARD && activeFlags[flag];
}

// ── Chaos Scenario Presets ──────────────────────────────────────

export const CHAOS_PRESETS = {
  fullProviderOutage: { CHAOS_PROVIDER_FAILURE: true } as Partial<ChaosFlags>,
  costExplosion: { CHAOS_COST_SPIKE: true } as Partial<ChaosFlags>,
  cascadeFailure: {
    CHAOS_PROVIDER_FAILURE: true,
    CHAOS_COST_SPIKE: true,
    CHAOS_LATENCY_SPIKE: true,
  } as Partial<ChaosFlags>,
  totalChaos: {
    CHAOS_PROVIDER_FAILURE: true,
    CHAOS_COST_SPIKE: true,
    CHAOS_LATENCY_SPIKE: true,
    CHAOS_FORECAST_FAILURE: true,
    CHAOS_THOMPSON_CORRUPTION: true,
  } as Partial<ChaosFlags>,
} as const;
