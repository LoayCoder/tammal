/**
 * Deterministic heuristic scorer for generated questions.
 * No AI calls — always available as baseline.
 * No PII or question text in logs.
 */

import type { QualityFlag, QuestionQuality, BatchQuality } from './types';

// ── Constants ───────────────────────────────────────────────────

const MIN_QUESTION_CHARS = 20;
const MAX_QUESTION_CHARS = 220;

/** Leading language patterns (survey-only) */
const LEADING_PATTERNS = [
  /^don['']t you think/i,
  /^isn['']t it true/i,
  /^wouldn['']t you agree/i,
  /^don['']t you agree/i,
  /^surely you/i,
  /^obviously/i,
  /^clearly/i,
  /^everyone knows/i,
];

/** Unsafe content patterns — mental-health sensitive */
const UNSAFE_PATTERNS = [
  /\bself[- ]?harm\b/i,
  /\bsuicid/i,
  /\bkill\s+(your|my)self/i,
  /\bpersonal\s+data\s+request/i,
  /\bsocial\s+security/i,
  /\bcredit\s+card/i,
  /\bpassword/i,
];

// ── Duplicate Detection ─────────────────────────────────────────

/** Normalize text for duplicate comparison */
function normalizeForDedup(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect duplicate questions within a batch by normalized text.
 * Returns a Set of indices that are duplicates (keeps first occurrence).
 */
export function detectDuplicates(questions: { question_text: string }[]): Set<number> {
  const seen = new Map<string, number>();
  const duplicates = new Set<number>();

  for (let i = 0; i < questions.length; i++) {
    const normalized = normalizeForDedup(questions[i].question_text || '');
    if (!normalized) continue;

    const firstIndex = seen.get(normalized);
    if (firstIndex !== undefined) {
      duplicates.add(i);
    } else {
      seen.set(normalized, i);
    }
  }

  return duplicates;
}

// ── Single Question Scoring ─────────────────────────────────────

export interface HeuristicInput {
  question_text: string;
  question_text_ar?: string;
  type: string;
  options?: { text: string; text_ar: string }[];
  category_id?: string | null;
  subcategory_id?: string | null;
}

/**
 * Score a single question using deterministic heuristics.
 * @param q         The question to evaluate
 * @param purpose   'survey' | 'wellness'
 * @param isDuplicate Whether this question was flagged as duplicate in batch
 * @param allowedCatIds Optional set of allowed category IDs for mismatch check
 */
export function scoreQuestionHeuristics(
  q: HeuristicInput,
  purpose: 'survey' | 'wellness',
  isDuplicate = false,
  allowedCatIds?: Set<string>,
): QuestionQuality {
  let score = 100;
  const flags: QualityFlag[] = [];
  const reasons: string[] = [];

  const text = (q.question_text || '').trim();

  // 1. Length bounds
  if (text.length < MIN_QUESTION_CHARS) {
    score -= 25;
    flags.push('too_short');
    reasons.push(`Question under ${MIN_QUESTION_CHARS} chars`);
  }
  if (text.length > MAX_QUESTION_CHARS) {
    score -= 15;
    flags.push('too_long');
    reasons.push(`Question over ${MAX_QUESTION_CHARS} chars`);
  }

  // 2. Multiple questions in one (more than one '?')
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks > 1) {
    score -= 15;
    flags.push('format_issue');
    reasons.push('Contains multiple question marks (possible double-barreled)');
  }

  // 3. Leading language (survey only)
  if (purpose === 'survey') {
    for (const pattern of LEADING_PATTERNS) {
      if (pattern.test(text)) {
        score -= 20;
        flags.push('leading');
        reasons.push('Leading language detected');
        break;
      }
    }
  }

  // 4. Unsafe content
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      score -= 50;
      flags.push('unsafe');
      reasons.push('Potentially unsafe content detected');
      break;
    }
  }

  // 5. Duplicate
  if (isDuplicate) {
    score -= 30;
    flags.push('duplicate');
    reasons.push('Duplicate of another question in batch');
  }

  // 6. Category mismatch
  if (allowedCatIds && allowedCatIds.size > 0) {
    if (!q.category_id || !allowedCatIds.has(q.category_id)) {
      score -= 15;
      flags.push('category_mismatch');
      reasons.push('Category ID not in allowed set');
    }
  }

  // 7. Missing Arabic text (minor)
  if (!q.question_text_ar || q.question_text_ar.trim().length < 5) {
    score -= 5;
    reasons.push('Missing or very short Arabic translation');
  }

  // 8. Multiple choice without options
  if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
    score -= 10;
    flags.push('format_issue');
    reasons.push('Multiple choice question missing options');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    flags,
    reasons,
  };
}

// ── Batch Quality Decision ──────────────────────────────────────

/**
 * Evaluate an entire batch and determine the overall decision.
 */
export function evaluateBatch(
  qualities: QuestionQuality[],
): BatchQuality {
  if (qualities.length === 0) {
    return { averageScore: 0, invalidCount: 0, flaggedCount: 0, duplicatesCount: 0, overallDecision: 'regen_full' };
  }

  const avgScore = Math.round(
    qualities.reduce((sum, q) => sum + q.score, 0) / qualities.length,
  );

  const flaggedCount = qualities.filter(q => q.flags.length > 0).length;
  const duplicatesCount = qualities.filter(q => q.flags.includes('duplicate')).length;
  const unsafeCount = qualities.filter(q => q.flags.includes('unsafe')).length;
  const invalidCount = qualities.filter(q => q.score < 50).length;

  let overallDecision: BatchQuality['overallDecision'] = 'accept';

  if (avgScore < 70 || unsafeCount > 0) {
    overallDecision = 'regen_full';
  } else if (duplicatesCount >= 2) {
    overallDecision = 'regen_partial';
  }

  return {
    averageScore: avgScore,
    invalidCount,
    flaggedCount,
    duplicatesCount,
    overallDecision,
  };
}
