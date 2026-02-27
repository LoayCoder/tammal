/**
 * AI configuration constants — single source of truth.
 */

/** Default AI model identifier */
export const DEFAULT_AI_MODEL = 'google/gemini-3-flash-preview';

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
