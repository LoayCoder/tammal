/**
 * Shared business constants — single source of truth.
 * Re-exports domain-specific configs for convenience.
 */

/** Valid question types for the platform */
export const VALID_QUESTION_TYPES = [
  'likert_5',
  'numeric_scale',
  'yes_no',
  'open_ended',
  'multiple_choice',
] as const;

export type QuestionType = (typeof VALID_QUESTION_TYPES)[number];

/** Complexity levels */
export const COMPLEXITY_LEVELS = ['simple', 'moderate', 'advanced'] as const;
export type ComplexityLevel = (typeof COMPLEXITY_LEVELS)[number];

/** Tone options */
export const TONE_OPTIONS = ['formal', 'casual', 'neutral'] as const;
export type ToneOption = (typeof TONE_OPTIONS)[number];

// Re-export domain configs
export { MAX_BATCH_SIZE } from './pagination';
export { DEFAULT_AI_MODEL, AI_ACCURACY_MODES, DEFAULT_ACCURACY_MODE, DEFAULT_AI_SETTINGS } from './ai';
export { MOOD_KEYS, DEFAULT_MOOD_META, MOOD_CHART_COLORS, FALLBACK_MOODS, getMoodStyle, MOOD_COLOR_STYLES, DEFAULT_MOOD_COLOR_STYLE } from './moods';
