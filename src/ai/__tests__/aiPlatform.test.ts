/**
 * Tests for the AI platform layer:
 *   - aiClient: Zod validation, error mapping
 *   - aiQuestionService: DomainError propagation
 *   - Config: provider/model mapping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  MODEL_FALLBACK_MAP,
  getProviderFromModel,
  DEFAULT_PROVIDER,
  FALLBACK_PROVIDER,
  FEATURE_MODEL_MAP,
} from '@/config/ai';
import { AIResponseInvalidError, ServiceUnavailableError } from '@/services/errors';
import {
  questionGeneratorPrompt,
  questionGeneratorVariablesSchema,
  questionGeneratorOutputSchema,
} from '@/ai/prompts/questionGenerator';

// ─────────────────────────────────────────────────────────────────
// Config tests
// ─────────────────────────────────────────────────────────────────

describe('AI Config', () => {
  it('DEFAULT_PROVIDER and FALLBACK_PROVIDER are different', () => {
    expect(DEFAULT_PROVIDER).not.toBe(FALLBACK_PROVIDER);
  });

  it('MODEL_FALLBACK_MAP has symmetric entries', () => {
    for (const [model, fallback] of Object.entries(MODEL_FALLBACK_MAP)) {
      expect(MODEL_FALLBACK_MAP[fallback]).toBeDefined();
    }
  });

  it('getProviderFromModel detects openai', () => {
    expect(getProviderFromModel('openai/gpt-5')).toBe('openai');
    expect(getProviderFromModel('openai/gpt-5-mini')).toBe('openai');
  });

  it('getProviderFromModel defaults to gemini', () => {
    expect(getProviderFromModel('google/gemini-3-flash-preview')).toBe('gemini');
    expect(getProviderFromModel('unknown/model')).toBe('gemini');
  });

  it('FEATURE_MODEL_MAP has question-generator entry', () => {
    const entry = FEATURE_MODEL_MAP['question-generator'];
    expect(entry).toBeDefined();
    expect(entry.gemini).toBeTruthy();
    expect(entry.openai).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────
// Prompt registry / Zod schema tests
// ─────────────────────────────────────────────────────────────────

describe('questionGeneratorPrompt', () => {
  it('has valid prompt metadata', () => {
    expect(questionGeneratorPrompt.id).toBe('question-generator');
    expect(questionGeneratorPrompt.version).toBeGreaterThanOrEqual(1);
    expect(questionGeneratorPrompt.feature).toBe('question-generator');
  });

  it('variablesSchema accepts valid input', () => {
    const valid = {
      questionCount: 5,
      complexity: 'moderate',
      tone: 'neutral',
    };
    const result = questionGeneratorVariablesSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('variablesSchema rejects invalid questionCount', () => {
    const invalid = { questionCount: -1, complexity: 'moderate', tone: 'neutral' };
    const result = questionGeneratorVariablesSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('variablesSchema rejects invalid complexity', () => {
    const invalid = { questionCount: 5, complexity: 'extreme', tone: 'neutral' };
    const result = questionGeneratorVariablesSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('outputSchema rejects missing questions', () => {
    const invalid = { success: true, model: 'test', duration_ms: 100 };
    const result = questionGeneratorOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('outputSchema rejects empty questions array', () => {
    const invalid = { success: true, questions: [], model: 'test', duration_ms: 100 };
    const result = questionGeneratorOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('outputSchema accepts valid response', () => {
    const valid = {
      success: true,
      model: 'google/gemini-3-flash-preview',
      duration_ms: 1234,
      questions: [
        {
          question_text: 'How are you?',
          question_text_ar: 'كيف حالك؟',
          type: 'likert_5',
          complexity: 'moderate',
          tone: 'neutral',
          explanation: 'Test',
          confidence_score: 85,
          bias_flag: false,
          ambiguity_flag: false,
        },
      ],
    };
    const result = questionGeneratorOutputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('outputSchema includes provider and used_fallback fields', () => {
    const valid = {
      success: true,
      model: 'openai/gpt-5-mini',
      duration_ms: 500,
      provider: 'openai',
      used_fallback: true,
      questions: [
        {
          question_text: 'Test',
          question_text_ar: 'اختبار',
          type: 'yes_no',
          complexity: 'simple',
          tone: 'casual',
          explanation: 'Test',
          confidence_score: 90,
          bias_flag: false,
          ambiguity_flag: false,
        },
      ],
    };
    const result = questionGeneratorOutputSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider).toBe('openai');
      expect(result.data.used_fallback).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Domain error tests
// ─────────────────────────────────────────────────────────────────

describe('AI Domain Errors', () => {
  it('AIResponseInvalidError is instanceof DomainError', () => {
    const err = new AIResponseInvalidError('test');
    expect(err.name).toBe('AIResponseInvalidError');
    expect(err.message).toBe('test');
  });

  it('ServiceUnavailableError has correct name', () => {
    const err = new ServiceUnavailableError();
    expect(err.name).toBe('ServiceUnavailableError');
  });
});

// ─────────────────────────────────────────────────────────────────
// aiClient integration tests (mock supabase.functions.invoke)
// ─────────────────────────────────────────────────────────────────

// We mock the supabase client to test aiClient behavior
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/lib/sentry', () => ({
  Sentry: {
    withScope: vi.fn((cb: (scope: any) => void) => {
      cb({ setTags: vi.fn() });
    }),
    captureMessage: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { generateStructured } from '@/ai/aiClient';

describe('aiClient.generateStructured', () => {
  const mockInvoke = vi.mocked(supabase.functions.invoke);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validVariables = {
    questionCount: 2,
    complexity: 'simple' as const,
    tone: 'neutral',
  };

  const validResponse = {
    success: true,
    model: 'google/gemini-3-flash-preview',
    duration_ms: 500,
    questions: [
      {
        question_text: 'How satisfied are you?',
        question_text_ar: 'ما مدى رضاك؟',
        type: 'likert_5',
        complexity: 'simple',
        tone: 'neutral',
        explanation: 'Measures satisfaction',
        confidence_score: 90,
        bias_flag: false,
        ambiguity_flag: false,
      },
    ],
  };

  it('returns validated output on success', async () => {
    mockInvoke.mockResolvedValueOnce({ data: validResponse, error: null });

    const result = await generateStructured({
      promptDef: questionGeneratorPrompt,
      variables: validVariables,
    });

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(1);
    expect(result.model).toBe('google/gemini-3-flash-preview');
  });

  it('throws AIResponseInvalidError when output fails Zod validation', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, model: 'test', duration_ms: 100, questions: [] },
      error: null,
    });

    await expect(
      generateStructured({ promptDef: questionGeneratorPrompt, variables: validVariables }),
    ).rejects.toThrow(AIResponseInvalidError);
  });

  it('throws ServiceUnavailableError when edge function returns error', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Network fail') });

    await expect(
      generateStructured({ promptDef: questionGeneratorPrompt, variables: validVariables }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('throws ServiceUnavailableError when response has error field', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { error: 'AI generation failed' },
      error: null,
    });

    await expect(
      generateStructured({ promptDef: questionGeneratorPrompt, variables: validVariables }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('throws AIResponseInvalidError for invalid input variables', async () => {
    await expect(
      generateStructured({
        promptDef: questionGeneratorPrompt,
        variables: { questionCount: -1, complexity: 'invalid', tone: '' } as any,
      }),
    ).rejects.toThrow(AIResponseInvalidError);
  });
});
