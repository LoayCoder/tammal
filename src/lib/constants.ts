/**
 * Shared business constants used across the application.
 * Centralizes magic values to prevent divergent duplicates.
 */

/** Maximum number of questions allowed in a single batch */
export const MAX_BATCH_SIZE = 64;

/** Valid question types for the platform */
export const VALID_QUESTION_TYPES = [
  'likert_5',
  'numeric_scale',
  'yes_no',
  'open_ended',
  'multiple_choice',
] as const;

export type QuestionType = (typeof VALID_QUESTION_TYPES)[number];
