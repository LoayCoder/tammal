/**
 * Quality evaluation types for AI-generated questions.
 * Used by heuristic scorer, AI critic, and edge function.
 * No React imports. No PII.
 */

/** Flags that can be raised during quality evaluation */
export type QualityFlag =
  | 'duplicate'
  | 'too_long'
  | 'too_short'
  | 'unclear'
  | 'purpose_mismatch'
  | 'leading'
  | 'unsafe'
  | 'category_mismatch'
  | 'format_issue';

/** Quality assessment for a single question */
export interface QuestionQuality {
  /** 0–100 composite score */
  score: number;
  /** Raised quality flags */
  flags: QualityFlag[];
  /** Short, non-sensitive reason strings (no question text) */
  reasons: string[];
}

/** Quality assessment for an entire batch */
export interface BatchQuality {
  averageScore: number;
  invalidCount: number;
  flaggedCount: number;
  duplicatesCount: number;
  overallDecision: 'accept' | 'regen_partial' | 'regen_full';
}

/** Evaluation metadata version — bump when scoring rules change */
export const QUALITY_EVAL_VERSION = 1;
