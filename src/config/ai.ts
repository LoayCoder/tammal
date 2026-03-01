/**
 * AI configuration constants — single source of truth.
 */

// ── Provider types ──────────────────────────────────────────────
export type ProviderName = 'gemini' | 'openai';

/** Default provider for all AI features */
export const DEFAULT_PROVIDER: ProviderName = 'gemini';

/** Fallback provider when the primary fails */
export const FALLBACK_PROVIDER: ProviderName = 'openai';

/** Default AI model identifier */
export const DEFAULT_AI_MODEL = 'google/gemini-3-flash-preview';

// ── Provider ↔ model fallback map ───────────────────────────────
/**
 * Maps each model_key to its cross-provider equivalent.
 * Used by the edge function to attempt a fallback on failure.
 * Keys MUST match ai_models.model_key values in the DB.
 */
export const MODEL_FALLBACK_MAP: Record<string, string> = {
  // Gemini → OpenAI
  'google/gemini-3-flash-preview': 'openai/gpt-5-mini',
  'google/gemini-3-pro-preview':   'openai/gpt-5',
  'google/gemini-2.5-flash':       'openai/gpt-5-mini',
  'google/gemini-2.5-flash-lite':  'openai/gpt-5-nano',
  'google/gemini-2.5-pro':         'openai/gpt-5',
  // OpenAI → Gemini
  'openai/gpt-5':                  'google/gemini-2.5-pro',
  'openai/gpt-5-mini':             'google/gemini-2.5-flash',
  'openai/gpt-5-nano':             'google/gemini-2.5-flash-lite',
};

/** Derive provider name from a model_key string */
export function getProviderFromModel(modelKey: string): ProviderName {
  if (modelKey.startsWith('openai/')) return 'openai';
  return 'gemini';
}

// ── Feature-specific model preferences ──────────────────────────
export const FEATURE_MODEL_MAP: Record<string, { gemini: string; openai: string }> = {
  'question-generator': {
    gemini: 'google/gemini-3-flash-preview',
    openai: 'openai/gpt-5-mini',
  },
};

// ── Retry / timeout ─────────────────────────────────────────────
/** Timeout for a single AI gateway call (ms) */
export const AI_TIMEOUT_MS = 120_000;

// ── Token / context budgeting ───────────────────────────────────
/** Hard cap on total system prompt characters (≈50k tokens) */
export const MAX_CONTEXT_CHARS = 200_000;

/** Max characters for a single custom user directive */
export const MAX_CUSTOM_PROMPT_CHARS = 2_000;

/** Max characters for all document context combined */
export const MAX_DOCUMENT_CONTEXT_CHARS = 32_000;

/** Max characters for all framework context combined */
export const MAX_FRAMEWORK_CONTEXT_CHARS = 32_000;

/** Maximum retries (including the one fallback attempt) */
export const AI_MAX_RETRIES = 1;

// ── Rate limiting ───────────────────────────────────────────────
/** Per-user request limit within one rate-limit window */
export const RATE_LIMIT_PER_USER = 30;

/** Per-tenant request limit within one rate-limit window */
export const RATE_LIMIT_PER_TENANT = 200;

/** Rate limit window size in minutes */
export const RATE_LIMIT_WINDOW_MINUTES = 10;

/** Accuracy modes */
export const AI_ACCURACY_MODES = ['standard', 'strict'] as const;
export type AIAccuracyMode = (typeof AI_ACCURACY_MODES)[number];

/** Default accuracy mode */
export const DEFAULT_ACCURACY_MODE: AIAccuracyMode = 'standard';

/** Default AI generation settings */
export const DEFAULT_AI_SETTINGS = {
  questionCount: 5,
  complexity: 'moderate',
  tone: 'neutral',
  language: 'both',
  requireExplanation: true,
  enableBiasDetection: true,
  enableAmbiguityDetection: true,
  enableDuplicateDetection: true,
  enableCriticPass: false,
  minWordLength: 5,
} as const;
