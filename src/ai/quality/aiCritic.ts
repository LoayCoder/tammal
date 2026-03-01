/**
 * Optional AI Critic evaluator for generated questions.
 * Uses a small/fast model with hard timeout.
 * Gracefully degrades — if critic fails, heuristic score is used.
 *
 * NEVER sees customPrompt, documents, or frameworks.
 * No PII or question text in logs.
 */

import type { QualityFlag, QuestionQuality } from './types';

/** Critic timeout in ms — hard cap */
export const CRITIC_TIMEOUT_MS = 2_500;

/** Max questions to send to critic per batch */
export const MAX_CRITIC_QUESTIONS = 10;

/** Preferred model for critic (small/fast) */
export const CRITIC_MODEL = 'google/gemini-2.5-flash-lite';

/**
 * Input for a single question to the critic.
 * Minimal — no document bodies, no customPrompt.
 */
export interface CriticInput {
  question_text: string;
  type: string;
  purpose: 'survey' | 'wellness';
  category_id?: string | null;
  subcategory_id?: string | null;
}

/**
 * Expected output from the critic (Zod-validated in edge function).
 */
export interface CriticOutput {
  score: number;
  flags: QualityFlag[];
  reasons: string[];
}

/**
 * Combine heuristic and critic scores.
 * Weight: 70% heuristic, 30% critic.
 */
export function combineScores(
  heuristic: QuestionQuality,
  critic: CriticOutput | null,
): QuestionQuality {
  if (!critic) return heuristic;

  const combinedScore = Math.round(0.7 * heuristic.score + 0.3 * critic.score);

  // Merge flags (deduplicate)
  const flagSet = new Set<QualityFlag>([...heuristic.flags, ...critic.flags]);

  // Merge reasons (deduplicate)
  const reasonSet = new Set([...heuristic.reasons, ...critic.reasons]);

  return {
    score: Math.max(0, Math.min(100, combinedScore)),
    flags: Array.from(flagSet),
    reasons: Array.from(reasonSet),
  };
}
