/**
 * Tests for AI Quality Evaluation:
 *   - Duplicate detection
 *   - Length penalties
 *   - Unsafe flagging
 *   - Leading language detection
 *   - Batch decision logic
 *   - Critic graceful fallback
 *   - Score combination
 */

import { describe, it, expect } from 'vitest';
import {
  detectDuplicates,
  scoreQuestionHeuristics,
  evaluateBatch,
  type HeuristicInput,
} from '@/ai/quality/heuristics';
import { combineScores } from '@/ai/quality/aiCritic';
import type { QuestionQuality } from '@/ai/quality/types';
import { QUALITY_EVAL_VERSION } from '@/ai/quality/types';

// ─────────────────────────────────────────────────────────────────
// Duplicate Detection
// ─────────────────────────────────────────────────────────────────

describe('detectDuplicates', () => {
  it('returns empty set for unique questions', () => {
    const questions = [
      { question_text: 'How satisfied are you with your work?' },
      { question_text: 'Do you feel supported by your manager?' },
      { question_text: 'Rate your overall engagement level.' },
    ];
    const dups = detectDuplicates(questions);
    expect(dups.size).toBe(0);
  });

  it('detects exact duplicates', () => {
    const questions = [
      { question_text: 'How are you feeling today?' },
      { question_text: 'How are you feeling today?' },
    ];
    const dups = detectDuplicates(questions);
    expect(dups.size).toBe(1);
    expect(dups.has(1)).toBe(true);
    expect(dups.has(0)).toBe(false);
  });

  it('detects duplicates ignoring case and punctuation', () => {
    const questions = [
      { question_text: 'How are you feeling today?' },
      { question_text: 'how are you feeling today' },
    ];
    const dups = detectDuplicates(questions);
    expect(dups.size).toBe(1);
  });

  it('keeps first occurrence, marks later ones', () => {
    const questions = [
      { question_text: 'Alpha question here?' },
      { question_text: 'Beta question here?' },
      { question_text: 'Alpha question here?' },
      { question_text: 'Alpha question here?' },
    ];
    const dups = detectDuplicates(questions);
    expect(dups.has(0)).toBe(false);
    expect(dups.has(2)).toBe(true);
    expect(dups.has(3)).toBe(true);
    expect(dups.size).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────
// Heuristic Scoring
// ─────────────────────────────────────────────────────────────────

describe('scoreQuestionHeuristics', () => {
  const makeQ = (overrides: Partial<HeuristicInput> = {}): HeuristicInput => ({
    question_text: 'How satisfied are you with your current work environment and daily tasks?',
    question_text_ar: 'ما مدى رضاك عن بيئة العمل الحالية ومهامك اليومية؟',
    type: 'likert_5',
    ...overrides,
  });

  it('gives high score to a well-formed question', () => {
    const result = scoreQuestionHeuristics(makeQ(), 'survey');
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.flags).toHaveLength(0);
  });

  it('penalizes too-short questions', () => {
    const result = scoreQuestionHeuristics(makeQ({ question_text: 'How are you?' }), 'survey');
    expect(result.flags).toContain('too_short');
    expect(result.score).toBeLessThan(80);
  });

  it('penalizes too-long questions', () => {
    const longText = 'A'.repeat(250) + '?';
    const result = scoreQuestionHeuristics(makeQ({ question_text: longText }), 'survey');
    expect(result.flags).toContain('too_long');
  });

  it('flags multiple question marks', () => {
    const result = scoreQuestionHeuristics(
      makeQ({ question_text: 'Are you happy? Do you feel engaged? Is your manager supportive?' }),
      'survey',
    );
    expect(result.flags).toContain('format_issue');
  });

  it('flags leading language in survey mode', () => {
    const result = scoreQuestionHeuristics(
      makeQ({ question_text: "Don't you think the company is doing great things for employees?" }),
      'survey',
    );
    expect(result.flags).toContain('leading');
  });

  it('does NOT flag leading language in wellness mode', () => {
    const result = scoreQuestionHeuristics(
      makeQ({ question_text: "Don't you think you deserve some rest today after a busy week?" }),
      'wellness',
    );
    expect(result.flags).not.toContain('leading');
  });

  it('flags unsafe content with big penalty', () => {
    const result = scoreQuestionHeuristics(
      makeQ({ question_text: 'Have you ever thought about self-harm during stressful periods at work?' }),
      'wellness',
    );
    expect(result.flags).toContain('unsafe');
    expect(result.score).toBeLessThanOrEqual(55);
  });

  it('flags duplicate when isDuplicate=true', () => {
    const result = scoreQuestionHeuristics(makeQ(), 'survey', true);
    expect(result.flags).toContain('duplicate');
    expect(result.score).toBeLessThan(80);
  });

  it('flags category mismatch when ID not in allowed set', () => {
    const allowed = new Set(['cat-1', 'cat-2']);
    const result = scoreQuestionHeuristics(
      makeQ({ category_id: 'cat-999' }),
      'survey', false, allowed,
    );
    expect(result.flags).toContain('category_mismatch');
  });

  it('does not flag category when ID is in allowed set', () => {
    const allowed = new Set(['cat-1', 'cat-2']);
    const result = scoreQuestionHeuristics(
      makeQ({ category_id: 'cat-1' }),
      'survey', false, allowed,
    );
    expect(result.flags).not.toContain('category_mismatch');
  });

  it('flags MC question without options', () => {
    const result = scoreQuestionHeuristics(
      makeQ({ type: 'multiple_choice', options: [] }),
      'survey',
    );
    expect(result.flags).toContain('format_issue');
  });

  it('score never goes below 0', () => {
    // Stack multiple penalties
    const result = scoreQuestionHeuristics(
      makeQ({ question_text: 'self-harm?', question_text_ar: '', category_id: 'bad' }),
      'survey', true, new Set(['cat-1']),
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Batch Decision Logic
// ─────────────────────────────────────────────────────────────────

describe('evaluateBatch', () => {
  it('accepts a clean batch', () => {
    const qualities: QuestionQuality[] = [
      { score: 95, flags: [], reasons: [] },
      { score: 90, flags: [], reasons: [] },
      { score: 88, flags: [], reasons: [] },
    ];
    const batch = evaluateBatch(qualities);
    expect(batch.overallDecision).toBe('accept');
    expect(batch.averageScore).toBeGreaterThanOrEqual(88);
  });

  it('triggers regen_full when average < 70', () => {
    const qualities: QuestionQuality[] = [
      { score: 60, flags: ['too_short'], reasons: ['short'] },
      { score: 50, flags: ['leading'], reasons: ['leading'] },
      { score: 65, flags: [], reasons: [] },
    ];
    const batch = evaluateBatch(qualities);
    expect(batch.overallDecision).toBe('regen_full');
  });

  it('triggers regen_full when unsafe detected', () => {
    const qualities: QuestionQuality[] = [
      { score: 90, flags: [], reasons: [] },
      { score: 40, flags: ['unsafe'], reasons: ['unsafe'] },
      { score: 95, flags: [], reasons: [] },
    ];
    const batch = evaluateBatch(qualities);
    expect(batch.overallDecision).toBe('regen_full');
  });

  it('triggers regen_partial when >= 2 duplicates', () => {
    const qualities: QuestionQuality[] = [
      { score: 85, flags: [], reasons: [] },
      { score: 70, flags: ['duplicate'], reasons: [] },
      { score: 72, flags: ['duplicate'], reasons: [] },
    ];
    const batch = evaluateBatch(qualities);
    expect(batch.overallDecision).toBe('regen_partial');
    expect(batch.duplicatesCount).toBe(2);
  });

  it('returns regen_full for empty batch', () => {
    const batch = evaluateBatch([]);
    expect(batch.overallDecision).toBe('regen_full');
    expect(batch.averageScore).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Critic Score Combination
// ─────────────────────────────────────────────────────────────────

describe('combineScores', () => {
  it('returns heuristic score when critic is null', () => {
    const heuristic: QuestionQuality = { score: 85, flags: ['too_long'], reasons: ['Over max'] };
    const result = combineScores(heuristic, null);
    expect(result).toEqual(heuristic);
  });

  it('blends 70/30 when critic is available', () => {
    const heuristic: QuestionQuality = { score: 80, flags: [], reasons: [] };
    const critic = { score: 60, flags: ['unclear' as const], reasons: ['Vague wording'] };
    const result = combineScores(heuristic, critic);
    // 0.7*80 + 0.3*60 = 56+18 = 74
    expect(result.score).toBe(74);
    expect(result.flags).toContain('unclear');
    expect(result.reasons).toContain('Vague wording');
  });

  it('merges and deduplicates flags', () => {
    const heuristic: QuestionQuality = { score: 90, flags: ['too_long'], reasons: ['Over max'] };
    const critic = { score: 80, flags: ['too_long' as const, 'unclear' as const], reasons: ['Over max', 'Needs clarity'] };
    const result = combineScores(heuristic, critic);
    expect(result.flags).toEqual(['too_long', 'unclear']);
    expect(result.reasons).toEqual(['Over max', 'Needs clarity']);
  });

  it('clamps combined score to 0-100', () => {
    const heuristic: QuestionQuality = { score: 0, flags: ['unsafe'], reasons: [] };
    const critic = { score: 0, flags: ['unsafe' as const], reasons: [] };
    const result = combineScores(heuristic, critic);
    expect(result.score).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Eval version
// ─────────────────────────────────────────────────────────────────

describe('qualityTypes', () => {
  it('has a quality eval version', () => {
    expect(QUALITY_EVAL_VERSION).toBe(1);
  });
});
